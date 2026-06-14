export type AppPage = 'journal' | 'log' | 'analytics' | 'backup';

interface AppNavProps {
  page: AppPage;
  onPageChange: (page: AppPage) => void;
}

const NAV_ITEMS: { page: AppPage; label: string }[] = [
  { page: 'journal', label: 'Journal' },
  { page: 'log', label: 'Log' },
  { page: 'analytics', label: 'Analytics' },
  { page: 'backup', label: 'Account' },
];

export function AppNav({ page, onPageChange }: AppNavProps) {
  return (
    <div className="app-nav-dock">
      <nav className="app-nav premium-nav" aria-label="Main">
        {NAV_ITEMS.map(({ page: itemPage, label }) => (
          <button
            key={itemPage}
            type="button"
            className={
              page === itemPage
                ? `app-nav__link app-nav__link--active${itemPage === 'log' ? ' app-nav__link--log' : ''}`
                : `app-nav__link${itemPage === 'log' ? ' app-nav__link--log' : ''}`
            }
            aria-current={page === itemPage ? 'page' : undefined}
            onClick={() => onPageChange(itemPage)}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
