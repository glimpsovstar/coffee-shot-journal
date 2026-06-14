import type { ShotRecommendationResult } from '../services/shotRecommendationTypes';

interface AnalyticsDialInPanelProps {
  result: ShotRecommendationResult;
}

export function AnalyticsDialInPanel({ result }: AnalyticsDialInPanelProps) {
  return (
    <div className="shot-recommendations analytics-dial-in">
      <div className="shot-recommendations__result" aria-live="polite">
        <p className="shot-recommendations__summary">{result.summary}</p>
        {result.warnings.length > 0 ? (
          <ul className="scan-warnings">
            {result.warnings.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        {result.suggestions.length > 0 ? (
          <ul className="shot-recommendations__list">
            {result.suggestions.map((item) => (
              <li
                key={`${item.area}-${item.title}`}
                className={`shot-recommendations__item shot-recommendations__item--${item.priority}`}
              >
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="shot-recommendations__disclaimer">{result.disclaimer}</p>
      </div>
    </div>
  );
}
