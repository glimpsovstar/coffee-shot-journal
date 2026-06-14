import { useEffect, useState } from 'react';
import { AnalyticsPage } from './components/AnalyticsPage';
import { AppNav, type AppPage } from './components/AppNav';
import { AuthScreen } from './components/AuthScreen';
import { TestLoginScreen } from './components/TestLoginScreen';
import { CloudImportPrompt } from './components/CloudImportPrompt';
import { EditorialHeader } from './components/EditorialHeader';
import { JournalHero } from './components/JournalHero';
import { JournalBackupPanel } from './components/JournalBackupPanel';
import { AccountSignInPanel } from './components/AccountSignInPanel';
import { LogPage, type LogSection } from './components/LogPage';
import { ShotList } from './components/ShotList';
import { useAuth } from './hooks/useAuth';
import { useJournal } from './hooks/useJournal';
import { isTestLoginPath } from './lib/testLoginPath';
import { formatBeanChoiceLabel } from './utils/beans';
import { getCafeById } from './utils/cafes';
import { getBeanById, isCafeShot, isHomeShot, sortShotsNewestFirst } from './utils/shots';
import { startViewTransition } from './utils/viewTransition';

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

  const navigateTo = (next: AppPage) => {
    startViewTransition(() => setPage(next));
  };
  const {
    beans,
    shots,
    cafes,
    loading,
    error,
    resolvePhotos,
    addShot,
    addBean,
    addCafeVisit,
    addBeanPhotos,
    removeBeanPhoto,
    addCafePhotos,
    removeCafePhoto,
    reloadJournal,
  } = useJournal(cloudUserId);

  const homeShotCount = shots.filter((shot) => isHomeShot(shot)).length;
  const cafeShotCount = shots.length - homeShotCount;

  const openLog = (section: LogSection = 'shot') => {
    startViewTransition(() => {
      setLogSection(section);
      setPage('log');
    });
  };

  const newestShot = sortShotsNewestFirst(shots)[0];
  const currentBeanLabel = newestShot
    ? isCafeShot(newestShot)
      ? getCafeById(cafes, newestShot.cafeId ?? '')?.name
      : (() => {
          const bean = getBeanById(beans, newestShot.beanId);
          return bean ? formatBeanChoiceLabel(bean) : undefined;
        })()
    : undefined;

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
    <div className="app app-shell">
      <EditorialHeader onSignOut={onSignOut} />

      {page === 'journal' ? (
        <JournalHero
          shots={shots}
          beans={beans}
          shotCount={shots.length}
          homeShotCount={homeShotCount}
          cafeShotCount={cafeShotCount}
          currentBeanLabel={currentBeanLabel}
          resolvePhotos={resolvePhotos}
          onLogClick={() => openLog('shot')}
        />
      ) : null}

      {cloudUserId ? (
        <CloudImportPrompt userId={cloudUserId} onImported={() => reloadJournal()} />
      ) : null}

      <div className="app-layout">
        <main className={`app-main app-main--view${page === 'log' ? ' app-main--log-sheet' : ''}`} key={page}>
          {page === 'journal' ? (
            <ShotList
              shots={shots}
              beans={beans}
              cafes={cafes}
              resolvePhotos={resolvePhotos}
              heading="Past history"
              intro="Newest first — your extraction log."
              emptyMessage="No shots yet. Open Log to record your first shot."
            />
          ) : page === 'log' ? (
            <LogPage
              section={logSection}
              onSectionChange={setLogSection}
              beans={beans}
              cafes={cafes}
              shots={shots}
              resolvePhotos={resolvePhotos}
              onAddShot={addShot}
              onAddBean={addBean}
              onAddVisit={addCafeVisit}
              onAddBeanPhotos={addBeanPhotos}
              onRemoveBeanPhoto={removeBeanPhoto}
              onAddCafePhotos={addCafePhotos}
              onRemoveCafePhoto={removeCafePhoto}
            />
          ) : page === 'analytics' ? (
            <AnalyticsPage shots={shots} beans={beans} />
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

      <AppNav page={page} onPageChange={navigateTo} />
    </div>
  );
}

function App() {
  const auth = useAuth();
  const onTestLoginPath = isTestLoginPath();

  useEffect(() => {
    if (auth.session && onTestLoginPath) {
      window.location.replace('/');
    }
  }, [auth.session, onTestLoginPath]);

  if (auth.cloudEnabled && auth.loading) {
    return (
      <div className="app app--loading">
        <p>Loading…</p>
      </div>
    );
  }

  if (auth.cloudEnabled && !auth.session) {
    if (onTestLoginPath) {
      return (
        <TestLoginScreen
          error={auth.error}
          onSignInWithPassword={auth.signInWithPassword}
        />
      );
    }

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
