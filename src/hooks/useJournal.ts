import { useCallback, useEffect, useRef, useState } from 'react';
import { isCloudEnabled } from '../lib/cloudConfig';
import {
  deletePhotoBlob,
  getPhotoBlob,
  loadJournal,
  putPhotoBlob,
  saveBeans,
  saveCafes,
  saveShots,
} from '../storage/journalRepository';
import {
  deletePhotoBlobFromCloud,
  getPhotoBlobFromCloud,
  loadJournalFromCloud,
  putPhotoBlobToCloud,
  saveBeansToCloud,
  saveCafesToCloud,
  saveShotsToCloud,
} from '../storage/supabaseJournalRepository';
import type {
  AddBeanPayload,
  AddCafePayload,
  AddCafeVisitPayload,
  AddShotPayload,
  Bean,
  Cafe,
  Photo,
  PhotoBlobInput,
  PhotoDisplay,
  Shot,
} from '../types';
import { createPhotoObjectUrl, revokePhotoObjectUrl } from '../utils/photos';

export type { PhotoDisplay };

function journalErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}

function collectPhotos(beans: Bean[], shots: Shot[], cafes: Cafe[]): Photo[] {
  return [
    ...beans.flatMap((b) => b.photos),
    ...shots.flatMap((s) => s.photos),
    ...cafes.flatMap((c) => c.photos),
  ];
}

export function useJournal(cloudUserId: string | null) {
  const useCloud = isCloudEnabled() && cloudUserId !== null;
  const userId = cloudUserId ?? '';

  const [beans, setBeans] = useState<Bean[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const beansRef = useRef<Bean[]>([]);
  const shotsRef = useRef<Shot[]>([]);
  const cafesRef = useRef<Cafe[]>([]);
  const photoUrlsRef = useRef<Map<string, string>>(new Map());
  const mutationQueueRef = useRef<Promise<void>>(Promise.resolve());

  const replaceJournalData = useCallback((data: { beans: Bean[]; shots: Shot[]; cafes: Cafe[] }) => {
    beansRef.current = data.beans;
    shotsRef.current = data.shots;
    cafesRef.current = data.cafes;
    setBeans(data.beans);
    setShots(data.shots);
    setCafes(data.cafes);
  }, []);

  const enqueueMutation = useCallback(<T,>(mutation: () => Promise<T>): Promise<T> => {
    const run = mutationQueueRef.current.then(mutation, mutation);
    mutationQueueRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const syncPhotoUrlsRef = useCallback((urls: Map<string, string>) => {
    photoUrlsRef.current = urls;
    setPhotoUrls(urls);
  }, []);

  const getBlob = useCallback(
    async (photoId: string): Promise<Blob | undefined> => {
      if (useCloud) return getPhotoBlobFromCloud(userId, photoId);
      return getPhotoBlob(photoId);
    },
    [useCloud, userId],
  );

  const hydratePhotoUrls = useCallback(
    async (beansData: Bean[], shotsData: Shot[], cafesData: Cafe[]) => {
      const photos = collectPhotos(beansData, shotsData, cafesData);
      const next = new Map<string, string>();

      for (const photo of photos) {
        const blob = await getBlob(photo.id);
        if (blob) {
          next.set(photo.id, createPhotoObjectUrl(blob));
        }
      }

      photoUrlsRef.current.forEach((url) => revokePhotoObjectUrl(url));
      syncPhotoUrlsRef(next);
    },
    [getBlob, syncPhotoUrlsRef],
  );

  const loadJournalData = useCallback(async () => {
    if (useCloud) return loadJournalFromCloud(userId);
    return loadJournal();
  }, [useCloud, userId]);

  const reloadJournal = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadJournalData();
      replaceJournalData(data);
      await hydratePhotoUrls(data.beans, data.shots, data.cafes);
    } catch (err) {
      setError(journalErrorMessage(err, 'Failed to load journal'));
    } finally {
      setLoading(false);
    }
  }, [hydratePhotoUrls, loadJournalData, replaceJournalData]);

  const registerPhotoUrls = useCallback(
    (inputs: PhotoBlobInput[]) => {
      const next = new Map(photoUrlsRef.current);
      for (const { photo, blob } of inputs) {
        const existing = next.get(photo.id);
        if (existing) revokePhotoObjectUrl(existing);
        next.set(photo.id, createPhotoObjectUrl(blob));
      }
      syncPhotoUrlsRef(next);
    },
    [syncPhotoUrlsRef],
  );

  const unregisterPhotoUrl = useCallback(
    (photoId: string) => {
      const next = new Map(photoUrlsRef.current);
      const existing = next.get(photoId);
      if (existing) {
        revokePhotoObjectUrl(existing);
        next.delete(photoId);
        syncPhotoUrlsRef(next);
      }
    },
    [syncPhotoUrlsRef],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await loadJournalData();
        if (cancelled) return;
        replaceJournalData(data);
        await hydratePhotoUrls(data.beans, data.shots, data.cafes);
      } catch (err) {
        if (!cancelled) {
          setError(journalErrorMessage(err, 'Failed to load journal'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      photoUrlsRef.current.forEach((url) => revokePhotoObjectUrl(url));
    };
  }, [hydratePhotoUrls, loadJournalData, replaceJournalData]);

  const resolvePhotos = useCallback(
    (photos: Photo[]): PhotoDisplay[] =>
      photos
        .map((photo) => {
          const url = photoUrls.get(photo.id);
          return url ? { photo, url } : null;
        })
        .filter((item): item is PhotoDisplay => item !== null),
    [photoUrls],
  );

  const storePhotoBlob = useCallback(
    async (photoId: string, blob: Blob) => {
      if (useCloud) await putPhotoBlobToCloud(userId, photoId, blob);
      else await putPhotoBlob(photoId, blob);
    },
    [useCloud, userId],
  );

  const removePhotoBlob = useCallback(
    async (photoId: string) => {
      if (useCloud) await deletePhotoBlobFromCloud(userId, photoId);
      else await deletePhotoBlob(photoId);
    },
    [useCloud, userId],
  );

  const persistBeans = useCallback(
    async (nextBeans: Bean[]) => {
      if (useCloud) await saveBeansToCloud(userId, nextBeans);
      else await saveBeans(nextBeans);
    },
    [useCloud, userId],
  );

  const persistShots = useCallback(
    async (nextShots: Shot[]) => {
      if (useCloud) await saveShotsToCloud(userId, nextShots);
      else await saveShots(nextShots);
    },
    [useCloud, userId],
  );

  const persistCafes = useCallback(
    async (nextCafes: Cafe[]) => {
      if (useCloud) await saveCafesToCloud(userId, nextCafes);
      else await saveCafes(nextCafes);
    },
    [useCloud, userId],
  );

  const addBean = useCallback(
    (payload: AddBeanPayload) => enqueueMutation(async () => {
      for (const { photo, blob } of payload.photoBlobs) {
        await storePhotoBlob(photo.id, blob);
      }

      const bean: Bean = {
        ...payload.bean,
        id: crypto.randomUUID(),
      };
      const nextBeans = [bean, ...beansRef.current];
      await persistBeans(nextBeans);
      registerPhotoUrls(payload.photoBlobs);
      beansRef.current = nextBeans;
      setBeans(nextBeans);
    }),
    [enqueueMutation, persistBeans, registerPhotoUrls, storePhotoBlob],
  );

  const addCafe = useCallback(
    (payload: AddCafePayload): Promise<Cafe> => enqueueMutation(async () => {
      for (const { photo, blob } of payload.photoBlobs) {
        await storePhotoBlob(photo.id, blob);
      }

      const cafe: Cafe = {
        ...payload.cafe,
        id: crypto.randomUUID(),
      };
      const nextCafes = [cafe, ...cafesRef.current];
      await persistCafes(nextCafes);
      registerPhotoUrls(payload.photoBlobs);
      cafesRef.current = nextCafes;
      setCafes(nextCafes);
      return cafe;
    }),
    [enqueueMutation, persistCafes, registerPhotoUrls, storePhotoBlob],
  );

  const addShot = useCallback(
    (payload: AddShotPayload) => enqueueMutation(async () => {
      for (const { photo, blob } of payload.photoBlobs) {
        await storePhotoBlob(photo.id, blob);
      }

      const shot: Shot = {
        ...payload.shot,
        id: crypto.randomUUID(),
      };
      const nextShots = [shot, ...shotsRef.current];
      await persistShots(nextShots);
      registerPhotoUrls(payload.photoBlobs);
      shotsRef.current = nextShots;
      setShots(nextShots);
    }),
    [enqueueMutation, persistShots, registerPhotoUrls, storePhotoBlob],
  );

  const addCafeVisit = useCallback(
    (payload: AddCafeVisitPayload): Promise<Cafe> => enqueueMutation(async () => {
      for (const { photo, blob } of payload.cafe.photoBlobs) {
        await storePhotoBlob(photo.id, blob);
      }

      const cafe: Cafe = {
        ...payload.cafe.cafe,
        id: crypto.randomUUID(),
      };
      const nextCafes = [cafe, ...cafesRef.current];
      await persistCafes(nextCafes);
      registerPhotoUrls(payload.cafe.photoBlobs);

      for (const { photo, blob } of payload.coffee.photoBlobs) {
        await storePhotoBlob(photo.id, blob);
      }

      const shot: Shot = {
        ...payload.coffee.shot,
        id: crypto.randomUUID(),
        cafeId: cafe.id,
      };
      const nextShots = [shot, ...shotsRef.current];
      await persistShots(nextShots);
      registerPhotoUrls(payload.coffee.photoBlobs);

      cafesRef.current = nextCafes;
      shotsRef.current = nextShots;
      setCafes(nextCafes);
      setShots(nextShots);
      return cafe;
    }),
    [enqueueMutation, persistCafes, persistShots, registerPhotoUrls, storePhotoBlob],
  );

  const addBeanPhotos = useCallback(
    (beanId: string, inputs: PhotoBlobInput[]) => enqueueMutation(async () => {
      for (const { photo, blob } of inputs) {
        await storePhotoBlob(photo.id, blob);
      }

      const nextBeans = beansRef.current.map((bean) =>
        bean.id === beanId
          ? { ...bean, photos: [...bean.photos, ...inputs.map((i) => i.photo)] }
          : bean,
      );
      await persistBeans(nextBeans);
      registerPhotoUrls(inputs);
      beansRef.current = nextBeans;
      setBeans(nextBeans);
    }),
    [enqueueMutation, persistBeans, registerPhotoUrls, storePhotoBlob],
  );

  const removeBeanPhoto = useCallback(
    (beanId: string, photoId: string) => enqueueMutation(async () => {
      await removePhotoBlob(photoId);
      unregisterPhotoUrl(photoId);

      const nextBeans = beansRef.current.map((bean) =>
        bean.id === beanId
          ? { ...bean, photos: bean.photos.filter((p) => p.id !== photoId) }
          : bean,
      );
      await persistBeans(nextBeans);
      beansRef.current = nextBeans;
      setBeans(nextBeans);
    }),
    [enqueueMutation, persistBeans, removePhotoBlob, unregisterPhotoUrl],
  );

  const addCafePhotos = useCallback(
    (cafeId: string, inputs: PhotoBlobInput[]) => enqueueMutation(async () => {
      for (const { photo, blob } of inputs) {
        await storePhotoBlob(photo.id, blob);
      }

      const nextCafes = cafesRef.current.map((cafe) =>
        cafe.id === cafeId
          ? { ...cafe, photos: [...cafe.photos, ...inputs.map((i) => i.photo)] }
          : cafe,
      );
      await persistCafes(nextCafes);
      registerPhotoUrls(inputs);
      cafesRef.current = nextCafes;
      setCafes(nextCafes);
    }),
    [enqueueMutation, persistCafes, registerPhotoUrls, storePhotoBlob],
  );

  const removeCafePhoto = useCallback(
    (cafeId: string, photoId: string) => enqueueMutation(async () => {
      await removePhotoBlob(photoId);
      unregisterPhotoUrl(photoId);

      const nextCafes = cafesRef.current.map((cafe) =>
        cafe.id === cafeId
          ? { ...cafe, photos: cafe.photos.filter((p) => p.id !== photoId) }
          : cafe,
      );
      await persistCafes(nextCafes);
      cafesRef.current = nextCafes;
      setCafes(nextCafes);
    }),
    [enqueueMutation, persistCafes, removePhotoBlob, unregisterPhotoUrl],
  );

  return {
    beans,
    shots,
    cafes,
    loading,
    error,
    resolvePhotos,
    addShot,
    addBean,
    addCafe,
    addCafeVisit,
    addBeanPhotos,
    removeBeanPhoto,
    addCafePhotos,
    removeCafePhoto,
    reloadJournal,
  };
}
