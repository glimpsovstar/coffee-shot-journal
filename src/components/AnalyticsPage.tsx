import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Shot } from '../types';
import {
  buildShotChartSeries,
  formatExtractionRatioLabel,
} from '../utils/analytics';

interface AnalyticsPageProps {
  shots: Shot[];
}

export function AnalyticsPage({ shots }: AnalyticsPageProps) {
  const series = buildShotChartSeries(shots);

  if (series.length === 0) {
    return (
      <section className="panel analytics-page" aria-labelledby="analytics-heading">
        <h2 id="analytics-heading">Analytics &amp; insights</h2>
        <p className="panel__intro">
          Log shots with dose, yield, and extraction time to see consistency trends here.
        </p>
        <p className="empty-state">No chartable shots yet.</p>
      </section>
    );
  }

  return (
    <section className="panel analytics-page" aria-labelledby="analytics-heading">
      <h2 id="analytics-heading">Analytics &amp; insights</h2>
      <p className="panel__intro">
        Extraction ratio and shot duration over time — spot drift before taste changes.
      </p>

      <div className="analytics-chart" role="img" aria-label="Line chart of extraction ratio and duration">
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={series} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              yAxisId="ratio"
              orientation="left"
              tick={{ fill: 'var(--accent)', fontSize: 11 }}
              tickFormatter={(value) => formatExtractionRatioLabel(Number(value))}
              domain={['auto', 'auto']}
              label={{
                value: 'Ratio',
                angle: -90,
                position: 'insideLeft',
                fill: 'var(--text-muted)',
                fontSize: 11,
              }}
            />
            <YAxis
              yAxisId="duration"
              orientation="right"
              tick={{ fill: 'var(--accent-dark)', fontSize: 11 }}
              unit="s"
              domain={['auto', 'auto']}
              label={{
                value: 'Duration',
                angle: 90,
                position: 'insideRight',
                fill: 'var(--text-muted)',
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
              }}
              formatter={(value, name) => {
                if (name === 'extractionRatio' && typeof value === 'number') {
                  return [formatExtractionRatioLabel(value), 'Ratio'];
                }
                if (name === 'durationSec') {
                  return [`${value}s`, 'Duration'];
                }
                return [String(value), name];
              }}
            />
            <Legend />
            <Line
              yAxisId="ratio"
              type="monotone"
              dataKey="extractionRatio"
              name="Extraction ratio"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            <Line
              yAxisId="duration"
              type="monotone"
              dataKey="durationSec"
              name="Duration (s)"
              stroke="var(--accent-dark)"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
