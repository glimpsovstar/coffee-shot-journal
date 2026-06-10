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
  const photoUrlsRef = useRef<Map<string, string>>(new Map());

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
      setBeans(data.beans);
      setShots(data.shots);
      setCafes(data.cafes);
      await hydratePhotoUrls(data.beans, data.shots, data.cafes);
    } catch (err) {
      setError(journalErrorMessage(err, 'Failed to load journal'));
    } finally {
      setLoading(false);
    }
  }, [hydratePhotoUrls, loadJournalData]);

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
        setBeans(data.beans);
        setShots(data.shots);
        setCafes(data.cafes);
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
  }, [hydratePhotoUrls, loadJournalData]);

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
    async (payload: AddBeanPayload) => {
      for (const { photo, blob } of payload.photoBlobs) {
        await storePhotoBlob(photo.id, blob);
      }

      const bean: Bean = {
        ...payload.bean,
        id: crypto.randomUUID(),
      };
      const nextBeans = [bean, ...beans];
      await persistBeans(nextBeans);
      registerPhotoUrls(payload.photoBlobs);
      setBeans(nextBeans);
    },
    [beans, persistBeans, registerPhotoUrls, storePhotoBlob],
  );

  const addCafe = useCallback(
    async (payload: AddCafePayload): Promise<Cafe> => {
      for (const { photo, blob } of payload.photoBlobs) {
        await storePhotoBlob(photo.id, blob);
      }

      const cafe: Cafe = {
        ...payload.cafe,
        id: crypto.randomUUID(),
      };
      const nextCafes = [cafe, ...cafes];
      await persistCafes(nextCafes);
      registerPhotoUrls(payload.photoBlobs);
      setCafes(nextCafes);
      return cafe;
    },
    [cafes, persistCafes, registerPhotoUrls, storePhotoBlob],
  );

  const addShot = useCallback(
    async (payload: AddShotPayload) => {
      for (const { photo, blob } of payload.photoBlobs) {
        await storePhotoBlob(photo.id, blob);
      }

      const shot: Shot = {
        ...payload.shot,
        id: crypto.randomUUID(),
      };
      const nextShots = [shot, ...shots];
      await persistShots(nextShots);
      registerPhotoUrls(payload.photoBlobs);
      setShots(nextShots);
    },
    [shots, persistShots, registerPhotoUrls, storePhotoBlob],
  );

  const addCafeVisit = useCallback(
    async (payload: AddCafeVisitPayload): Promise<Cafe> => {
      for (const { photo, blob } of payload.cafe.photoBlobs) {
        await storePhotoBlob(photo.id, blob);
      }

      const cafe: Cafe = {
        ...payload.cafe.cafe,
        id: crypto.randomUUID(),
      };
      const nextCafes = [cafe, ...cafes];
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
      const nextShots = [shot, ...shots];
      await persistShots(nextShots);
      registerPhotoUrls(payload.coffee.photoBlobs);

      setCafes(nextCafes);
      setShots(nextShots);
      return cafe;
    },
    [cafes, shots, persistCafes, persistShots, registerPhotoUrls, storePhotoBlob],
  );

  const addBeanPhotos = useCallback(
    async (beanId: string, inputs: PhotoBlobInput[]) => {
      for (const { photo, blob } of inputs) {
        await storePhotoBlob(photo.id, blob);
      }

      const nextBeans = beans.map((bean) =>
        bean.id === beanId
          ? { ...bean, photos: [...bean.photos, ...inputs.map((i) => i.photo)] }
          : bean,
      );
      await persistBeans(nextBeans);
      registerPhotoUrls(inputs);
      setBeans(nextBeans);
    },
    [beans, persistBeans, registerPhotoUrls, storePhotoBlob],
  );

  const removeBeanPhoto = useCallback(
    async (beanId: string, photoId: string) => {
      await removePhotoBlob(photoId);
      unregisterPhotoUrl(photoId);

      const nextBeans = beans.map((bean) =>
        bean.id === beanId
          ? { ...bean, photos: bean.photos.filter((p) => p.id !== photoId) }
          : bean,
      );
      await persistBeans(nextBeans);
      setBeans(nextBeans);
    },
    [beans, persistBeans, removePhotoBlob, unregisterPhotoUrl],
  );

  const addCafePhotos = useCallback(
    async (cafeId: string, inputs: PhotoBlobInput[]) => {
      for (const { photo, blob } of inputs) {
        await storePhotoBlob(photo.id, blob);
      }

      const nextCafes = cafes.map((cafe) =>
        cafe.id === cafeId
          ? { ...cafe, photos: [...cafe.photos, ...inputs.map((i) => i.photo)] }
          : cafe,
      );
      await persistCafes(nextCafes);
      registerPhotoUrls(inputs);
      setCafes(nextCafes);
    },
    [cafes, persistCafes, registerPhotoUrls, storePhotoBlob],
  );

  const removeCafePhoto = useCallback(
    async (cafeId: string, photoId: string) => {
      await removePhotoBlob(photoId);
      unregisterPhotoUrl(photoId);

      const nextCafes = cafes.map((cafe) =>
        cafe.id === cafeId
          ? { ...cafe, photos: cafe.photos.filter((p) => p.id !== photoId) }
          : cafe,
      );
      await persistCafes(nextCafes);
      setCafes(nextCafes);
    },
    [cafes, persistCafes, removePhotoBlob, unregisterPhotoUrl],
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
