import { afterEach, describe, expect, it, vi } from 'vitest';
import { isLabelScanAvailable, isLocalLabelScanDemo, scanLabelFromBlob } from './labelVision';

describe('labelVision', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reports unavailable when no local key and dev mode', () => {
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITE_OPENAI_API_KEY', '');
    expect(isLabelScanAvailable()).toBe(false);
    expect(isLocalLabelScanDemo()).toBe(false);
  });

  it('uses server proxy in production without local key', () => {
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('VITE_OPENAI_API_KEY', '');
    expect(isLabelScanAvailable()).toBe(true);
    expect(isLocalLabelScanDemo()).toBe(false);
  });

  it('throws when scanning without configuration in dev', async () => {
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITE_OPENAI_API_KEY', '');
    await expect(scanLabelFromBlob(new Blob(['x'], { type: 'image/jpeg' }))).rejects.toThrow(
      /not configured/,
    );
  });

  it('parses vision API JSON via local demo key', async () => {
    vi.stubEnv('MODE', 'development');
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
    expect(fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('calls the server proxy in production', async () => {
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('VITE_OPENAI_API_KEY', '');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          draft: { name: 'Proxy Bean', roaster: 'Proxy Roaster' },
          warnings: [],
        }),
      }),
    );

    const result = await scanLabelFromBlob(new Blob(['img'], { type: 'image/jpeg' }));
    expect(result.draft.name).toBe('Proxy Bean');
    expect(fetch).toHaveBeenCalledWith(
      '/api/label-scan',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
