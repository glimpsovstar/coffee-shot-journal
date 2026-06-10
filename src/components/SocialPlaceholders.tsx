export function SocialPlaceholders() {
  return (
    <div className="social-placeholders" aria-label="Future integrations">
      <button
        type="button"
        className="social-placeholders__btn"
        disabled
        aria-label="Instagram (coming soon)"
        title="Instagram integration — coming soon"
      >
        <InstagramIcon />
        <span className="social-placeholders__label">Instagram</span>
      </button>
      <button
        type="button"
        className="social-placeholders__btn"
        disabled
        aria-label="Day One (coming soon)"
        title="Day One webhook — coming soon"
      >
        <DayOneIcon />
        <span className="social-placeholders__label">Day One</span>
      </button>
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg className="social-placeholders__icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function DayOneIcon() {
  return (
    <svg className="social-placeholders__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6 4h12a2 2 0 0 1 2 2v14l-4-3-4 3-4-3-4 3V6a2 2 0 0 1 2-2z"
      />
    </svg>
  );
}
