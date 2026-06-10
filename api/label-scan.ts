import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callOpenAiLabelScan } from '../src/services/labelScanOpenai.js';
import { parseLabelScanRequestBody } from '../src/services/labelScanRequest.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return res.status(503).json({ error: 'Label scan is not configured on the server.' });
  }

  const parsed = parseLabelScanRequestBody(req.body);
  if (typeof parsed === 'string') {
    return res.status(400).json({ error: parsed });
  }

  try {
    const result = await callOpenAiLabelScan(apiKey, parsed.mimeType, parsed.imageBase64);
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Label scan failed.';
    return res.status(502).json({ error: message });
  }
}
