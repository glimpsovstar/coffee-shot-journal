import type { Bean, Photo, Shot } from '../types';

export const mockPhoto: Photo = {
  id: 'photo-test-1',
  fileName: 'puck.jpg',
  mimeType: 'image/jpeg',
  createdAt: '2026-06-04T12:00:00.000Z',
};

export const mockBeans: Bean[] = [
  {
    id: 'bean-a',
    name: 'Test Ethiopia',
    roaster: 'Test Roasters',
    kind: 'single_origin',
    originOrBlend: 'Single origin — Test',
    blendComponents: [],
    roastDate: '2026-05-01',
    purchaseDate: '2026-05-02',
    bagSize: '250g',
    tastingNotes: 'Citrus and floral.',
    photos: [],
  },
  {
    id: 'bean-b',
    name: 'Test House',
    roaster: 'Test Roasters',
    kind: 'blend',
    originOrBlend: 'Brazil & Colombia',
    blendComponents: [
      { id: 'bc-1', name: 'Brazil', percent: 60 },
      { id: 'bc-2', name: 'Colombia', percent: 40 },
    ],
    roastDate: '2026-05-10',
    purchaseDate: '2026-05-11',
    bagSize: '500g',
    tastingNotes: 'Chocolate and nuts.',
    photos: [],
  },
];

export const mockShot: Shot = {
  id: 'shot-1',
  beanId: 'bean-a',
  brewedAt: '2026-06-04T10:00:00',
  grinder: 'Test Grinder',
  grindSetting: '15',
  doseIn: 18,
  yieldOut: 36,
  extractionTime: 28,
  tastingNotes: 'Balanced and sweet.',
  rating: 4,
  photos: [],
};

export const mockShotOlder: Shot = {
  ...mockShot,
  id: 'shot-2',
  brewedAt: '2026-06-01T08:00:00',
};

export const mockShotNewer: Shot = {
  ...mockShot,
  id: 'shot-3',
  brewedAt: '2026-06-04T14:00:00',
};

export function createMockImageFile(
  name = 'test.jpg',
  type = 'image/jpeg',
  size = 64,
): File {
  return new File([new Uint8Array(size)], name, { type });
}

export function createMockPhotoBlobInput(photo: Photo = mockPhoto) {
  const blob = new Blob(['image-bytes'], { type: photo.mimeType });
  return { photo, blob };
}
