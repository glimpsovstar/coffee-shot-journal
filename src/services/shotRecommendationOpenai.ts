import type { ShotRecommendationContext } from './shotRecommendationTypes.js';
import {
  parseShotRecommendationContent,
  SHOT_VISION_SYSTEM_PROMPT,
} from './shotRecommendationParse.js';

export async function callOpenAiShotVision(
  apiKey: string,
  context: ShotRecommendationContext,
  mimeType: string,
  imageBase64: string,
): Promise<ReturnType<typeof parseShotRecommendationContent>> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SHOT_VISION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Shot metadata JSON:\n${JSON.stringify(context)}\n\nAnalyze the photo for crema colour, flow, milk texture, puck wetness if visible. Suggest concrete dial-in adjustments.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 900,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Shot recommendations failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Shot recommendations returned an empty response.');
  }

  return parseShotRecommendationContent(content);
}
