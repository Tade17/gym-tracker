import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// ── Providers ─────────────────────────────────────────────────────────────────
import { TrainingDataProvider }  from './modules/training/TrainingDataContext';
import { NutritionDataProvider } from './modules/nutrition/NutritionDataContext';
import { BodyDataProvider }      from './modules/body/BodyDataContext';

// ── Módulo 1 – Entrenamiento ──────────────────────────────────────────────────
import SessionEditor   from './modules/training/pages/SessionEditor';
import ExerciseLibrary from './modules/training/pages/ExerciseLibrary';
import History         from './modules/training/pages/History';
import Templates       from './modules/training/pages/Templates';

// ── Módulo 2 – Nutrición ──────────────────────────────────────────────────────
import NutritionDay   from './modules/nutrition/pages/NutritionDay';
import FoodDatabase   from './modules/nutrition/pages/FoodDatabase';
import RecipeLibrary  from './modules/nutrition/pages/RecipeLibrary';

// ── Módulo 3 – Seguimiento corporal ───────────────────────────────────────────
import BodyTracking from './modules/body/pages/BodyTracking';

// ── Módulo 4 – Dashboard ──────────────────────────────────────────────────────
import Dashboard from './modules/dashboard/pages/Dashboard';

// ── Global ────────────────────────────────────────────────────────────────────
import Settings from './modules/training/pages/Settings';

// Todos los providers envuelven la app entera.
// Orden importante: Training es exterior porque NutritionDay lo consume.
export default function App() {
  return (
    <TrainingDataProvider>
      <NutritionDataProvider>
        <BodyDataProvider>
          <Routes>
            <Route element={<Layout />}>

              {/* ── Dashboard ── */}
              <Route path="/" element={<Dashboard />} />

              {/* ── Módulo 1 ── */}
              <Route path="/sesion/:date"  element={<SessionEditor />} />
              <Route path="/historial"     element={<History />} />
              <Route path="/ejercicios"    element={<ExerciseLibrary />} />
              <Route path="/plantillas"    element={<Templates />} />

              {/* ── Módulo 2 ── */}
              <Route path="/nutricion/:date" element={<NutritionDay />} />
              <Route path="/alimentos"       element={<FoodDatabase />} />
              <Route path="/recetas"         element={<RecipeLibrary />} />

              {/* ── Módulo 3 ── */}
              <Route path="/cuerpo" element={<BodyTracking />} />

              {/* ── Global ── */}
              <Route path="/ajustes" element={<Settings />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Route>
          </Routes>
        </BodyDataProvider>
      </NutritionDataProvider>
    </TrainingDataProvider>
  );
}
