import type { LabelScanResult } from './labelScanParse';
import { callOpenAiLabelScan } from './labelScanOpenai';

function hasLocalOpenAiKey(): boolean {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

/** Production builds use the Vercel `/api/label-scan` proxy unless a local demo key is set. */
function usesServerLabelScan(): boolean {
  return !hasLocalOpenAiKey() && import.meta.env.MODE === 'production';
}

export function isLabelScanAvailable(): boolean {
  return hasLocalOpenAiKey() || usesServerLabelScan();
}

export function isLocalLabelScanDemo(): boolean {
  return hasLocalOpenAiKey();
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

async function scanViaServerProxy(blob: Blob): Promise<LabelScanResult> {
  const imageBase64 = await blobToBase64(blob);
  const mimeType = blob.type || 'image/jpeg';

  const response = await fetch('/api/label-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mimeType, imageBase64 }),
  });

  const payload = (await response.json().catch(() => null)) as
    | LabelScanResult
    | { error?: string }
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? payload.error
        : `Label scan failed (${response.status}).`;
    throw new Error(message);
  }

  if (!payload || !('draft' in payload) || !('warnings' in payload)) {
    throw new Error('Label scan returned an invalid response.');
  }

  return payload;
}

export async function scanLabelFromBlob(blob: Blob): Promise<LabelScanResult> {
  if (!isLabelScanAvailable()) {
    throw new Error(
      'Label scan is not configured. Add VITE_OPENAI_API_KEY to .env.local for local demo, or configure OPENAI_API_KEY on Vercel.',
    );
  }

  if (usesServerLabelScan()) {
    return scanViaServerProxy(blob);
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  const base64 = await blobToBase64(blob);
  const mimeType = blob.type || 'image/jpeg';
  return callOpenAiLabelScan(apiKey, mimeType, base64);
}
