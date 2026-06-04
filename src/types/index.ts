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

export type BagSize = '200g' | '250g' | '500g' | '1kg';

export type BeanKind = 'single_origin' | 'blend';

export type RoastStyle = 'light' | 'medium' | 'dark';

export interface BlendComponent {
  id: string;
  name: string;
  percent: number;
}

export interface Bean {
  id: string;
  name: string;
  roaster: string;
  kind: BeanKind;
  /** Country/region (single origin) or marketing blend name — not the % breakdown. */
  originOrBlend: string;
  roastStyle: RoastStyle;
  blendComponents: BlendComponent[];
  roastDate: string;
  purchaseDate: string;
  bagSize: BagSize;
  tastingNotes: string;
  photos: Photo[];
}

export interface Shot {
  id: string;
  beanId: string;
  brewedAt: string;
  /** GPS or place from photo EXIF, when available. */
  brewedLocation?: string;
  grinder: string;
  grindSetting: string;
  doseIn: number;
  yieldOut: number;
  extractionTime: number;
  tastingNotes: string;
  rating: 1 | 2 | 3 | 4 | 5;
  photos: Photo[];
}

export type NewBean = Omit<Bean, 'id'>;
export type NewShot = Omit<Shot, 'id'>;

export interface PhotoBlobInput {
  photo: Photo;
  blob: Blob;
}

export interface AddShotPayload {
  shot: NewShot;
  photoBlobs: PhotoBlobInput[];
}

export interface AddBeanPayload {
  bean: NewBean;
  photoBlobs: PhotoBlobInput[];
}

/** Partial bean from label scan — user reviews before save. */
export type BeanDraft = Partial<
  Omit<NewBean, 'photos' | 'blendComponents'>
> & {
  blendComponents?: Partial<BlendComponent>[];
};
