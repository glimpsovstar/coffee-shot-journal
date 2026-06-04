import { useState } from 'react';
import { AddShotForm } from './components/AddShotForm';
import { BeanCatalogue } from './components/BeanCatalogue';
import { ShotList } from './components/ShotList';
import { seedBeans, seedShots } from './data/seed';
import type { NewShot, Shot } from './types';

function App() {
  const beans = seedBeans;
  const [shots, setShots] = useState<Shot[]>(seedShots);

  const handleAddShot = (shot: NewShot) => {
    setShots((current) => [
      { ...shot, id: crypto.randomUUID() },
      ...current,
    ]);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Coffee Shot Journal</h1>
        <p>Track beans and espresso shots to learn what affects consistency and taste.</p>
      </header>

      <div className="app-layout">
        <main className="app-main">
          <ShotList shots={shots} beans={beans} />
          <AddShotForm beans={beans} onAddShot={handleAddShot} />
        </main>
        <aside className="app-sidebar">
          <BeanCatalogue beans={beans} />
        </aside>
      </div>
    </div>
  );
}

export default App;
