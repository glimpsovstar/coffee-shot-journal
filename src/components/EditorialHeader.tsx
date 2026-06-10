import { BrandedLogo } from './BrandedLogo';
import { SocialPlaceholders } from './SocialPlaceholders';

interface EditorialHeaderProps {
  onSignOut?: () => void | Promise<void>;
}

export function EditorialHeader({ onSignOut }: EditorialHeaderProps) {
  return (
    <header className="editorial-header">
      <div className="editorial-header__top">
        <SocialPlaceholders />
        {onSignOut ? (
          <button type="button" className="btn-ghost editorial-header__sign-out" onClick={onSignOut}>
            Sign out
          </button>
        ) : null}
      </div>
      <div className="editorial-header__brand">
        <BrandedLogo variant="stacked" className="editorial-header__logo" />
        <p className="editorial-header__tagline">
          Daily beans &amp; brews — log extractions, track beans, and chase consistency.
        </p>
      </div>
    </header>
  );
}
