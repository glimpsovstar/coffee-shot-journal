import type { CSSProperties } from 'react';

export interface AnalyticsLegendItem {
  label: string;
  hint?: string;
  swatch: 'solid' | 'dashed' | 'band';
  color: string;
}

interface AnalyticsChartLegendProps {
  title: string;
  items: AnalyticsLegendItem[];
}

export function AnalyticsChartLegend({ title, items }: AnalyticsChartLegendProps) {
  return (
    <div className="analytics-legend" aria-label={title}>
      <h4 className="analytics-legend__title">{title}</h4>
      <ul className="analytics-legend__list">
        {items.map((item) => (
          <li key={item.label} className="analytics-legend__item">
            <span
              className={`analytics-legend__swatch analytics-legend__swatch--${item.swatch}`}
              style={{ '--legend-color': item.color } as CSSProperties}
              aria-hidden="true"
            />
            <span className="analytics-legend__text">
              <strong>{item.label}</strong>
              {item.hint ? <span className="analytics-legend__hint">{item.hint}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
