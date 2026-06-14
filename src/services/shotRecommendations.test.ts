import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockBeans, mockShot } from '../test/fixtures';
import { fetchShotRecommendations, isShotRecommendationAvailable } from './shotRecommendations';

describe('shotRecommendations client', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('returns heuristics when AI is not configured in dev', async () => {
    vi.stubEnv('MODE', 'development');
    vi.stubEnv('VITE_OPENAI_API_KEY', '');
    expect(isShotRecommendationAvailable()).toBe(false);

    const result = await fetchShotRecommendations(mockShot, mockBeans[0]);
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.disclaimer).toMatch(/hints, not rules/);
  });

  it('calls server proxy in production', async () => {
    vi.stubEnv('MODE', 'production');
    vi.stubEnv('VITE_OPENAI_API_KEY', '');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        summary: 'Server hints',
        suggestions: [
          {
            area: 'visual',
            title: 'Test',
            detail: 'Detail',
            priority: 'low',
          },
        ],
        warnings: [],
        disclaimer: 'Disclaimer',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchShotRecommendations(mockShot, mockBeans[0]);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/shot-recommendations',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.summary).toBe('Server hints');
  });
});
