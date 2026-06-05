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
  const beansRef = useRef<Bean[]>([]);
  const shotsRef = useRef<Shot[]>([]);
  const writeQueueRef = useRef(Promise.resolve());

  const enqueueWrite = useCallback(<T,>(write: () => Promise<T>): Promise<T> => {
    const run = writeQueueRef.current.then(write, write);
    writeQueueRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const syncBeans = useCallback((nextBeans: Bean[]) => {
    beansRef.current = nextBeans;
    setBeans(nextBeans);
  }, []);

  const syncShots = useCallback((nextShots: Shot[]) => {
    shotsRef.current = nextShots;
    setShots(nextShots);
  }, []);

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
        syncBeans(data.beans);
        syncShots(data.shots);
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
  }, [hydratePhotoUrls, syncBeans, syncShots]);

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
    (payload: AddBeanPayload) =>
      enqueueWrite(async () => {
        for (const { photo, blob } of payload.photoBlobs) {
          await putPhotoBlob(photo.id, blob);
        }

        const bean: Bean = {
          ...payload.bean,
          id: crypto.randomUUID(),
        };
        const nextBeans = [bean, ...beansRef.current];
        await saveBeans(nextBeans);
        registerPhotoUrls(payload.photoBlobs);
        syncBeans(nextBeans);
      }),
    [enqueueWrite, registerPhotoUrls, syncBeans],
  );

  const addShot = useCallback(
    (payload: AddShotPayload) =>
      enqueueWrite(async () => {
        for (const { photo, blob } of payload.photoBlobs) {
          await putPhotoBlob(photo.id, blob);
        }

        const shot: Shot = {
          ...payload.shot,
          id: crypto.randomUUID(),
        };
        const nextShots = [shot, ...shotsRef.current];
        await saveShots(nextShots);
        registerPhotoUrls(payload.photoBlobs);
        syncShots(nextShots);
      }),
    [enqueueWrite, registerPhotoUrls, syncShots],
  );

  const addBeanPhotos = useCallback(
    (beanId: string, inputs: PhotoBlobInput[]) =>
      enqueueWrite(async () => {
        for (const { photo, blob } of inputs) {
          await putPhotoBlob(photo.id, blob);
        }

        const nextBeans = beansRef.current.map((bean) =>
          bean.id === beanId
            ? { ...bean, photos: [...bean.photos, ...inputs.map((i) => i.photo)] }
            : bean,
        );
        await saveBeans(nextBeans);
        registerPhotoUrls(inputs);
        syncBeans(nextBeans);
      }),
    [enqueueWrite, registerPhotoUrls, syncBeans],
  );

  const removeBeanPhoto = useCallback(
    (beanId: string, photoId: string) =>
      enqueueWrite(async () => {
        const nextBeans = beansRef.current.map((bean) =>
          bean.id === beanId
            ? { ...bean, photos: bean.photos.filter((p) => p.id !== photoId) }
            : bean,
        );
        await saveBeans(nextBeans);
        syncBeans(nextBeans);
        await deletePhotoBlob(photoId);
        unregisterPhotoUrl(photoId);
      }),
    [enqueueWrite, syncBeans, unregisterPhotoUrl],
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
