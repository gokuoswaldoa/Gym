import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Workout from './pages/Workout';
import History from './pages/History';
import Progress from './pages/Progress';
import Routines from './pages/Routines';
import Nutrition from './pages/Nutrition';
import { triggerSync, downloadSync } from './lib/sync';

function App() {
  useEffect(() => {
    // Al abrir la app, intentar descargar si hay datos más nuevos, y luego subir si hay locales sin subir.
    // Para simplificar, intentamos descargar primero.
    downloadSync().then(() => {
      triggerSync();
    });

    // Cuando el teléfono recupere la conexión a internet, subirá los datos
    const handleOnline = () => {
      triggerSync();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="routines" element={<Routines />} />
          <Route path="workout" element={<Workout />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="history" element={<History />} />
          <Route path="progress" element={<Progress />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
