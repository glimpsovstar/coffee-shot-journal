export interface Photo {
  id: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
}

export interface PhotoDisplay {
  photo: Photo;
  url: string;
}

export interface Bean {
  id: string;
  name: string;
  roaster: string;
  originOrBlend: string;
  roastDate: string;
  tastingNotes: string;
  photos: Photo[];
}

export interface Shot {
  id: string;
  beanId: string;
  brewedAt: string;
  grinder: string;
  grindSetting: string;
  doseIn: number;
  yieldOut: number;
  extractionTime: number;
  tastingNotes: string;
  rating: 1 | 2 | 3 | 4 | 5;
  photos: Photo[];
}

export type NewShot = Omit<Shot, 'id'>;

export interface PhotoBlobInput {
  photo: Photo;
  blob: Blob;
}

export interface AddShotPayload {
  shot: NewShot;
  photoBlobs: PhotoBlobInput[];
}
