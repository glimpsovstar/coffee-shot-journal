import { useState } from 'react';
import { AddShotForm } from './components/AddShotForm';
import { BeanCatalogue } from './components/BeanCatalogue';
import { ImportShotForm } from './components/ImportShotForm';
import { ShotList } from './components/ShotList';
import { useJournal } from './hooks/useJournal';

type AppPage = 'journal' | 'import';

function App() {
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
  } = useJournal();

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
        <h1>Coffee Shot Journal</h1>
        <p>Track beans and espresso shots to learn what affects consistency and taste.</p>
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
        </nav>
      </header>

      <div className="app-layout">
        <main className="app-main">
          {page === 'journal' ? (
            <>
              <ShotList shots={shots} beans={beans} resolvePhotos={resolvePhotos} />
              <AddShotForm beans={beans} onAddShot={addShot} />
            </>
          ) : (
            <>
              <ImportShotForm beans={beans} onImportShot={addShot} />
              <ShotList shots={shots} beans={beans} resolvePhotos={resolvePhotos} />
            </>
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

export default App;
