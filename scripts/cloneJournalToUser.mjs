/**
 * Clone cloud journal (beans, shots, cafes, photos) from one Supabase user to another.
 *
 * Requires service-role access (bypasses RLS). Never commit credentials.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/cloneJournalToUser.mjs --target test@withdevo.net
 *
 * Optional:
 *   --source you@gmail.com   (default: user with the most journal rows, excluding target)
 *   --from-env .env.vercel.clone  (not --env-file: Node 25 treats that as a Node flag)
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const PHOTO_BUCKET = 'journal-photos';

function firstEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return false;
  }

  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const withoutExport = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
    const eq = withoutExport.indexOf('=');
    if (eq === -1) continue;
    const key = withoutExport.slice(0, eq).trim();
    let value = withoutExport.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1).trim();
    }
    if (value) process.env[key] = value;
  }
  return true;
}

function loadEnvFiles(paths) {
  for (const path of paths) {
    loadEnvFile(path);
  }
}

function parseArgs(argv) {
  const args = {
    target: 'test@withdevo.net',
    source: null,
    dryRun: false,
    envFiles: [],
  };
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--target' && argv[i + 1]) args.target = argv[++i];
    else if (token === '--source' && argv[i + 1]) args.source = argv[++i];
    else if ((token === '--from-env' || token === '--env-file') && argv[i + 1]) {
      args.envFiles.push(argv[++i]);
    } else if (token === '--dry-run') args.dryRun = true;
  }
  return args;
}

function collectPhotoIds(beans, shots, cafes) {
  const ids = new Set();
  for (const bean of beans) {
    for (const photo of bean.photos ?? []) ids.add(photo.id);
  }
  for (const shot of shots) {
    for (const photo of shot.photos ?? []) ids.add(photo.id);
  }
  for (const cafe of cafes) {
    for (const photo of cafe.photos ?? []) ids.add(photo.id);
  }
  return [...ids];
}

/** Postgres PK is global `id` — clone must assign new bean/cafe/shot ids (photos keep ids; storage is per-user). */
function remapJournalIds(beans, shots, cafes) {
  const beanIdMap = new Map();
  const cafeIdMap = new Map();

  const remappedBeans = beans.map((bean) => {
    const newId = randomUUID();
    beanIdMap.set(bean.id, newId);
    return { ...structuredClone(bean), id: newId };
  });

  const remappedCafes = cafes.map((cafe) => {
    const newId = randomUUID();
    cafeIdMap.set(cafe.id, newId);
    return { ...structuredClone(cafe), id: newId };
  });

  const remappedShots = shots.map((shot) => {
    const newId = randomUUID();
    const next = { ...structuredClone(shot), id: newId };
    if (beanIdMap.has(shot.beanId)) next.beanId = beanIdMap.get(shot.beanId);
    if (shot.cafeId && cafeIdMap.has(shot.cafeId)) next.cafeId = cafeIdMap.get(shot.cafeId);
    return next;
  });

  return { beans: remappedBeans, shots: remappedShots, cafes: remappedCafes };
}

async function listAllUsers(admin) {
  const users = [];
  let page = 1;
  const perPage = 200;
  while (true) {
    const { data, error } = await admin.listUsers({ page, perPage });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }
  return users;
}

function findUserByEmail(users, email) {
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email?.toLowerCase() === normalized);
}

async function countRows(supabase, table, userId) {
  const { count, error } = await supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count ?? 0;
}

async function loadDocuments(supabase, table, userId) {
  const { data, error } = await supabase.from(table).select('id, document').eq('user_id', userId);
  if (error) throw error;
  return data ?? [];
}

async function deleteUserJournal(supabase, userId) {
  for (const table of ['beans', 'shots', 'cafes']) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error && !error.message.includes('cafes')) throw error;
  }

  const folder = userId;
  const { data: objects, error: listError } = await supabase.storage.from(PHOTO_BUCKET).list(folder);
  if (listError) throw listError;
  if (objects?.length) {
    const paths = objects.map((obj) => `${folder}/${obj.name}`);
    const { error: removeError } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
    if (removeError) throw removeError;
  }
}

async function copyPhotos(supabase, sourceUserId, targetUserId, photoIds) {
  let copied = 0;
  let missing = 0;

  for (const photoId of photoIds) {
    const sourcePath = `${sourceUserId}/${photoId}`;
    const targetPath = `${targetUserId}/${photoId}`;

    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).download(sourcePath);
    if (error || !data) {
      missing += 1;
      continue;
    }

    const { error: uploadError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(targetPath, data, {
        upsert: true,
        contentType: data.type || 'application/octet-stream',
      });
    if (uploadError) throw uploadError;
    copied += 1;
  }

  return { copied, missing };
}

async function main() {
  const { target, source, dryRun, envFiles } = parseArgs(process.argv);

  const filesToLoad = [...envFiles];
  if (!filesToLoad.includes('.env.clone.local') && existsSync('.env.clone.local')) {
    filesToLoad.push('.env.clone.local');
  }

  if (filesToLoad.length === 0) {
    filesToLoad.push('.env.vercel.clone');
  }

  let loadedAny = false;
  for (const file of filesToLoad) {
    if (loadEnvFile(file)) loadedAny = true;
  }

  if (!loadedAny) {
    console.error('No env file found. Run: vercel env pull .env.vercel.clone --environment=production --yes');
    console.error('Then add Supabase secret key to .env.clone.local (see .env.clone.local.example).');
    process.exit(1);
  }

  const url = firstEnv('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
  const serviceKey = firstEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_SECRET_KEY',
    'SUPABASE_SERVICE_KEY',
  );

  if (!url || !serviceKey) {
    console.error('Missing Supabase URL or service/secret key.');
    console.error(
      'Vercel omits sensitive keys from env pull (SUPABASE_SECRET_KEY / SERVICE_ROLE_KEY are empty in the file).',
    );
    console.error(
      'Copy the secret key from Supabase Dashboard → Project Settings → API into .env.clone.local:',
    );
    console.error('  cp .env.clone.local.example .env.clone.local');
    console.error('  # edit .env.clone.local — set SUPABASE_SECRET_KEY=sb_secret_…');
    console.error(`Checked files: ${filesToLoad.join(', ')}`);
    console.error(`URL set: ${Boolean(url)}`);
    console.error(
      `Service key set: ${Boolean(
        firstEnv('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_KEY'),
      )}`,
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const users = await listAllUsers(supabase.auth.admin);
  const targetUser = findUserByEmail(users, target);
  if (!targetUser) {
    console.error(`Target user not found: ${target}`);
    console.error('Create the user in Supabase Authentication → Users first.');
    process.exit(1);
  }

  let sourceUser;
  if (source) {
    sourceUser = findUserByEmail(users, source);
    if (!sourceUser) {
      console.error(`Source user not found: ${source}`);
      process.exit(1);
    }
  } else {
    const candidates = users.filter((u) => u.id !== targetUser.id);
    const scored = [];
    for (const user of candidates) {
      const beans = await countRows(supabase, 'beans', user.id);
      const shots = await countRows(supabase, 'shots', user.id);
      const cafes = await countRows(supabase, 'cafes', user.id);
      scored.push({ user, beans, shots, cafes, total: beans + shots + cafes });
    }
    scored.sort((a, b) => b.total - a.total);
    sourceUser = scored[0]?.user;
    if (!sourceUser || scored[0].total === 0) {
      console.error('No source journal found. Pass --source <operator-email>.');
      process.exit(1);
    }
    console.log(
      `Auto-selected source: ${sourceUser.email ?? sourceUser.id} (${scored[0].beans} beans, ${scored[0].shots} shots, ${scored[0].cafes} cafes)`,
    );
  }

  if (dryRun) {
    for (const user of users) {
      const beans = await countRows(supabase, 'beans', user.id);
      const shots = await countRows(supabase, 'shots', user.id);
      const cafes = await countRows(supabase, 'cafes', user.id);
      console.log(
        `${user.email ?? 'no-email'} | ${user.id} | beans=${beans} shots=${shots} cafes=${cafes}`,
      );
    }
    return;
  }

  if (sourceUser.id === targetUser.id) {
    console.error('Source and target must be different users.');
    process.exit(1);
  }

  console.log(`Source: ${sourceUser.email ?? sourceUser.id}`);
  console.log(`Target: ${targetUser.email ?? targetUser.id}`);

  const sourceBeans = await loadDocuments(supabase, 'beans', sourceUser.id);
  const sourceShots = await loadDocuments(supabase, 'shots', sourceUser.id);
  let sourceCafes = [];
  try {
    sourceCafes = await loadDocuments(supabase, 'cafes', sourceUser.id);
  } catch {
    sourceCafes = [];
  }

  const beans = sourceBeans.map((r) => r.document);
  const shots = sourceShots.map((r) => r.document);
  const cafes = sourceCafes.map((r) => r.document);

  const remapped = remapJournalIds(beans, shots, cafes);
  const photoIds = collectPhotoIds(remapped.beans, remapped.shots, remapped.cafes);

  console.log(
    `Cloning ${remapped.beans.length} beans, ${remapped.shots.length} shots, ${remapped.cafes.length} cafes, ${photoIds.length} photo refs (new entity ids for target user)…`,
  );

  await deleteUserJournal(supabase, targetUser.id);

  const now = new Date().toISOString();
  if (remapped.beans.length) {
    const { error } = await supabase.from('beans').insert(
      remapped.beans.map((document) => ({
        id: document.id,
        user_id: targetUser.id,
        document,
        updated_at: now,
      })),
    );
    if (error) throw error;
  }

  if (remapped.shots.length) {
    const { error } = await supabase.from('shots').insert(
      remapped.shots.map((document) => ({
        id: document.id,
        user_id: targetUser.id,
        document,
        updated_at: now,
      })),
    );
    if (error) throw error;
  }

  if (remapped.cafes.length) {
    const { error } = await supabase.from('cafes').insert(
      remapped.cafes.map((document) => ({
        id: document.id,
        user_id: targetUser.id,
        document,
        updated_at: now,
      })),
    );
    if (error) throw error;
  }

  const photoResult = await copyPhotos(supabase, sourceUser.id, targetUser.id, photoIds);
  console.log(`Photos copied: ${photoResult.copied}; missing in storage: ${photoResult.missing}`);
  console.log('Done. Target user can sign in at /test-login and use the journal at /.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
