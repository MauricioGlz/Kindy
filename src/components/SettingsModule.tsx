import { useState } from 'react';
import {
  Settings,
  Image as ImageIcon,
  UserPlus,
  Trash2,
  Database,
  RefreshCw,
  CheckCircle2,
  KeyRound,
  Building,
  Shield,
  Palette,
  CreditCard,
  BookOpen,
  Plus,
  ListChecks,
  RotateCcw,
  Boxes,
  Receipt,
  School,
} from 'lucide-react';
import { InstitutionSettings, Employee, EnabledModulesConfig } from '../types.ts';
import { useDebugMode } from '../context/DebugContext.tsx';

interface SettingsModuleProps {
  settings: InstitutionSettings;
  employees: Employee[];
  onUpdateSettings: (newSettings: InstitutionSettings) => void;
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onDeleteEmployee: (id: number) => void;
  onOpenSqlConsole: () => void;
  onResetDatabase: () => void;
}

export default function SettingsModule({
  settings,
  employees,
  onUpdateSettings,
  onAddEmployee,
  onDeleteEmployee,
  onOpenSqlConsole,
  onResetDatabase,
}: SettingsModuleProps) {
  const { isDebugMode } = useDebugMode();
  const [instName, setInstName] = useState<string>(settings.name);
  const [logoUrl, setLogoUrl] = useState<string>(settings.logoUrl);
  const [bannerUrl, setBannerUrl] = useState<string>(settings.bannerUrl);
  const [loginBgUrl, setLoginBgUrl] = useState<string>(settings.loginBgUrl || '');
  const [bankName, setBankName] = useState<string>(settings.bankName || 'BBVA México');
  const [accountHolder, setAccountHolder] = useState<string>(settings.accountHolder || settings.name);
  const [clabe, setClabe] = useState<string>(settings.clabe || '012 180 01548293019 4');
  const [accountNumber, setAccountNumber] = useState<string>(settings.accountNumber || '1548293019');
  const [enabledModules, setEnabledModules] = useState<EnabledModulesConfig>(
    settings.enabledModules || {
      libreta: true,
      contabilidad: true,
      aulas: true,
      profesores: true,
      documentos: true,
    }
  );
  const [activitiesList, setActivitiesList] = useState<string[]>(
    settings.customActivities && settings.customActivities.length > 0
      ? settings.customActivities
      : [
          'Comió toda su comida / porción',
          'Durmió siesta (sueño reparador)',
          'Fue al baño / control de esfínteres / cambio de pañal',
          'Participó en dinámicas, cantos y asamblea',
          'Hidratación adecuada (bebió agua)',
          'Juego al aire libre y estimulación motriz',
        ]
  );
  const [newActivityInput, setNewActivityInput] = useState<string>('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // New Employee Form State
  const [showEmpModal, setShowEmpModal] = useState<boolean>(false);
  const [empName, setEmpName] = useState<string>('');
  const [empRole, setEmpRole] = useState<string>('Educadora');
  const [empPin, setEmpPin] = useState<string>('123456');
  const [empPhoto, setEmpPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200'
  );

  const handleToggleModule = (moduleKey: keyof EnabledModulesConfig) => {
    const updated: EnabledModulesConfig = {
      ...enabledModules,
      [moduleKey]: !enabledModules[moduleKey],
    };
    setEnabledModules(updated);
    onUpdateSettings({
      ...settings,
      name: instName.trim(),
      logoUrl: logoUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      loginBgUrl: loginBgUrl.trim() || undefined,
      bankName: bankName.trim(),
      accountHolder: accountHolder.trim(),
      clabe: clabe.trim(),
      accountNumber: accountNumber.trim(),
      customActivities: activitiesList,
      enabledModules: updated,
    });
    setSavedNotice(
      `Módulo "${
        moduleKey === 'libreta'
          ? 'Libreta de Actividades'
          : moduleKey === 'contabilidad'
          ? 'Contabilidad'
          : moduleKey === 'aulas'
          ? 'Aulas y Salas'
          : moduleKey === 'profesores'
          ? 'Profesores'
          : 'Documentos'
      }" ${updated[moduleKey] ? 'habilitado' : 'deshabilitado'} exitosamente.`
    );
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      name: instName.trim(),
      logoUrl: logoUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      loginBgUrl: loginBgUrl.trim() || undefined,
      bankName: bankName.trim(),
      accountHolder: accountHolder.trim(),
      clabe: clabe.trim(),
      accountNumber: accountNumber.trim(),
      customActivities: activitiesList,
      enabledModules,
    });
    setSavedNotice(
      isDebugMode
        ? '¡Ajustes de identidad, cuenta bancaria y actividades guardados en SQLite!'
        : '¡Ajustes guardados exitosamente!'
    );
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleAddActivity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newActivityInput.trim();
    if (!clean) return;
    if (activitiesList.includes(clean)) {
      alert('Esta actividad ya está en la lista de la libreta.');
      return;
    }
    const updated = [...activitiesList, clean];
    setActivitiesList(updated);
    setNewActivityInput('');
    onUpdateSettings({
      ...settings,
      name: instName.trim(),
      logoUrl: logoUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      loginBgUrl: loginBgUrl.trim() || undefined,
      bankName: bankName.trim(),
      accountHolder: accountHolder.trim(),
      clabe: clabe.trim(),
      accountNumber: accountNumber.trim(),
      customActivities: updated,
    });
    setSavedNotice('¡Nueva actividad agregada a la libreta escolar!');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleRemoveActivity = (idx: number) => {
    if (activitiesList.length <= 1) {
      alert('Debe haber al menos una actividad en la libreta diaria.');
      return;
    }
    const updated = activitiesList.filter((_, i) => i !== idx);
    setActivitiesList(updated);
    onUpdateSettings({
      ...settings,
      name: instName.trim(),
      logoUrl: logoUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      loginBgUrl: loginBgUrl.trim() || undefined,
      bankName: bankName.trim(),
      accountHolder: accountHolder.trim(),
      clabe: clabe.trim(),
      accountNumber: accountNumber.trim(),
      customActivities: updated,
    });
    setSavedNotice('¡Actividad eliminada de la libreta escolar!');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleResetActivities = () => {
    const defaults = [
      'Comió toda su comida / porción',
      'Durmió siesta (sueño reparador)',
      'Fue al baño / control de esfínteres / cambio de pañal',
      'Participó en dinámicas, cantos y asamblea',
      'Hidratación adecuada (bebió agua)',
      'Juego al aire libre y estimulación motriz',
    ];
    setActivitiesList(defaults);
    onUpdateSettings({
      ...settings,
      name: instName.trim(),
      logoUrl: logoUrl.trim(),
      bannerUrl: bannerUrl.trim(),
      loginBgUrl: loginBgUrl.trim() || undefined,
      bankName: bankName.trim(),
      accountHolder: accountHolder.trim(),
      clabe: clabe.trim(),
      accountNumber: accountNumber.trim(),
      customActivities: defaults,
    });
    setSavedNotice('¡Actividades restauradas a los valores sugeridos!');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || empPin.length !== 6) {
      alert('Por favor ingresa un nombre y un PIN numérico de 6 dígitos.');
      return;
    }
    onAddEmployee({
      name: empName.trim(),
      role: empRole.trim(),
      pin: empPin.trim(),
      photo: empPhoto.trim(),
    });
    setShowEmpModal(false);
    setEmpName('');
    setEmpPin('123456');
    setSavedNotice(`¡Empleado ${empName} dado de alta con PIN ${empPin}!`);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  return (
    <div id="view-module-ajustes" className="w-full max-w-4xl space-y-6">
      {savedNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-2xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" /> Ajustes del Sistema y Personalización
          </h2>
          <p className="text-xs text-slate-500">
            Identidad escolar, fondos de pantalla y gestión de empleados{isDebugMode ? ' y base de datos SQL' : ''}
          </p>
        </div>
        {isDebugMode && (
          <div className="flex items-center gap-2 animate-fadeIn">
            <button
              id="btn-open-sql-from-settings"
              onClick={onOpenSqlConsole}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-emerald-300 shadow-2xs cursor-pointer"
            >
              <Database className="w-4 h-4 text-emerald-600" /> Consola SQL
            </button>
          </div>
        )}
      </div>

      {/* SECTION: MODULAR SYSTEM ARCHITECTURE (PERSONALIZACIÓN MODULAR) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                Arquitectura Modular del Sistema
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wide">
                  Personalizable
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Activa o desactiva módulos según las necesidades operativas de tu plantel
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {Object.values(enabledModules).filter(Boolean).length} módulos activos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* 1. LIBRETA DE ACTIVIDADES */}
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
              enabledModules.libreta
                ? 'bg-amber-50/50 border-amber-200 shadow-2xs'
                : 'bg-slate-50/70 border-slate-200 opacity-70'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    enabledModules.libreta
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-200 text-slate-500 border-slate-300'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Libreta de Actividades</h4>
                  <span className="text-[10px] text-slate-400">Bitácora y reportes diarios</span>
                </div>
              </div>

              {/* Toggle switch button */}
              <button
                type="button"
                onClick={() => handleToggleModule('libreta')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enabledModules.libreta ? 'bg-amber-500' : 'bg-slate-300'
                }`}
                title={enabledModules.libreta ? 'Desactivar módulo' : 'Activar módulo'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabledModules.libreta ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Bitácora diaria con estados de ánimo, rutinas cumplidas, observaciones y firma de enterado de los tutores.
            </p>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500">Estado:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                  enabledModules.libreta
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {enabledModules.libreta ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </div>
          </div>

          {/* 2. CONTABILIDAD Y COLEGIATURAS */}
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
              enabledModules.contabilidad
                ? 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                : 'bg-slate-50/70 border-slate-200 opacity-70'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    enabledModules.contabilidad
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-200 text-slate-500 border-slate-300'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Contabilidad</h4>
                  <span className="text-[10px] text-slate-400">Colegiaturas y cobros</span>
                </div>
              </div>

              {/* Toggle switch button */}
              <button
                type="button"
                onClick={() => handleToggleModule('contabilidad')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enabledModules.contabilidad ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                title={enabledModules.contabilidad ? 'Desactivar módulo' : 'Activar módulo'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabledModules.contabilidad ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Control de cuotas mensuales, vencimientos, estados de pago y botón de pago rápido en entregas.
            </p>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500">Estado:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                  enabledModules.contabilidad
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {enabledModules.contabilidad ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </div>
          </div>

          {/* 3. AULAS Y SALAS */}
          <div
            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
              enabledModules.aulas
                ? 'bg-amber-50/50 border-yellow-200 shadow-2xs'
                : 'bg-slate-50/70 border-slate-200 opacity-70'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    enabledModules.aulas
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                      : 'bg-slate-200 text-slate-500 border-slate-300'
                  }`}
                >
                  <School className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Aulas y Salas</h4>
                  <span className="text-[10px] text-slate-400">Cupos y distribución</span>
                </div>
              </div>

              {/* Toggle switch button */}
              <button
                type="button"
                onClick={() => handleToggleModule('aulas')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  enabledModules.aulas ? 'bg-amber-500' : 'bg-slate-300'
                }`}
                title={enabledModules.aulas ? 'Desactivar módulo' : 'Activar módulo'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabledModules.aulas ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Administración de salas, capacidad máxima de alumnos, cálculo de ocupación y asignación de grupos.
            </p>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-500">Estado:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                  enabledModules.aulas
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {enabledModules.aulas ? 'Habilitado' : 'Deshabilitado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: INSTITUTION IDENTITY & WALLPAPERS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Building className="w-4 h-4 text-pink-500" />
          <h3 className="font-bold text-slate-800 text-sm">
            Identidad Institucional y Fondos de Pantalla
          </h3>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-600 mb-1">Nombre de la Institución *</label>
            <input
              required
              type="text"
              value={instName}
              onChange={(e) => setInstName(e.target.value)}
              className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 font-semibold text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-600 mb-1">URL de Logotipo Escolar</label>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                Fondo de Pantalla de Inicio / Login (Opcional)
              </label>
              <input
                type="text"
                value={loginBgUrl}
                onChange={(e) => setLoginBgUrl(e.target.value)}
                placeholder="Dejar en blanco para degradado pastel"
                className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-600 mb-1">
              Foto de Portada / Banner del Módulo de Inicio
            </label>
            <input
              type="text"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 font-mono text-[11px]"
            />
          </div>

          {/* Wallpaper Presets */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              Presets de fondo sugeridos para login o portada:
            </span>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <button
                type="button"
                onClick={() =>
                  setBannerUrl(
                    'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1200&q=80'
                  )
                }
                className="px-2.5 py-1 bg-[#FAF7F5] hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition cursor-pointer"
              >
                Salón Infantil de Juegos
              </button>
              <button
                type="button"
                onClick={() =>
                  setBannerUrl(
                    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80'
                  )
                }
                className="px-2.5 py-1 bg-[#FAF7F5] hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition cursor-pointer"
              >
                Material Didáctico Montessori
              </button>
              <button
                type="button"
                onClick={() => setLoginBgUrl('')}
                className="px-2.5 py-1 bg-[#FCE7F3] hover:bg-pink-200 rounded-lg text-pink-900 font-medium transition cursor-pointer"
              >
                Degradado Pastel Predeterminado
              </button>
            </div>
          </div>

          {/* Bank details for tuition transfers */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span className="font-bold text-slate-800 text-xs">
                Cuenta Bancaria Institucional (Para Pagos por Transferencia)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Institución Bancaria</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Ej. BBVA México"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Nombre del Beneficiario / Titular</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Ej. Kinder Creativo Montessori S.C."
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">CLABE Interbancaria (18 dígitos)</label>
                <input
                  type="text"
                  value={clabe}
                  onChange={(e) => setClabe(e.target.value)}
                  placeholder="012 180 01548293019 4"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 font-mono text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Número de Cuenta</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="1548293019"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 font-mono text-xs text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#DCFCE7] hover:bg-emerald-200 text-emerald-950 font-bold rounded-xl text-xs transition shadow-2xs cursor-pointer border border-emerald-300"
            >
              Guardar Identidad y Datos Bancarios en SQLite
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: EMPLOYEES MANAGEMENT (LOGIN PROFILES) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Altas y Bajas de Empleados (Acceso por PIN)
              </h3>
              <p className="text-[11px] text-slate-400">
                Usuarios habilitados para iniciar sesión en la pantalla de bienvenida
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowEmpModal(true)}
            className="px-3.5 py-1.5 bg-[#E0F2FE] hover:bg-sky-200 text-sky-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer border border-sky-300"
          >
            <UserPlus className="w-3.5 h-3.5 text-sky-700" /> Alta de Empleado
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="p-3.5 rounded-2xl bg-[#FAF7F5] border border-slate-200/80 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5 truncate">
                <img
                  src={emp.photo}
                  alt={emp.name}
                  className="w-10 h-10 rounded-full object-cover border border-white shadow-2xs shrink-0"
                />
                <div className="truncate">
                  <span className="font-bold text-xs text-slate-800 block truncate">{emp.name}</span>
                  <span className="text-[10px] text-pink-700 block">{emp.role}</span>
                  <span className="text-[10px] text-slate-400 font-mono">PIN: {emp.pin}</span>
                </div>
              </div>

              {employees.length > 1 && (
                <button
                  onClick={() => {
                    if (confirm(`¿Dar de baja a ${emp.name}?`)) {
                      onDeleteEmployee(emp.id);
                    }
                  }}
                  className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Dar de baja empleado"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: CUSTOMIZABLE DAILY ACTIVITIES (LIBRETA DE ACTIVIDADES) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Personalización de Actividades Diarias (Libreta Escolar)
              </h3>
              <p className="text-[11px] text-slate-400">
                Configura el catálogo de rutinas que las educadoras marcan en la libreta diaria de los alumnos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetActivities}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
            title="Restablecer a rutinas recomendadas"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Valores sugeridos</span>
          </button>
        </div>

        {/* Input to add a new custom activity */}
        <form onSubmit={handleAddActivity} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newActivityInput}
              onChange={(e) => setNewActivityInput(e.target.value)}
              placeholder="Nueva actividad (ej. Aprendió vocabulario nuevo en inglés, Lavado de dientes)..."
              className="w-full pl-8 pr-3 py-2 bg-[#FAF7F5] border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-200 text-slate-800 font-medium"
            />
            <ListChecks className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </button>
        </form>

        {/* List of current activities */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold text-slate-500 block">
            Actividades activas ({activitiesList.length}):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {activitiesList.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#FAF7F5] border border-slate-200 flex items-center justify-between gap-2 group hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 truncate" title={item}>
                    {item}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveActivity(idx)}
                  className="p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer shrink-0"
                  title="Eliminar actividad de la libreta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: DATABASE TOOLS & RESET (ONLY IN DEBUG MODE) */}
      {isDebugMode && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 animate-fadeIn">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Herramientas de Base de Datos SQLite</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 text-xs block">Reestablecer Datos de Demostración</span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Restaura los alumnos de prueba, bitácora de asistencias y aulas a sus valores iniciales en SQLite.
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('¿Deseas reiniciar la base de datos a sus valores demo predeterminados?')) {
                  onResetDatabase();
                }
              }}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reestablecer Datos Demo
            </button>
          </div>
        </div>
      )}

      {/* MODAL ALTA EMPLEADO */}
      {showEmpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-scaleIn">
            <h3 className="text-base font-bold text-slate-800 mb-3">Alta de Empleado</h3>
            <form onSubmit={handleAddEmployeeSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Nombre Completo *</label>
                <input
                  required
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="Ej. Sofía Mendoza"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Rol / Cargo</label>
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none"
                >
                  <option value="Directora">Directora</option>
                  <option value="Coordinadora">Coordinadora</option>
                  <option value="Educadora">Educadora</option>
                  <option value="Administración">Administración</option>
                  <option value="Recepción">Recepción</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  PIN de Acceso (6 dígitos) *
                </label>
                <input
                  required
                  type="text"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={empPin}
                  onChange={(e) => setEmpPin(e.target.value)}
                  placeholder="123456"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none font-mono font-bold tracking-widest text-pink-700"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">URL de Foto</label>
                <input
                  type="text"
                  value={empPhoto}
                  onChange={(e) => setEmpPhoto(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none font-mono text-[10px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmpModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E0F2FE] hover:bg-sky-200 text-sky-950 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer border border-sky-300"
                >
                  Dar de Alta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
