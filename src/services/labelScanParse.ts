import type { BagSize, BeanDraft, BeanKind, RoastStyle } from '../types';
import { BAG_SIZES, ROAST_STYLES } from '../utils/beans';

export interface LabelScanResult {
  draft: BeanDraft;
  warnings: string[];
}

export const LABEL_SCAN_SYSTEM_PROMPT =
  'You extract coffee bag label fields for an espresso journal. Return JSON only with keys: name, roaster, kind ("single_origin"|"blend"), originOrBlend (region/country for single origin OR blend marketing name — not roast level), roastStyle ("light"|"medium"|"dark"), blendComponents (array of {name, percent} when blend), roastDate (YYYY-MM-DD), purchaseDate (YYYY-MM-DD if unknown use roastDate), bagSize ("200g"|"250g"|"500g"|"1kg"), tastingNotes. Use null for unknown fields.';

function parseBagSize(value: unknown): BagSize | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/\s/g, '').toLowerCase();
  return BAG_SIZES.find((s) => s.toLowerCase() === normalized);
}

function parseRoastStyle(value: unknown): RoastStyle | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  const match = ROAST_STYLES.find((s) => s === normalized);
  if (match) return match;
  if (normalized.includes('light')) return 'light';
  if (normalized.includes('dark')) return 'dark';
  if (normalized.includes('medium')) return 'medium';
  return undefined;
}

function parseKind(value: unknown, originText: string): BeanKind | undefined {
  if (value === 'single_origin' || value === 'blend') return value;
  const lower = originText.toLowerCase();
  if (lower.includes('blend')) return 'blend';
  if (lower.includes('single origin') || lower.includes('single-origin')) {
    return 'single_origin';
  }
  return undefined;
}

export function parseDraftFromJson(raw: unknown): LabelScanResult {
  const warnings: string[] = [];
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};

  const originOrBlend = typeof obj.originOrBlend === 'string' ? obj.originOrBlend : '';
  const kind = parseKind(obj.kind, originOrBlend);

  const draft: BeanDraft = {
    name: typeof obj.name === 'string' ? obj.name : undefined,
    roaster: typeof obj.roaster === 'string' ? obj.roaster : undefined,
    kind,
    originOrBlend: originOrBlend || undefined,
    roastStyle: parseRoastStyle(obj.roastStyle),
    roastDate: typeof obj.roastDate === 'string' ? obj.roastDate : undefined,
    purchaseDate: typeof obj.purchaseDate === 'string' ? obj.purchaseDate : undefined,
    bagSize: parseBagSize(obj.bagSize),
    tastingNotes: typeof obj.tastingNotes === 'string' ? obj.tastingNotes : undefined,
  };

  if (Array.isArray(obj.blendComponents)) {
    draft.blendComponents = obj.blendComponents
      .filter((c) => c && typeof c === 'object')
      .map((c) => {
        const row = c as Record<string, unknown>;
        return {
          name: typeof row.name === 'string' ? row.name : '',
          percent: typeof row.percent === 'number' ? row.percent : Number(row.percent) || 0,
        };
      });
  }

  if (!draft.name) warnings.push('Name was not detected — please enter manually.');
  if (!draft.roaster) warnings.push('Roaster was not detected — please enter manually.');

  return { draft, warnings };
}

export function parseLabelScanContent(content: string): LabelScanResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('Label scan returned invalid JSON.');
  }
  return parseDraftFromJson(parsed);
}
