import { AddShotForm } from './components/AddShotForm';
import { BeanCatalogue } from './components/BeanCatalogue';
import { ShotList } from './components/ShotList';
import { useJournal } from './hooks/useJournal';

function App() {
  const {
    beans,
    shots,
    loading,
    error,
    resolvePhotos,
    addShot,
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
      </header>

      <div className="app-layout">
        <main className="app-main">
          <ShotList shots={shots} beans={beans} resolvePhotos={resolvePhotos} />
          <AddShotForm beans={beans} onAddShot={addShot} />
        </main>
        <aside className="app-sidebar">
          <BeanCatalogue
            beans={beans}
            resolvePhotos={resolvePhotos}
            onAddBeanPhotos={addBeanPhotos}
            onRemoveBeanPhoto={removeBeanPhoto}
          />
        </aside>
      </div>
    </div>
  );
}

export default App;
