import { describe, expect, it } from 'vitest';
import { seedBeans, seedShots } from './seed';

describe('seed data', () => {
  it('has beans and shots', () => {
    expect(seedBeans.length).toBeGreaterThanOrEqual(3);
    expect(seedShots.length).toBeGreaterThanOrEqual(4);
  });

  it('links every shot to a valid bean id', () => {
    const beanIds = new Set(seedBeans.map((b) => b.id));
    for (const shot of seedShots) {
      expect(beanIds.has(shot.beanId)).toBe(true);
    }
  });

  it('initializes empty photo arrays on beans and shots', () => {
    for (const bean of seedBeans) {
      expect(bean.photos).toEqual([]);
    }
    for (const shot of seedShots) {
      expect(shot.photos).toEqual([]);
    }
  });

  it('beans have v3 catalogue fields', () => {
    for (const bean of seedBeans) {
      expect(['single_origin', 'blend']).toContain(bean.kind);
      expect(bean.purchaseDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['200g', '250g', '500g', '1kg']).toContain(bean.bagSize);
      expect(['light', 'medium', 'dark']).toContain(bean.roastStyle);
      if (bean.kind === 'blend') {
        expect(bean.blendComponents.length).toBeGreaterThan(0);
      } else {
        expect(bean.blendComponents).toEqual([]);
      }
    }
  });

  it('uses valid ratings and positive recipe numbers', () => {
    for (const shot of seedShots) {
      expect(shot.rating).toBeGreaterThanOrEqual(1);
      expect(shot.rating).toBeLessThanOrEqual(5);
      expect(shot.doseIn).toBeGreaterThan(0);
      expect(shot.yieldOut).toBeGreaterThan(0);
      expect(shot.extractionTime).toBeGreaterThan(0);
    }
  });
});
