import {
  LABEL_SCAN_SYSTEM_PROMPT,
  parseLabelScanContent,
  type LabelScanResult,
} from './labelScanParse.js';

export async function callOpenAiLabelScan(
  apiKey: string,
  mimeType: string,
  imageBase64: string,
): Promise<LabelScanResult> {
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
        { role: 'system', content: LABEL_SCAN_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract bean information from this coffee bag label image.' },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Label scan failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Label scan returned an empty response.');
  }

  return parseLabelScanContent(content);
}
