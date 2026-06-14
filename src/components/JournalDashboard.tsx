interface JournalDashboardProps {
  shotCount: number;
  homeShotCount: number;
  cafeShotCount: number;
  currentBeanLabel?: string;
  onLogClick: () => void;
}

export function JournalDashboard({
  shotCount,
  homeShotCount,
  cafeShotCount,
  currentBeanLabel,
  onLogClick,
}: JournalDashboardProps) {
  return (
    <section className="journal-dashboard" aria-label="Journal overview">
      <div className="journal-dashboard__stats">
        <div className="journal-dashboard__stat">
          <span className="journal-dashboard__stat-value">{shotCount}</span>
          <span className="journal-dashboard__stat-label">
            shot{shotCount === 1 ? '' : 's'} logged
          </span>
        </div>
        <div className="journal-dashboard__stat">
          <span className="journal-dashboard__stat-value">{homeShotCount}</span>
          <span className="journal-dashboard__stat-label">home</span>
        </div>
        <div className="journal-dashboard__stat">
          <span className="journal-dashboard__stat-value">{cafeShotCount}</span>
          <span className="journal-dashboard__stat-label">café</span>
        </div>
      </div>

      {currentBeanLabel ? (
        <p className="journal-dashboard__current">
          Latest: <strong>{currentBeanLabel}</strong>
        </p>
      ) : null}

      <button type="button" className="btn-primary journal-dashboard__cta" onClick={onLogClick}>
        Log a pull
      </button>
    </section>
  );
}
