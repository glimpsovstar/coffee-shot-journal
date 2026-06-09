import { useState } from 'react';
import { AddShotForm } from './components/AddShotForm';
import { AuthScreen } from './components/AuthScreen';
import { BeanCatalogue } from './components/BeanCatalogue';
import { CloudImportPrompt } from './components/CloudImportPrompt';
import { JournalBackupPanel } from './components/JournalBackupPanel';
import { BrandedLogo } from './components/BrandedLogo';
import { PasskeySetupButton } from './components/PasskeySetupButton';
import { ImportShotForm } from './components/ImportShotForm';
import { ShotList } from './components/ShotList';
import { useAuth } from './hooks/useAuth';
import { useJournal } from './hooks/useJournal';

type AppPage = 'journal' | 'import' | 'backup';

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
      <header className="app-header">
        <div className="app-header__row">
          <div className="app-brand">
            <BrandedLogo variant="horizontal" className="app-brand__logo" />
            <p className="app-brand__subtitle">
              Track beans and espresso shots to learn what affects consistency and taste.
            </p>
          </div>
          {onSignOut || onRegisterPasskey ? (
            <div className="app-header__account">
              {onRegisterPasskey ? (
                <PasskeySetupButton onRegisterPasskey={onRegisterPasskey} />
              ) : null}
              {onSignOut ? (
                <button type="button" className="btn-secondary" onClick={onSignOut}>
                  Sign out
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <nav className="app-nav" aria-label="Main">
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
            className={page === 'import' ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}
            aria-current={page === 'import' ? 'page' : undefined}
            onClick={() => setPage('import')}
          >
            Import past shot
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
      </header>

      {cloudUserId ? (
        <CloudImportPrompt userId={cloudUserId} onImported={() => reloadJournal()} />
      ) : null}

      <div className="app-layout">
        <main className="app-main">
          {page === 'journal' ? (
            <>
              <ShotList shots={shots} beans={beans} resolvePhotos={resolvePhotos} />
              <AddShotForm beans={beans} onAddShot={addShot} />
            </>
          ) : page === 'import' ? (
            <>
              <ImportShotForm beans={beans} onImportShot={addShot} />
              <ShotList shots={shots} beans={beans} resolvePhotos={resolvePhotos} />
            </>
          ) : (
            <JournalBackupPanel cloudUserId={cloudUserId} onRestored={() => reloadJournal()} />
          )}
        </main>
        <aside className="app-sidebar">
          <BeanCatalogue
            beans={beans}
            resolvePhotos={resolvePhotos}
            onAddBean={addBean}
            onAddBeanPhotos={addBeanPhotos}
            onRemoveBeanPhoto={removeBeanPhoto}
          />
        </aside>
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
