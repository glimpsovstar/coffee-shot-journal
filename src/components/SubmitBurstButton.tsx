import { useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type SubmitPhase = 'idle' | 'loading' | 'success';

interface SubmitBurstButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  phase: SubmitPhase;
  idleLabel: ReactNode;
  loadingLabel?: ReactNode;
  successLabel?: ReactNode;
}

export function SubmitBurstButton({
  phase,
  idleLabel,
  loadingLabel = 'Saving…',
  successLabel = 'Saved',
  className = '',
  disabled,
  ...props
}: SubmitBurstButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  const label =
    phase === 'loading' ? loadingLabel : phase === 'success' ? successLabel : idleLabel;

  return (
    <span className="submit-burst">
      <button
        ref={ref}
        type="submit"
        className={`btn-primary submit-burst__btn ${phase === 'success' ? 'submit-burst__btn--success' : ''} ${className}`.trim()}
        disabled={disabled || phase === 'loading'}
        {...props}
      >
        {phase === 'loading' ? (
          <span className="submit-burst__spinner" aria-hidden="true" />
        ) : null}
        <span>{label}</span>
      </button>
      {phase === 'success' ? <span className="submit-burst__ring" aria-hidden="true" /> : null}
    </span>
  );
}
