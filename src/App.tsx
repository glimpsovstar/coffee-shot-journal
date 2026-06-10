import { useState } from 'react';
import { AnalyticsPage } from './components/AnalyticsPage';
import { AuthScreen } from './components/AuthScreen';
import { CloudImportPrompt } from './components/CloudImportPrompt';
import { EditorialHeader } from './components/EditorialHeader';
import { FloatingShotHero } from './components/FloatingShotHero';
import { JournalBackupPanel } from './components/JournalBackupPanel';
import { JournalStatusBar } from './components/JournalStatusBar';
import { AccountSignInPanel } from './components/AccountSignInPanel';
import { LogPage, type LogSection } from './components/LogPage';
import { ShotList } from './components/ShotList';
import { useAuth } from './hooks/useAuth';
import { useJournal } from './hooks/useJournal';
import { formatBeanChoiceLabel } from './utils/beans';
import { getBeanById, sortShotsNewestFirst } from './utils/shots';

type AppPage = 'journal' | 'log' | 'analytics' | 'backup';

function JournalApp({
  cloudUserId,
  onSignOut,
  onRegisterPasskey,
}: {
  cloudUserId: string | null;
  onSignOut?: () => Promise<void>;
  onRegisterPasskey?: () => Promise<void>;
}) {
  const [page, setPage] = useState<AppPage>('journal');
  const [logSection, setLogSection] = useState<LogSection>('shot');
  const {
    beans,
    shots,
    loading,
    error,
    resolvePhotos,
    addShot,
    addBean,
    addBeanPhotos,
    removeBeanPhoto,
    reloadJournal,
  } = useJournal(cloudUserId);

  const newestShot = sortShotsNewestFirst(shots)[0];
  const currentBean = newestShot ? getBeanById(beans, newestShot.beanId) : undefined;
  const currentBeanLabel = currentBean ? formatBeanChoiceLabel(currentBean) : undefined;

  if (loading) {
    return (
      <div className="app app--loading">
        <p>Loading your journal…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app app--error">
        <p role="alert">{error}</p>
      </div>
    );
  }

  return (
    <div className="app">
      <EditorialHeader onSignOut={onSignOut} />

      <nav className="app-nav app-nav--primary" aria-label="Main">
        <button
          type="button"
          className={page === 'journal' ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}
          aria-current={page === 'journal' ? 'page' : undefined}
          onClick={() => setPage('journal')}
        >
          Journal
        </button>
        <button
          type="button"
          className={page === 'log' ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}
          aria-current={page === 'log' ? 'page' : undefined}
          onClick={() => setPage('log')}
        >
          Log
        </button>
        <button
          type="button"
          className={page === 'analytics' ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}
          aria-current={page === 'analytics' ? 'page' : undefined}
          onClick={() => setPage('analytics')}
        >
          Analytics
        </button>
        <button
          type="button"
          className={page === 'backup' ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}
          aria-current={page === 'backup' ? 'page' : undefined}
          onClick={() => setPage('backup')}
        >
          Backup &amp; restore
        </button>
      </nav>

      {page === 'journal' ? (
        <JournalStatusBar shotCount={shots.length} currentBeanLabel={currentBeanLabel} />
      ) : null}

      {cloudUserId ? (
        <CloudImportPrompt userId={cloudUserId} onImported={() => reloadJournal()} />
      ) : null}

      <div className="app-layout">
        <main className="app-main">
          {page === 'journal' ? (
            <>
              <FloatingShotHero shots={shots} beans={beans} resolvePhotos={resolvePhotos} />
              <ShotList
                shots={shots}
                beans={beans}
                resolvePhotos={resolvePhotos}
                heading="Past history"
                intro="Newest first — your extraction log."
                emptyMessage="No shots yet. Open Log to record your first pull."
              />
            </>
          ) : page === 'log' ? (
            <LogPage
              section={logSection}
              onSectionChange={setLogSection}
              beans={beans}
              resolvePhotos={resolvePhotos}
              onAddShot={addShot}
              onAddBean={addBean}
              onAddBeanPhotos={addBeanPhotos}
              onRemoveBeanPhoto={removeBeanPhoto}
            />
          ) : page === 'analytics' ? (
            <AnalyticsPage shots={shots} />
          ) : (
            <>
              {onRegisterPasskey ? (
                <AccountSignInPanel onRegisterPasskey={onRegisterPasskey} />
              ) : null}
              <JournalBackupPanel cloudUserId={cloudUserId} onRestored={() => reloadJournal()} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function App() {
  const auth = useAuth();

  if (auth.cloudEnabled && auth.loading) {
    return (
      <div className="app app--loading">
        <p>Loading…</p>
      </div>
    );
  }

  if (auth.cloudEnabled && !auth.session) {
    return (
      <AuthScreen
        error={auth.error}
        onSignInWithPasskey={auth.signInWithPasskey}
        onSignInWithOAuth={auth.signInWithOAuth}
      />
    );
  }

  const cloudUserId = auth.session?.user.id ?? null;

  return (
    <JournalApp
      cloudUserId={cloudUserId}
      onSignOut={auth.cloudEnabled ? auth.signOut : undefined}
      onRegisterPasskey={auth.cloudEnabled ? auth.registerPasskey : undefined}
    />
  );
}

export default App;
