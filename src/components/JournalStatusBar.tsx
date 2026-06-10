interface JournalStatusBarProps {
  shotCount: number;
  currentBeanLabel?: string;
}

export function JournalStatusBar({ shotCount, currentBeanLabel }: JournalStatusBarProps) {
  return (
    <div className="journal-status" aria-label="Journal summary">
      <span className="journal-status__item">
        Total: <strong>{shotCount}</strong> shot{shotCount === 1 ? '' : 's'}
      </span>
      {currentBeanLabel ? (
        <span className="journal-status__item">
          Current bean: <strong>{currentBeanLabel}</strong>
        </span>
      ) : null}
    </div>
  );
}
