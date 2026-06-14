export type AppPage = 'journal' | 'log' | 'analytics' | 'backup';

interface AppNavProps {
  page: AppPage;
  onPageChange: (page: AppPage) => void;
}

const LEFT_ITEMS: { page: AppPage; label: string }[] = [
  { page: 'journal', label: 'Journal' },
  { page: 'analytics', label: 'Analytics' },
];

const RIGHT_ITEMS: { page: AppPage; label: string }[] = [{ page: 'backup', label: 'Account' }];

export function AppNav({ page, onPageChange }: AppNavProps) {
  return (
    <div className="app-nav-dock">
      <div className="app-nav-shell premium-nav">
        <nav className="app-nav app-nav--left" aria-label="Main navigation">
          {LEFT_ITEMS.map(({ page: itemPage, label }) => (
            <button
              key={itemPage}
              type="button"
              className={
                page === itemPage ? 'app-nav__link app-nav__link--active' : 'app-nav__link'
              }
              aria-current={page === itemPage ? 'page' : undefined}
              onClick={() => onPageChange(itemPage)}
            >
              {label}
            </button>
          ))}
        </nav>

        <nav className="app-nav app-nav--right" aria-label="Account navigation">
          {RIGHT_ITEMS.map(({ page: itemPage, label }) => (
            <button
              key={itemPage}
              type="button"
              className={
                page === itemPage ? 'app-nav__link app-nav__link--active' : 'app-nav__link'
              }
              aria-current={page === itemPage ? 'page' : undefined}
              onClick={() => onPageChange(itemPage)}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      <button
        type="button"
        className={`app-nav__fab magnetic-btn${page === 'log' ? ' app-nav__fab--active' : ''}`}
        aria-current={page === 'log' ? 'page' : undefined}
        onClick={() => onPageChange('log')}
        onPointerMove={(event) => {
          const el = event.currentTarget;
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = event.clientX - cx;
          const dy = event.clientY - cy;
          const distance = Math.hypot(dx, dy);
          const radius = 64;
          if (distance < radius) {
            const pull = (radius - distance) / radius;
            el.style.setProperty('--magnetic-x', `${dx * pull * 0.2}px`);
            el.style.setProperty('--magnetic-y', `${dy * pull * 0.2}px`);
          } else {
            el.style.setProperty('--magnetic-x', '0px');
            el.style.setProperty('--magnetic-y', '0px');
          }
        }}
        onPointerLeave={(event) => {
          event.currentTarget.style.setProperty('--magnetic-x', '0px');
          event.currentTarget.style.setProperty('--magnetic-y', '0px');
        }}
      >
        <span className="app-nav__fab-icon" aria-hidden="true">+</span>
        <span className="app-nav__fab-label">Log shot</span>
      </button>
    </div>
  );
}
