/** Days off roast when many roasters recommend brewing (post-degas). */
export const OPTIMAL_BREW_DAYS_TARGET = 14;
export const OPTIMAL_BREW_DAYS_MIN = 10;
export const OPTIMAL_BREW_DAYS_MAX = 21;
/** Very gassy phase — shots often run fast and inconsistent. */
export const DEGASSING_PHASE_END_DAYS = 7;

export const BEAN_BREW_WINDOW_SUMMARY =
  'Many coffees open up around 10–21 days off roast (sweet spot ~14 days) once CO₂ has degassed—pull times and grind often shift as the bag rests.';

export type BrewWindowPhase = 'degassing' | 'approaching_optimal' | 'optimal' | 'aging';

export function brewWindowPhase(daysSinceRoast: number): BrewWindowPhase {
  if (daysSinceRoast < DEGASSING_PHASE_END_DAYS) return 'degassing';
  if (daysSinceRoast < OPTIMAL_BREW_DAYS_MIN) return 'approaching_optimal';
  if (daysSinceRoast <= OPTIMAL_BREW_DAYS_MAX) return 'optimal';
  return 'aging';
}

export function formatBrewWindowPhase(daysSinceRoast: number): string {
  const phase = brewWindowPhase(daysSinceRoast);
  switch (phase) {
    case 'degassing':
      return `degassing (${daysSinceRoast}d off roast — very gassy, shots often run fast)`;
    case 'approaching_optimal':
      return `settling (${daysSinceRoast}d — approaching ~${OPTIMAL_BREW_DAYS_TARGET}d optimal window)`;
    case 'optimal':
      return `optimal window (${daysSinceRoast}d off roast)`;
    case 'aging':
      return `aging (${daysSinceRoast}d off roast — past peak window)`;
  }
}

export function daysUntilOptimalBrew(daysSinceRoast: number): number | null {
  if (daysSinceRoast >= OPTIMAL_BREW_DAYS_TARGET) return null;
  return OPTIMAL_BREW_DAYS_TARGET - daysSinceRoast;
}

export function chartBeanAgeDomain(ages: number[]): [number, number] {
  const values = [
    ...ages,
    OPTIMAL_BREW_DAYS_MIN,
    OPTIMAL_BREW_DAYS_MAX,
    OPTIMAL_BREW_DAYS_TARGET,
    0,
  ];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(2, (max - min) * 0.1);
  return [Math.max(0, min - pad), max + pad];
}
