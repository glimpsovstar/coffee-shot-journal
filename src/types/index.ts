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

export interface StoredBrewSuburb {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

export interface ShotWeather {
  temperatureC: number;
  humidityPercent: number;
  description: string;
  /** WMO code from Open-Meteo; optional for shots saved before this field existed. */
  weatherCode?: number;
  source: 'open-meteo';
  observedAt: string;
}

export type ShotContext = 'home_pulled' | 'cafe_purchased';

export type MilkCategory = 'black' | 'milk';

export type BlackBeverageType = 'espresso' | 'ristretto' | 'long_black';

export type MilkBeverageType = 'latte' | 'cappuccino' | 'flat_white' | 'mocha' | 'magic';

export type BeverageType = BlackBeverageType | MilkBeverageType;

export type ShotSize = 'half' | 'single' | 'double' | 'custom';

export interface Cafe {
  id: string;
  name: string;
  googlePlaceId?: string;
  address?: string;
  latitude: number;
  longitude: number;
  notes: string;
  photos: Photo[];
}

export interface Shot {
  id: string;
  context?: ShotContext;
  beanId: string;
  cafeId?: string;
  milkCategory?: MilkCategory;
  beverageType?: BeverageType;
  shotSize?: ShotSize;
  shotSizeCustom?: string;
  /** Café drink was stronger than default (extra shot). */
  extraShot?: boolean;
  /** Café drink used oat, almond, etc. instead of regular milk. */
  alternativeMilk?: boolean;
  /** Hot water (ml) when assembling a long black at home. */
  longBlackWaterMl?: number;
  /** Espresso volume in cup (ml) for long black; may differ from extraction yield. */
  longBlackEspressoMl?: number;
  priceAud?: number;
  wouldOrderAgain?: boolean;
  brewedAt: string;
  /** AU/NZ suburb selected from catalogue. */
  brewSuburb?: StoredBrewSuburb;
  /** Weather at brew time (Open-Meteo). */
  weather?: ShotWeather;
  /** @deprecated Legacy free-text or GPS string. */
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
export type NewCafe = Omit<Cafe, 'id'>;
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

export interface AddCafePayload {
  cafe: NewCafe;
  photoBlobs: PhotoBlobInput[];
}

export interface AddCafeVisitPayload {
  cafe: AddCafePayload;
  coffee: AddShotPayload;
}

/** Partial bean from label scan — user reviews before save. */
export type BeanDraft = Partial<
  Omit<NewBean, 'photos' | 'blendComponents'>
> & {
  blendComponents?: Partial<BlendComponent>[];
};
