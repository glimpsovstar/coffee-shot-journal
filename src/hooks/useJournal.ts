import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deletePhotoBlob,
  getPhotoBlob,
  loadJournal,
  putPhotoBlob,
  saveBeans,
  saveShots,
} from '../storage/journalRepository';
import type {
  AddBeanPayload,
  AddShotPayload,
  Bean,
  Photo,
  PhotoBlobInput,
  PhotoDisplay,
  Shot,
} from '../types';
import { createPhotoObjectUrl, revokePhotoObjectUrl } from '../utils/photos';

export type { PhotoDisplay };

function collectPhotos(beans: Bean[], shots: Shot[]): Photo[] {
  return [...beans.flatMap((b) => b.photos), ...shots.flatMap((s) => s.photos)];
}

export function useJournal() {
  const [beans, setBeans] = useState<Bean[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const photoUrlsRef = useRef<Map<string, string>>(new Map());

  const syncPhotoUrlsRef = useCallback((urls: Map<string, string>) => {
    photoUrlsRef.current = urls;
    setPhotoUrls(urls);
  }, []);

  const hydratePhotoUrls = useCallback(async (beansData: Bean[], shotsData: Shot[]) => {
    const photos = collectPhotos(beansData, shotsData);
    const next = new Map<string, string>();

    for (const photo of photos) {
      const blob = await getPhotoBlob(photo.id);
      if (blob) {
        next.set(photo.id, createPhotoObjectUrl(blob));
      }
    }

    photoUrlsRef.current.forEach((url) => revokePhotoObjectUrl(url));
    syncPhotoUrlsRef(next);
  }, [syncPhotoUrlsRef]);

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
        const data = await loadJournal();
        if (cancelled) return;
        setBeans(data.beans);
        setShots(data.shots);
        await hydratePhotoUrls(data.beans, data.shots);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load journal');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      photoUrlsRef.current.forEach((url) => revokePhotoObjectUrl(url));
    };
  }, [hydratePhotoUrls]);

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

  const addBean = useCallback(
    async (payload: AddBeanPayload) => {
      for (const { photo, blob } of payload.photoBlobs) {
        await putPhotoBlob(photo.id, blob);
      }

      const bean: Bean = {
        ...payload.bean,
        id: crypto.randomUUID(),
      };
      const nextBeans = [bean, ...beans];
      await saveBeans(nextBeans);
      registerPhotoUrls(payload.photoBlobs);
      setBeans(nextBeans);
    },
    [beans, registerPhotoUrls],
  );

  const addShot = useCallback(
    async (payload: AddShotPayload) => {
      for (const { photo, blob } of payload.photoBlobs) {
        await putPhotoBlob(photo.id, blob);
      }

      const shot: Shot = {
        ...payload.shot,
        id: crypto.randomUUID(),
      };
      const nextShots = [shot, ...shots];
      await saveShots(nextShots);
      registerPhotoUrls(payload.photoBlobs);
      setShots(nextShots);
    },
    [shots, registerPhotoUrls],
  );

  const addBeanPhotos = useCallback(
    async (beanId: string, inputs: PhotoBlobInput[]) => {
      for (const { photo, blob } of inputs) {
        await putPhotoBlob(photo.id, blob);
      }

      const nextBeans = beans.map((bean) =>
        bean.id === beanId
          ? { ...bean, photos: [...bean.photos, ...inputs.map((i) => i.photo)] }
          : bean,
      );
      await saveBeans(nextBeans);
      registerPhotoUrls(inputs);
      setBeans(nextBeans);
    },
    [beans, registerPhotoUrls],
  );

  const removeBeanPhoto = useCallback(
    async (beanId: string, photoId: string) => {
      await deletePhotoBlob(photoId);
      unregisterPhotoUrl(photoId);

      const nextBeans = beans.map((bean) =>
        bean.id === beanId
          ? { ...bean, photos: bean.photos.filter((p) => p.id !== photoId) }
          : bean,
      );
      await saveBeans(nextBeans);
      setBeans(nextBeans);
    },
    [beans, unregisterPhotoUrl],
  );

  return {
    beans,
    shots,
    loading,
    error,
    resolvePhotos,
    addShot,
    addBean,
    addBeanPhotos,
    removeBeanPhoto,
  };
}
