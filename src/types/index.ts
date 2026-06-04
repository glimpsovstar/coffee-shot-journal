export interface Bean {
  id: string;
  name: string;
  roaster: string;
  originOrBlend: string;
  roastDate: string;
  tastingNotes: string;
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
}

export type NewShot = Omit<Shot, 'id'>;
