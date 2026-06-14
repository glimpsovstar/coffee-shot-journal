import type { Bean, Shot } from '../types';
import { buildShotRecommendationContext } from './shotRecommendationContext';
import { buildHeuristicRecommendations } from './shotRecommendationHeuristics';
import { buildShotRecommendations } from './shotRecommendationService';
import type { ShotRecommendationContext, ShotRecommendationResult } from './shotRecommendationTypes';

function hasLocalOpenAiKey(): boolean {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

function usesServerProxy(): boolean {
  return !hasLocalOpenAiKey() && import.meta.env.MODE === 'production';
}

export function isShotRecommendationAvailable(): boolean {
  return hasLocalOpenAiKey() || usesServerProxy();
}

export function isLocalShotRecommendationDemo(): boolean {
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

async function recommendViaServer(
  context: ShotRecommendationContext,
  imageBlob?: Blob,
): Promise<ShotRecommendationResult> {
  const body: Record<string, unknown> = { context };
  if (imageBlob) {
    body.imageBase64 = await blobToBase64(imageBlob);
    body.mimeType = imageBlob.type || 'image/jpeg';
  }

  const response = await fetch('/api/shot-recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | ShotRecommendationResult
    | { error?: string }
    | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && payload.error
        ? payload.error
        : `Shot recommendations failed (${response.status}).`;
    throw new Error(message);
  }

  if (!payload || !('suggestions' in payload) || !('summary' in payload)) {
    throw new Error('Shot recommendations returned an invalid response.');
  }

  return payload;
}

export async function fetchShotRecommendations(
  shot: Shot,
  bean: Bean | undefined,
  imageBlob?: Blob,
): Promise<ShotRecommendationResult> {
  const context = buildShotRecommendationContext(shot, bean);

  if (!isShotRecommendationAvailable()) {
    return buildHeuristicRecommendations(context);
  }

  if (usesServerProxy()) {
    return recommendViaServer(context, imageBlob);
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string;
  const image =
    imageBlob
      ? {
          mimeType: imageBlob.type || 'image/jpeg',
          imageBase64: await blobToBase64(imageBlob),
        }
      : undefined;

  return buildShotRecommendations(apiKey, context, image);
}
