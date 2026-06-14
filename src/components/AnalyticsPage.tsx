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
import type { HomeAnalyticsPoint } from '../utils/analytics';
import {
  buildHomeAnalyticsSeries,
  buildShotChartSeries,
  enrichHomeSeriesForBeanAgeChart,
  formatExtractionRatioLabel,
  getBeanIdsWithAgeInSeries,
  hasBeanAgeChartData,
  hasContextChartData,
  hasGrindOrHumidityChartData,
} from '../utils/analytics';
import { enrichExtractionChartSeries } from '../utils/analyticsChart';
import { BEAN_AGE_LINE_COLORS } from '../utils/beanAgeChartColors';
import { formatBeanChoiceLabel } from '../utils/beans';
import {
  chartBeanAgeDomain,
  DEGASSING_PHASE_END_DAYS,
  OPTIMAL_BREW_DAYS_MAX,
  OPTIMAL_BREW_DAYS_MIN,
  OPTIMAL_BREW_DAYS_TARGET,
} from '../utils/beanBrewWindow';
import { getBeanById } from '../utils/shots';
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
import { AnalyticsChartLegend } from './AnalyticsChartLegend';
import { AnalyticsRecommendationsSection } from './AnalyticsRecommendationsSection';

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
  const beanAgeChartData = enrichHomeSeriesForBeanAgeChart(homeSeries);
  const beanIdsForAgeChart = getBeanIdsWithAgeInSeries(homeSeries);
  const showBeanAgeChart = hasBeanAgeChartData(homeSeries);
  const showGrindHumidityChart = hasGrindOrHumidityChartData(homeSeries);
  const showContextSection = hasContextChartData(homeSeries);
  const showHumidityLine = homeSeries.some((point) => point.humidityPercent !== null);
  const showGrindLine = homeSeries.some((point) => point.grindSettingNumeric !== null);
  const beanAgeValues = homeSeries
    .map((point) => point.beanAgeDays)
    .filter((value): value is number => value !== null);
  const beanAgeDomain: [number, number] =
    beanAgeValues.length > 0 ? chartBeanAgeDomain(beanAgeValues) : [0, OPTIMAL_BREW_DAYS_MAX + 3];
  const grindValues = homeSeries
    .map((point) => point.grindSettingNumeric)
    .filter((value): value is number => value !== null);
  const grindDomain: [number, number] | ['auto', 'auto'] =
    grindValues.length > 0
      ? [Math.min(...grindValues) - 1, Math.max(...grindValues) + 1]
      : ['auto', 'auto'];

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
            <Legend wrapperStyle={{ display: 'none' }} />
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

      <AnalyticsChartLegend
        title="Extraction chart legend"
        items={[
          {
            label: 'Your ratio',
            hint: 'Solid line — dose:yield on each pull',
            swatch: 'solid',
            color: 'var(--accent)',
          },
          {
            label: 'Your time',
            hint: 'Solid line — shot duration (seconds)',
            swatch: 'solid',
            color: 'var(--accent-dark)',
          },
          {
            label: 'Sweet spot ratio (1:2)',
            hint: 'Dashed reference',
            swatch: 'dashed',
            color: 'var(--accent)',
          },
          {
            label: `Sweet spot time (~${ESPRESSO_DURATION_TARGET_SEC}s)`,
            hint: 'Dashed reference',
            swatch: 'dashed',
            color: 'var(--accent-dark)',
          },
          {
            label: 'Shaded ratio zone',
            hint: `Typical ratio window (1:${ESPRESSO_RATIO_MIN.toFixed(1)}–1:${ESPRESSO_RATIO_MAX.toFixed(1)}) — red tint on chart`,
            swatch: 'band',
            color: 'var(--accent)',
          },
          {
            label: 'Shaded time zone',
            hint: `Typical pull time window (${ESPRESSO_DURATION_MIN_SEC}–${ESPRESSO_DURATION_MAX_SEC}s) — dark tint overlays ratio zone`,
            swatch: 'band',
            color: 'var(--accent-dark)',
          },
        ]}
      />

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

      {showContextSection ? (
        <div className="analytics-chart analytics-chart--context">
          {showBeanAgeChart ? (
            <>
              <h3 className="analytics-chart__heading">Bean age off roast</h3>
              <p className="panel__intro">
                Days since roast for each pull — one line per bag (age rises as the bag rests).
                Unknown-bean pulls are omitted. Shaded bands show degassing vs the ~{OPTIMAL_BREW_DAYS_TARGET}d
                optimal window after CO₂ escapes.
              </p>
              <div
                role="img"
                aria-label="Line chart of bean age off roast with brew window bands"
              >
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart
                    data={beanAgeChartData}
                    margin={{ top: 12, right: 12, left: 4, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      yAxisId="age"
                      orientation="left"
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      domain={beanAgeDomain}
                      unit="d"
                      label={{
                        value: 'Days off roast',
                        angle: -90,
                        position: 'insideLeft',
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
                      formatter={(value) => [`${value}d off roast`, 'Bean age']}
                      labelFormatter={(label, payload) => {
                        const point = payload?.[0]?.payload as HomeAnalyticsPoint | undefined;
                        if (!point?.beanId) return label;
                        const bean = getBeanById(beans, point.beanId);
                        return bean
                          ? `${label} — ${formatBeanChoiceLabel(bean)}`
                          : label;
                      }}
                    />
                    <Legend wrapperStyle={{ display: 'none' }} />
                    <ReferenceArea
                      yAxisId="age"
                      y1={0}
                      y2={DEGASSING_PHASE_END_DAYS}
                      fill="var(--accent-dark)"
                      fillOpacity={0.1}
                      strokeOpacity={0}
                      ifOverflow="extendDomain"
                    />
                    <ReferenceArea
                      yAxisId="age"
                      y1={OPTIMAL_BREW_DAYS_MIN}
                      y2={OPTIMAL_BREW_DAYS_MAX}
                      fill="var(--accent)"
                      fillOpacity={0.14}
                      strokeOpacity={0}
                      ifOverflow="extendDomain"
                    />
                    <ReferenceLine
                      yAxisId="age"
                      y={OPTIMAL_BREW_DAYS_TARGET}
                      stroke="var(--accent)"
                      strokeDasharray="2 6"
                      strokeOpacity={0.45}
                    />
                    {beanIdsForAgeChart.map((beanId, index) => {
                      const bean = getBeanById(beans, beanId);
                      const color = BEAN_AGE_LINE_COLORS[index % BEAN_AGE_LINE_COLORS.length]!;
                      return (
                        <Line
                          key={beanId}
                          yAxisId="age"
                          type="monotone"
                          dataKey={`beanAgeLine_${beanId}`}
                          name={bean ? formatBeanChoiceLabel(bean) : beanId}
                          stroke={color}
                          strokeWidth={2}
                          dot={{ r: 4, strokeWidth: 2, fill: 'var(--surface)' }}
                          connectNulls
                          isAnimationActive={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <AnalyticsChartLegend
                title="Bean age chart legend"
                items={[
                  ...beanIdsForAgeChart.map((beanId, index) => {
                    const bean = getBeanById(beans, beanId);
                    const color = BEAN_AGE_LINE_COLORS[index % BEAN_AGE_LINE_COLORS.length]!;
                    return {
                      label: bean ? formatBeanChoiceLabel(bean) : beanId,
                      hint: 'Solid line — rises day by day for this bag only',
                      swatch: 'solid' as const,
                      color,
                    };
                  }),
                  {
                    label: 'Degassing phase',
                    hint: `0–${DEGASSING_PHASE_END_DAYS} days — very gassy, shots often run fast`,
                    swatch: 'band' as const,
                    color: 'var(--accent-dark)',
                  },
                  {
                    label: 'Optimal brew window',
                    hint: `${OPTIMAL_BREW_DAYS_MIN}–${OPTIMAL_BREW_DAYS_MAX} days off roast (post-degas)`,
                    swatch: 'band' as const,
                    color: 'var(--accent)',
                  },
                  {
                    label: `~${OPTIMAL_BREW_DAYS_TARGET}d sweet spot`,
                    hint: 'Dashed line — typical target after nitrogen/CO₂ has left the bag',
                    swatch: 'dashed' as const,
                    color: 'var(--accent)',
                  },
                ]}
              />
            </>
          ) : null}

          {showGrindHumidityChart ? (
            <>
              <h3 className="analytics-chart__heading">Grind &amp; humidity</h3>
              <p className="panel__intro">
                Grinder setting and humidity logged with home pulls — compare with shot time on the
                extraction chart above.
              </p>
              <div
                role="img"
                aria-label="Line chart of grind setting and humidity"
              >
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={homeSeries} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    {showGrindLine ? (
                      <YAxis
                        yAxisId="grind"
                        orientation="left"
                        tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                        domain={grindDomain}
                        label={{
                          value: 'Grind',
                          angle: -90,
                          position: 'insideLeft',
                          fill: 'var(--text-muted)',
                          fontSize: 11,
                        }}
                      />
                    ) : null}
                    {showHumidityLine ? (
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
                    ) : null}
                    <Tooltip
                      contentStyle={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.8rem',
                      }}
                      formatter={(value, name) => {
                        if (name === 'Humidity') return [`${value}%`, name];
                        if (name === 'Grind setting') return [String(value), name];
                        return [String(value), name];
                      }}
                    />
                    <Legend wrapperStyle={{ display: 'none' }} />
                    {showGrindLine ? (
                      <Line
                        yAxisId="grind"
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

              <AnalyticsChartLegend
                title="Grind & humidity legend"
                items={[
                  ...(showGrindLine
                    ? [
                        {
                          label: 'Grind setting',
                          hint: 'Solid line — logged grinder setting',
                          swatch: 'solid' as const,
                          color: 'var(--accent-dark)',
                        },
                      ]
                    : []),
                  ...(showHumidityLine
                    ? [
                        {
                          label: 'Humidity',
                          hint: 'Solid line — % when weather was logged',
                          swatch: 'solid' as const,
                          color: '#6b8f71',
                        },
                      ]
                    : []),
                ]}
              />
            </>
          ) : null}
        </div>
      ) : null}

      {homeSeries.length > 0 ? (
        <AnalyticsRecommendationsSection homeSeries={homeSeries} beans={beans} />
      ) : null}
    </section>
  );
}
