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
import { enrichExtractionChartSeries } from '../utils/analyticsChart';
import { buildAnalyticsTrendRecommendations } from '../utils/analyticsTrendRecommendations';
import {
  chartDurationDomain,
  chartRatioDomain,
  ESPRESSO_DURATION_MAX_SEC,
  ESPRESSO_DURATION_MIN_SEC,
  ESPRESSO_DURATION_TARGET_SEC,
  ESPRESSO_RATIO_MAX,
  ESPRESSO_RATIO_MIN,
  ESPRESSO_TARGET_RATIO,
  ESPRESSO_TARGET_SUMMARY,
  formatDurationSweetSpotDelta,
  formatRatioSweetSpotDelta,
} from '../utils/espressoTargets';
import { AnalyticsDialInPanel } from './AnalyticsDialInPanel';

interface AnalyticsPageProps {
  shots: Shot[];
  beans: Bean[];
}

export function AnalyticsPage({ shots, beans }: AnalyticsPageProps) {
  const series = buildShotChartSeries(shots);
  const extractionSeries = enrichExtractionChartSeries(series);
  const ratioValues = extractionSeries
    .map((point) => point.extractionRatio)
    .filter((value): value is number => value !== null);
  const durationValues = extractionSeries
    .filter((point) => point.durationSec > 0)
    .map((point) => point.durationSec);
  const ratioDomain = chartRatioDomain(
    ratioValues.length > 0 ? ratioValues : [ESPRESSO_TARGET_RATIO],
  );
  const durationDomain = chartDurationDomain(
    durationValues.length > 0 ? durationValues : [ESPRESSO_DURATION_TARGET_SEC],
  );
  const latestExtraction = extractionSeries[extractionSeries.length - 1];
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
          <LineChart data={extractionSeries} margin={{ top: 20, right: 12, left: 4, bottom: 8 }}>
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
              domain={ratioDomain}
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
              domain={durationDomain}
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
                if (name === 'Your ratio' && typeof value === 'number') {
                  return [
                    `${formatExtractionRatioLabel(value)} (${formatRatioSweetSpotDelta(value)})`,
                    'Your ratio',
                  ];
                }
                if (name === 'Your time' && typeof value === 'number') {
                  return [`${value}s (${formatDurationSweetSpotDelta(value)})`, 'Your time'];
                }
                if (
                  name === 'Sweet spot ratio (1:2)' ||
                  String(name).startsWith('Sweet spot time')
                ) {
                  return null;
                }
                return [String(value), name];
              }}
              labelFormatter={(label) => label}
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
              strokeDasharray="2 6"
              strokeOpacity={0.35}
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
              strokeDasharray="2 6"
              strokeOpacity={0.35}
            />
            <Line
              yAxisId="ratio"
              type="monotone"
              dataKey="extractionRatio"
              name="Your ratio"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
            <Line
              yAxisId="duration"
              type="monotone"
              dataKey="durationSec"
              name="Your time"
              stroke="var(--accent-dark)"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls
            />
            <Line
              yAxisId="ratio"
              type="monotone"
              dataKey="sweetSpotRatio"
              name="Sweet spot ratio (1:2)"
              stroke="var(--accent)"
              strokeWidth={2}
              strokeDasharray="8 5"
              dot={false}
              isAnimationActive={false}
              legendType="line"
            />
            <Line
              yAxisId="duration"
              type="monotone"
              dataKey="sweetSpotDurationSec"
              name={`Sweet spot time (~${ESPRESSO_DURATION_TARGET_SEC}s)`}
              stroke="var(--accent-dark)"
              strokeWidth={2}
              strokeDasharray="8 5"
              dot={false}
              isAnimationActive={false}
              legendType="line"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {latestExtraction ? (
        <p className="analytics-sweet-spot-readout">
          <strong>Latest pull vs sweet spot</strong>
          <span className="analytics-sweet-spot-readout__metrics">
            {latestExtraction.extractionRatio !== null ? (
              <span>
                Ratio {formatExtractionRatioLabel(latestExtraction.extractionRatio)} (
                {formatRatioSweetSpotDelta(latestExtraction.extractionRatio)})
              </span>
            ) : null}
            {latestExtraction.durationSec > 0 ? (
              <span>
                Time {latestExtraction.durationSec}s (
                {formatDurationSweetSpotDelta(latestExtraction.durationSec)})
              </span>
            ) : null}
          </span>
          <span className="analytics-sweet-spot-readout__hint">
            Dashed lines on the chart are the 1:2 and ~{ESPRESSO_DURATION_TARGET_SEC}s sweet spots—
            vertical distance is how far each pull sits from target.
          </span>
        </p>
      ) : null}

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
