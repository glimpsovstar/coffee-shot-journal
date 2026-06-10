import { useState } from 'react';
import { AddShotForm } from './components/AddShotForm';
import { AnalyticsPage } from './components/AnalyticsPage';
import { AuthScreen } from './components/AuthScreen';
import { BeanCatalogue } from './components/BeanCatalogue';
import { CloudImportPrompt } from './components/CloudImportPrompt';
import { EditorialHeader } from './components/EditorialHeader';
import { FloatingShotHero } from './components/FloatingShotHero';
import { JournalBackupPanel } from './components/JournalBackupPanel';
import { AccountSignInPanel } from './components/AccountSignInPanel';
import { ImportShotForm } from './components/ImportShotForm';
import { ShotList } from './components/ShotList';
import { useAuth } from './hooks/useAuth';
import { useJournal } from './hooks/useJournal';

type AppPage = 'journal' | 'analytics' | 'import' | 'backup';

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
          className={page === 'analytics' ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}
          aria-current={page === 'analytics' ? 'page' : undefined}
          onClick={() => setPage('analytics')}
        >
          Analytics
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

      {cloudUserId ? (
        <CloudImportPrompt userId={cloudUserId} onImported={() => reloadJournal()} />
      ) : null}

      <div className="app-layout">
        <main className="app-main">
          {page === 'journal' ? (
            <>
              <FloatingShotHero shots={shots} beans={beans} resolvePhotos={resolvePhotos} />
              <ShotList shots={shots} beans={beans} resolvePhotos={resolvePhotos} />
              <AddShotForm beans={beans} onAddShot={addShot} />
            </>
          ) : page === 'analytics' ? (
            <AnalyticsPage shots={shots} />
          ) : page === 'import' ? (
            <>
              <ImportShotForm beans={beans} onImportShot={addShot} />
              <ShotList shots={shots} beans={beans} resolvePhotos={resolvePhotos} />
            </>
          ) : (
            <>
              {onRegisterPasskey ? (
                <AccountSignInPanel onRegisterPasskey={onRegisterPasskey} />
              ) : null}
              <JournalBackupPanel cloudUserId={cloudUserId} onRestored={() => reloadJournal()} />
            </>
          )}
        </main>
        {page === 'journal' || page === 'import' ? (
          <aside className="app-sidebar">
            <BeanCatalogue
              beans={beans}
              resolvePhotos={resolvePhotos}
              onAddBean={addBean}
              onAddBeanPhotos={addBeanPhotos}
              onRemoveBeanPhoto={removeBeanPhoto}
            />
          </aside>
        ) : null}
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
