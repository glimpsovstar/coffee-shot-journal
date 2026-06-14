import { useMemo, useState } from 'react';
import type { Bean } from '../types';
import type { HomeAnalyticsPoint } from '../utils/analytics';
import {
  buildAnalyticsTrendRecommendations,
  buildGenericAnalyticsRecommendations,
  buildPointAnalyticsRecommendations,
} from '../utils/analyticsRecommendations';
import { AnalyticsDialInPanel } from './AnalyticsDialInPanel';

interface AnalyticsRecommendationsSectionProps {
  homeSeries: HomeAnalyticsPoint[];
  beans: Bean[];
}

export function AnalyticsRecommendationsSection({
  homeSeries,
  beans,
}: AnalyticsRecommendationsSectionProps) {
  const [selectedPullId, setSelectedPullId] = useState<string>('overview');

  const generic = useMemo(() => buildGenericAnalyticsRecommendations(), []);

  const specific = useMemo(() => {
    if (homeSeries.length === 0) return null;
    if (selectedPullId === 'overview') {
      return buildAnalyticsTrendRecommendations(homeSeries);
    }
    const point = homeSeries.find((item) => item.id === selectedPullId);
    if (!point) return buildAnalyticsTrendRecommendations(homeSeries);
    return buildPointAnalyticsRecommendations(point, beans);
  }, [homeSeries, selectedPullId, beans]);

  if (homeSeries.length === 0) return null;

  const specificHeading =
    selectedPullId === 'overview'
      ? 'Trend insights (all home shots on the chart)'
      : `Insights for ${homeSeries.find((p) => p.id === selectedPullId)?.label ?? 'selected shot'}`;

  return (
    <section
      className="analytics-recommendations"
      aria-labelledby="analytics-recommendations-heading"
    >
      <h3 id="analytics-recommendations-heading">Dial-in suggestions</h3>
      <p className="panel__intro">
        General espresso guidance first, then trends or a specific shot you choose below.
      </p>

      <div className="form-row analytics-recommendations__picker">
        <label htmlFor="analytics-pull-picker">Recommendations for</label>
        <select
          id="analytics-pull-picker"
          value={selectedPullId}
          onChange={(e) => setSelectedPullId(e.target.value)}
        >
          <option value="overview">All shots — trend patterns</option>
          {homeSeries.map((point) => (
            <option key={point.id} value={point.id}>
              {point.label}
            </option>
          ))}
        </select>
      </div>

      <div className="analytics-recommendations__block">
        <h4 className="analytics-recommendations__subheading">General guidance</h4>
        <AnalyticsDialInPanel result={generic} />
      </div>

      {specific ? (
        <div className="analytics-recommendations__block">
          <h4 className="analytics-recommendations__subheading">{specificHeading}</h4>
          <AnalyticsDialInPanel result={specific} />
        </div>
      ) : null}
    </section>
  );
}
