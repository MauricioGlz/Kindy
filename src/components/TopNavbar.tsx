import { LayoutGrid, LogOut, Database, Terminal, ShieldCheck } from 'lucide-react';
import { Employee, InstitutionSettings } from '../types.ts';
import { useDebugMode } from '../context/DebugContext.tsx';

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
  const { isDebugMode, openDebugModal, deactivateDebugMode } = useDebugMode();

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between shadow-2xs z-30 shrink-0">
      <div className="flex items-center gap-3">
        <button
          id="btn-nav-home"
          onClick={onGoHome}
          className="p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer text-slate-700"
          title="Menú de Módulos"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <img
            src={settings.logoUrl}
            alt={settings.name}
            className="w-7 h-7 rounded-lg object-cover border border-slate-200 shadow-2xs"
          />
          <h1 className="font-bold text-slate-800 text-sm sm:text-base tracking-tight truncate max-w-[150px] sm:max-w-none">
            {settings.name}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* BOTÓN MODO DE DEPURACIÓN (Solicitado en la barra superior) */}
        {!isDebugMode ? (
          <button
            id="btn-toggle-debug-mode"
            onClick={openDebugModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-full text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs hover:border-slate-400"
            title="Activar Modo de Depuración Técnico"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-xs">Modo de depuración</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            {/* Active Debug Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-full text-amber-900 text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[11px] font-bold">Depuración Activa</span>
              <button
                onClick={deactivateDebugMode}
                className="ml-1 text-amber-700 hover:text-amber-950 font-bold p-0.5 rounded cursor-pointer"
                title="Bloquear y Salir de Depuración"
              >
                ✕
              </button>
            </div>

            {/* BOTÓN TÉCNICO: Consola SQLite (SOLO VISIBLE EN MODO DEPURACIÓN) */}
            <button
              id="btn-nav-sql-console"
              onClick={onOpenSqlConsole}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-full text-emerald-900 text-xs font-semibold transition cursor-pointer shadow-2xs animate-fadeIn"
              title="Abrir Consola e Inspector SQLite"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono text-[11px]">Consola SQLite</span>
            </button>
          </div>
        )}

        {/* User indicator */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200 text-xs text-slate-700 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="truncate max-w-[130px]">{currentUser.name}</span>
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
