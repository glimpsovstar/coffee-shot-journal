import type { BagSize, Bean, BeanKind, BlendComponent, NewBean, RoastStyle } from '../types/index.js';

export const BAG_SIZES: BagSize[] = ['200g', '250g', '500g', '1kg'];
export const ROAST_STYLES: RoastStyle[] = ['light', 'medium', 'dark'];

const ROAST_STYLE_LABELS: Record<RoastStyle, string> = {
  light: 'Light',
  medium: 'Medium',
  dark: 'Dark',
};

export function formatRoastStyle(style: RoastStyle): string {
  return ROAST_STYLE_LABELS[style];
}

/** Disambiguate beans in selects and shot cards when names repeat across roasters. */
export function formatBeanChoiceLabel(bean: Pick<Bean, 'roaster' | 'name'>): string {
  return `${bean.roaster} — ${bean.name}`;
}

export function originFieldLabel(kind: BeanKind): string {
  return kind === 'blend' ? 'Blend name' : 'Origin';
}

export function originFieldPlaceholder(kind: BeanKind): string {
  return kind === 'blend' ? 'e.g. House espresso blend' : 'e.g. Yirgacheffe, Ethiopia';
}

const BLEND_PERCENT_TOLERANCE = 0.01;

export type ValidateNewBeanResult =
  | { ok: true; bean: NewBean }
  | { ok: false; error: string };

export function createBlendComponent(
  name = '',
  percent = 0,
  id = crypto.randomUUID(),
): BlendComponent {
  return { id, name, percent };
}

export function sumBlendPercents(components: BlendComponent[]): number {
  return components.reduce((sum, c) => sum + c.percent, 0);
}

export function formatBlendSummary(components: BlendComponent[]): string {
  return components
    .filter((c) => c.name.trim())
    .map((c) => `${c.name.trim()} ${c.percent}%`)
    .join(' · ');
}

export function normalizeBean(bean: Bean): Bean {
  const kind: BeanKind = bean.kind ?? inferKindFromLegacy(bean);
  return {
    ...bean,
    kind,
    purchaseDate: bean.purchaseDate ?? bean.roastDate,
    bagSize: bean.bagSize ?? '250g',
    roastStyle: bean.roastStyle ?? 'medium',
    blendComponents:
      kind === 'blend'
        ? (bean.blendComponents ?? []).map((c) => ({
            ...c,
            id: c.id || crypto.randomUUID(),
          }))
        : [],
  };
}

function inferKindFromLegacy(bean: Bean): BeanKind {
  const text = bean.originOrBlend?.toLowerCase() ?? '';
  if (text.includes('blend')) return 'blend';
  return 'single_origin';
}

export function validateNewBean(input: {
  name: string;
  roaster: string;
  kind: BeanKind;
  originOrBlend: string;
  roastStyle: RoastStyle;
  blendComponents: BlendComponent[];
  roastDate: string;
  purchaseDate: string;
  bagSize: BagSize;
  tastingNotes: string;
  photos: Bean['photos'];
}): ValidateNewBeanResult {
  if (!input.name.trim()) {
    return { ok: false, error: 'Bean name is required.' };
  }
  if (!input.roaster.trim()) {
    return { ok: false, error: 'Roaster is required.' };
  }
  if (!input.originOrBlend.trim()) {
    return {
      ok: false,
      error:
        input.kind === 'blend'
          ? 'Blend name is required.'
          : 'Origin is required (country or region).',
    };
  }
  if (!ROAST_STYLES.includes(input.roastStyle)) {
    return { ok: false, error: 'Select a roast style.' };
  }
  if (!input.roastDate || Number.isNaN(new Date(input.roastDate + 'T12:00:00').getTime())) {
    return { ok: false, error: 'Roast date is required.' };
  }
  if (
    !input.purchaseDate ||
    Number.isNaN(new Date(input.purchaseDate + 'T12:00:00').getTime())
  ) {
    return { ok: false, error: 'Purchase date is required.' };
  }
  if (!BAG_SIZES.includes(input.bagSize)) {
    return { ok: false, error: 'Select a valid bag size.' };
  }

  const components = input.blendComponents.map((c) => ({
    ...c,
    name: c.name.trim(),
    percent: Number(c.percent),
  }));

  if (input.kind === 'single_origin') {
    if (components.length > 0) {
      return { ok: false, error: 'Single origin beans should not have blend components.' };
    }
    return {
      ok: true,
      bean: {
        name: input.name.trim(),
        roaster: input.roaster.trim(),
        kind: input.kind,
        originOrBlend: input.originOrBlend.trim(),
        roastStyle: input.roastStyle,
        blendComponents: [],
        roastDate: input.roastDate,
        purchaseDate: input.purchaseDate,
        bagSize: input.bagSize,
        tastingNotes: input.tastingNotes.trim(),
        photos: input.photos,
      },
    };
  }

  if (components.length === 0) {
    return { ok: false, error: 'Add at least one component for a blend.' };
  }

  for (const c of components) {
    if (!c.name) {
      return { ok: false, error: 'Each blend component needs a name.' };
    }
    if (Number.isNaN(c.percent) || c.percent <= 0 || c.percent > 100) {
      return { ok: false, error: 'Each blend component needs a percent between 1 and 100.' };
    }
  }

  const total = sumBlendPercents(components);
  if (Math.abs(total - 100) > BLEND_PERCENT_TOLERANCE) {
    return {
      ok: false,
      error: `Blend components must total 100% (currently ${total}%).`,
    };
  }

  return {
    ok: true,
    bean: {
      name: input.name.trim(),
      roaster: input.roaster.trim(),
      kind: 'blend',
      originOrBlend: input.originOrBlend.trim(),
      roastStyle: input.roastStyle,
      blendComponents: components.map((c) => ({
        id: c.id || crypto.randomUUID(),
        name: c.name,
        percent: c.percent,
      })),
      roastDate: input.roastDate,
      purchaseDate: input.purchaseDate,
      bagSize: input.bagSize,
      tastingNotes: input.tastingNotes.trim(),
      photos: input.photos,
    },
  };
}
