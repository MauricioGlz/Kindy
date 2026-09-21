import { LayoutGrid, LogOut, Database, UserCheck } from 'lucide-react';
import { Employee, InstitutionSettings } from '../types.ts';

interface TopNavbarProps {
  settings: InstitutionSettings;
  currentUser: Employee | null;
  onGoHome: () => void;
  onLogout: () => void;
  onOpenSqlConsole: () => void;
}

export default function TopNavbar({
  settings,
  currentUser,
  onGoHome,
  onLogout,
  onOpenSqlConsole,
}: TopNavbarProps) {
  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between shadow-2xs z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button
          id="btn-nav-home"
          onClick={onGoHome}
          className="p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer text-slate-700"
          title="Menú de Módulos (Estilo Odoo)"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src={settings.logoUrl}
            alt={settings.name}
            className="w-7 h-7 rounded-lg object-cover border border-slate-200 shadow-2xs"
          />
          <h1 className="font-bold text-slate-800 text-sm sm:text-base tracking-tight truncate max-w-[160px] sm:max-w-none">
            {settings.name}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* SQL Database status button */}
        <button
          onClick={onOpenSqlConsole}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full text-emerald-800 text-xs font-semibold transition cursor-pointer"
          title="Abrir Consola e Inspector SQLite"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden md:inline font-mono text-[11px]">SQLite SQL</span>
        </button>

        {/* User indicator */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200 text-xs text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="truncate max-w-[140px]">{currentUser.name}</span>
          </div>
        )}

        {/* Logout */}
        <button
          id="btn-nav-logout"
          onClick={onLogout}
          className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 transition cursor-pointer"
          title="Cerrar sesión / Salir"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
}
