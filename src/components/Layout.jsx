import { Outlet, NavLink } from 'react-router-dom';
import { Home, Dumbbell, Clock, TrendingUp, CalendarDays, Apple } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const navItems = [
    { to: '/', icon: Home, label: 'Inicio' },
    { to: '/routines', icon: CalendarDays, label: 'Rutinas' },
    { to: '/workout', icon: Dumbbell, label: 'Rutina' },
    { to: '/nutrition', icon: Apple, label: 'Dieta' },
    { to: '/history', icon: Clock, label: 'Historial' },
    { to: '/progress', icon: TrendingUp, label: 'Progreso' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-spidey-black text-spidey-white font-work">
      {/* Header */}
      <header className="bg-[#111112] p-4 shadow-md sticky top-0 z-10 border-b border-spidey-gray/30">
        <h1 className="text-3xl font-anton text-center text-spidey-red tracking-wide">GYM TRACKER</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-[#111112] border-t border-spidey-gray/30 fixed bottom-0 w-full z-10 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-full h-full space-y-1',
                  isActive ? 'text-spidey-red' : 'text-spidey-gray hover:text-spidey-white'
                )
              }
            >
              <item.icon size={24} />
              <span className="text-[10px] font-archivo uppercase">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
