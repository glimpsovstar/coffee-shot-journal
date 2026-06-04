import { afterEach, describe, expect, it, vi } from 'vitest';
import { isLabelScanAvailable, scanLabelFromBlob } from './labelVision';

describe('labelVision', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reports unavailable when API key is missing', () => {
    vi.stubEnv('VITE_OPENAI_API_KEY', '');
    expect(isLabelScanAvailable()).toBe(false);
  });

  it('throws when scanning without API key', async () => {
    vi.stubEnv('VITE_OPENAI_API_KEY', '');
    await expect(scanLabelFromBlob(new Blob(['x'], { type: 'image/jpeg' }))).rejects.toThrow(
      /not configured/,
    );
  });

  it('parses vision API JSON into a draft', async () => {
    vi.stubEnv('VITE_OPENAI_API_KEY', 'test-key');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  name: 'House Espresso',
                  roaster: 'Northside',
                  kind: 'blend',
                  originOrBlend: 'Brazil & Colombia',
                  blendComponents: [
                    { name: 'Brazil', percent: 60 },
                    { name: 'Colombia', percent: 40 },
                  ],
                  roastDate: '2026-05-01',
                  purchaseDate: '2026-05-02',
                  bagSize: '250g',
                  tastingNotes: 'Chocolate, nuts',
                }),
              },
            },
          ],
        }),
      }),
    );

    const result = await scanLabelFromBlob(new Blob(['img'], { type: 'image/jpeg' }));
    expect(result.draft.name).toBe('House Espresso');
    expect(result.draft.kind).toBe('blend');
    expect(result.draft.bagSize).toBe('250g');
  });
});
