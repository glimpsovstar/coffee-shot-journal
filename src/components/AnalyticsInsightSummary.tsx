import type { HomeAnalyticsPoint } from '../utils/analytics';
import {
  buildAnalyticsInsightCards,
  type AnalyticsInsightCard,
} from '../utils/analyticsInsightSummary';

interface AnalyticsInsightSummaryProps {
  homeSeries: HomeAnalyticsPoint[];
}

export function AnalyticsInsightSummary({ homeSeries }: AnalyticsInsightSummaryProps) {
  const cards = buildAnalyticsInsightCards(homeSeries);
  if (cards.length === 0) return null;

  return (
    <div className="analytics-insights" aria-label="At-a-glance insights">
      {cards.map((card: AnalyticsInsightCard) => (
        <article key={card.label} className="analytics-insights__card">
          <p className="analytics-insights__label">{card.label}</p>
          <p className="analytics-insights__value">{card.value}</p>
          {card.detail ? <p className="analytics-insights__detail">{card.detail}</p> : null}
        </article>
      ))}
    </div>
  );
}
