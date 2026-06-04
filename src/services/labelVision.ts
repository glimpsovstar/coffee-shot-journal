import type { BagSize, BeanDraft, BeanKind } from '../types';
import { BAG_SIZES } from '../utils/beans';

export interface LabelScanResult {
  draft: BeanDraft;
  warnings: string[];
}

export function isLabelScanAvailable(): boolean {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function parseBagSize(value: unknown): BagSize | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/\s/g, '').toLowerCase();
  const match = BAG_SIZES.find((s) => s.toLowerCase() === normalized);
  return match;
}

function parseKind(value: unknown, originText: string): BeanKind | undefined {
  if (value === 'single_origin' || value === 'blend') return value;
  const lower = originText.toLowerCase();
  if (lower.includes('blend')) return 'blend';
  if (lower.includes('single origin') || lower.includes('single-origin')) {
    return 'single_origin';
  }
  return undefined;
}

function parseDraftFromJson(raw: unknown): LabelScanResult {
  const warnings: string[] = [];
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const originOrBlend =
    typeof obj.originOrBlend === 'string' ? obj.originOrBlend : '';
  const kind = parseKind(obj.kind, originOrBlend);

  const draft: BeanDraft = {
    name: typeof obj.name === 'string' ? obj.name : undefined,
    roaster: typeof obj.roaster === 'string' ? obj.roaster : undefined,
    kind,
    originOrBlend: originOrBlend || undefined,
    roastDate: typeof obj.roastDate === 'string' ? obj.roastDate : undefined,
    purchaseDate: typeof obj.purchaseDate === 'string' ? obj.purchaseDate : undefined,
    bagSize: parseBagSize(obj.bagSize),
    tastingNotes: typeof obj.tastingNotes === 'string' ? obj.tastingNotes : undefined,
  };

  if (Array.isArray(obj.blendComponents)) {
    draft.blendComponents = obj.blendComponents
      .filter((c) => c && typeof c === 'object')
      .map((c) => {
        const row = c as Record<string, unknown>;
        return {
          name: typeof row.name === 'string' ? row.name : '',
          percent: typeof row.percent === 'number' ? row.percent : Number(row.percent) || 0,
        };
      });
  }

  if (!draft.name) warnings.push('Name was not detected — please enter manually.');
  if (!draft.roaster) warnings.push('Roaster was not detected — please enter manually.');

  return { draft, warnings };
}

export async function scanLabelFromBlob(blob: Blob): Promise<LabelScanResult> {
  if (!isLabelScanAvailable()) {
    throw new Error(
      'Label scan is not configured. Add VITE_OPENAI_API_KEY to .env.local or enter details manually.',
    );
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  const base64 = await blobToBase64(blob);
  const mimeType = blob.type || 'image/jpeg';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You extract coffee bag label fields for an espresso journal. Return JSON only with keys: name, roaster, kind ("single_origin"|"blend"), originOrBlend, blendComponents (array of {name, percent} when blend), roastDate (YYYY-MM-DD), purchaseDate (YYYY-MM-DD if unknown use roastDate), bagSize ("200g"|"250g"|"500g"|"1kg"), tastingNotes. Use null for unknown fields.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract bean information from this coffee bag label image.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Label scan failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Label scan returned an empty response.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Label scan returned invalid JSON.');
  }

  return parseDraftFromJson(parsed);
}
