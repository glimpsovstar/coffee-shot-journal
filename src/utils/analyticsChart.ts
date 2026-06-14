import type { ShotChartPoint } from './analytics';
import {
  ESPRESSO_DURATION_TARGET_SEC,
  ESPRESSO_TARGET_RATIO,
} from './espressoTargets';

export interface ExtractionChartPoint extends ShotChartPoint {
  sweetSpotRatio: number;
  sweetSpotDurationSec: number;
}

export function enrichExtractionChartSeries(series: ShotChartPoint[]): ExtractionChartPoint[] {
  return series.map((point) => ({
    ...point,
    sweetSpotRatio: ESPRESSO_TARGET_RATIO,
    sweetSpotDurationSec: ESPRESSO_DURATION_TARGET_SEC,
  }));
}
