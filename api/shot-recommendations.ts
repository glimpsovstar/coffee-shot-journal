import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseShotRecommendationRequestBody } from '../src/services/shotRecommendationRequest.js';
import { buildShotRecommendations } from '../src/services/shotRecommendationService.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return res.status(503).json({ error: 'Shot recommendations are not configured on the server.' });
  }

  const parsed = parseShotRecommendationRequestBody(req.body);
  if (typeof parsed === 'string') {
    return res.status(400).json({ error: parsed });
  }

  try {
    const image =
      parsed.imageBase64
        ? { mimeType: parsed.mimeType ?? 'image/jpeg', imageBase64: parsed.imageBase64 }
        : undefined;
    const result = await buildShotRecommendations(apiKey, parsed.context, image);
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Shot recommendations failed.';
    return res.status(502).json({ error: message });
  }
}
