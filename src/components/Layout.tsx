import { NavLink, Outlet } from 'react-router-dom';
import { Home, Dumbbell, Apple, Scale, Settings2 } from 'lucide-react';
import { toISODate } from '../lib/date';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-24 px-4 pt-4 max-w-2xl mx-auto w-full">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const today = toISODate();

  // 5 tabs — Dashboard como punto de entrada, el resto por módulo.
  // Historial y Biblioteca están accesibles desde Dashboard y desde cada módulo.
  const tabs = [
    { to: '/',                   label: 'Hoy',       icon: Home,      end: true },
    { to: `/sesion/${today}`,    label: 'Entreno',   icon: Dumbbell,  end: false },
    { to: `/nutricion/${today}`, label: 'Nutrición', icon: Apple,     end: false },
    { to: '/cuerpo',             label: 'Cuerpo',    icon: Scale,     end: false },
    { to: '/ajustes',            label: 'Ajustes',   icon: Settings2, end: false },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700/60 z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex justify-around max-w-2xl mx-auto">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium tracking-wide transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-500'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.75} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
