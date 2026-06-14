import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Bean, Shot } from '../types';
import {
  buildHomeAnalyticsSeries,
  buildShotChartSeries,
  formatExtractionRatioLabel,
  hasContextChartData,
} from '../utils/analytics';
import { buildAnalyticsTrendRecommendations } from '../utils/analyticsTrendRecommendations';
import {
  ESPRESSO_DURATION_MAX_SEC,
  ESPRESSO_DURATION_MIN_SEC,
  ESPRESSO_DURATION_TARGET_SEC,
  ESPRESSO_RATIO_MAX,
  ESPRESSO_RATIO_MIN,
  ESPRESSO_TARGET_RATIO,
  ESPRESSO_TARGET_SUMMARY,
} from '../utils/espressoTargets';
import { AnalyticsDialInPanel } from './AnalyticsDialInPanel';

interface AnalyticsPageProps {
  shots: Shot[];
  beans: Bean[];
}

export function AnalyticsPage({ shots, beans }: AnalyticsPageProps) {
  const series = buildShotChartSeries(shots);
  const homeSeries = buildHomeAnalyticsSeries(shots, beans);
  const trendRecommendations =
    homeSeries.length > 0 ? buildAnalyticsTrendRecommendations(homeSeries) : null;
  const showContextChart = hasContextChartData(homeSeries);
  const showBeanAgeLine = homeSeries.some((point) => point.beanAgeDays !== null);
  const showHumidityLine = homeSeries.some((point) => point.humidityPercent !== null);
  const showGrindLine = homeSeries.some((point) => point.grindSettingNumeric !== null);

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
        Extraction ratio and shot duration over time — spot drift before taste changes. Shaded bands
        show typical espresso targets.
      </p>
      <p className="analytics-targets">{ESPRESSO_TARGET_SUMMARY}</p>

      <div
        className="analytics-chart"
        role="img"
        aria-label="Line chart of extraction ratio and duration"
      >
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
            <ReferenceArea
              yAxisId="ratio"
              y1={ESPRESSO_RATIO_MIN}
              y2={ESPRESSO_RATIO_MAX}
              fill="var(--accent)"
              fillOpacity={0.08}
              strokeOpacity={0}
              ifOverflow="extendDomain"
            />
            <ReferenceLine
              yAxisId="ratio"
              y={ESPRESSO_TARGET_RATIO}
              stroke="var(--accent)"
              strokeDasharray="4 4"
              strokeOpacity={0.55}
              label={{
                value: '1:2 target',
                position: 'insideTopLeft',
                fill: 'var(--text-muted)',
                fontSize: 10,
              }}
            />
            <ReferenceArea
              yAxisId="duration"
              y1={ESPRESSO_DURATION_MIN_SEC}
              y2={ESPRESSO_DURATION_MAX_SEC}
              fill="var(--accent-dark)"
              fillOpacity={0.08}
              strokeOpacity={0}
              ifOverflow="extendDomain"
            />
            <ReferenceLine
              yAxisId="duration"
              y={ESPRESSO_DURATION_TARGET_SEC}
              stroke="var(--accent-dark)"
              strokeDasharray="4 4"
              strokeOpacity={0.55}
              label={{
                value: `~${ESPRESSO_DURATION_TARGET_SEC}s`,
                position: 'insideTopRight',
                fill: 'var(--text-muted)',
                fontSize: 10,
              }}
            />
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

      {showContextChart ? (
        <div className="analytics-chart analytics-chart--context">
          <h3 className="analytics-chart__heading">Bean age, grind &amp; humidity</h3>
          <p className="panel__intro">
            Context logged with home pulls — see how ageing, grind moves, and humidity line up with
            extraction trends.
          </p>
          <div
            role="img"
            aria-label="Line chart of bean age, grind setting, and humidity"
          >
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={homeSeries} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="context"
                  orientation="left"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  domain={['auto', 'auto']}
                  label={{
                    value: 'Days / grind',
                    angle: -90,
                    position: 'insideLeft',
                    fill: 'var(--text-muted)',
                    fontSize: 11,
                  }}
                />
                <YAxis
                  yAxisId="humidity"
                  orientation="right"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  unit="%"
                  domain={[0, 100]}
                  label={{
                    value: 'Humidity',
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
                    if (name === 'Bean age (days)') return [`${value}d`, name];
                    if (name === 'Humidity') return [`${value}%`, name];
                    if (name === 'Grind setting') return [String(value), name];
                    return [String(value), name];
                  }}
                />
                <Legend />
                {showBeanAgeLine ? (
                  <Line
                    yAxisId="context"
                    type="monotone"
                    dataKey="beanAgeDays"
                    name="Bean age (days)"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ) : null}
                {showGrindLine ? (
                  <Line
                    yAxisId="context"
                    type="monotone"
                    dataKey="grindSettingNumeric"
                    name="Grind setting"
                    stroke="var(--accent-dark)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ) : null}
                {showHumidityLine ? (
                  <Line
                    yAxisId="humidity"
                    type="monotone"
                    dataKey="humidityPercent"
                    name="Humidity"
                    stroke="#6b8f71"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ) : null}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      {trendRecommendations ? (
        <section
          className="analytics-recommendations"
          aria-labelledby="analytics-recommendations-heading"
        >
          <h3 id="analytics-recommendations-heading">Dial-in suggestions</h3>
          <p className="panel__intro">
            Based on extraction, bean age, grind, and humidity trends in the charts above (home
            pulls).
          </p>
          <AnalyticsDialInPanel result={trendRecommendations} />
        </section>
      ) : null}
    </section>
  );
}
