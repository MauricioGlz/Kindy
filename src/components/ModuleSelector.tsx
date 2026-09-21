import {
  CreditCard,
  Receipt,
  Baby,
  GraduationCap,
  School,
  FolderKanban,
  ArrowLeftRight,
  Settings,
  Users,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ModuleKey, InstitutionSettings, Student, Classroom } from '../types.ts';

interface ModuleSelectorProps {
  settings: InstitutionSettings;
  students: Student[];
  classrooms: Classroom[];
  onSelectModule: (module: ModuleKey) => void;
}

export default function ModuleSelector({
  settings,
  students,
  classrooms,
  onSelectModule,
}: ModuleSelectorProps) {
  const studentsPresent = students.filter((s) => s.delivered).length;
  const totalCapacity = classrooms.reduce((acc, c) => acc + c.capacity, 0);

  const modules = [
    {
      key: 'colegiaturas' as ModuleKey,
      title: 'Colegiaturas',
      description: 'Fechas de pago y cobros',
      icon: CreditCard,
      bgIcon: 'bg-[#FEF3C7]',
      textIcon: 'text-amber-700',
      border: 'border-amber-200/80',
      tag: `${students.filter((s) => s.tuitionStatus !== 'Pagado').length} pendientes`,
    },
    {
      key: 'contabilidad' as ModuleKey,
      title: 'Contabilidad',
      description: 'Colegiaturas e ingresos',
      icon: Receipt,
      bgIcon: 'bg-[#DCFCE7]',
      textIcon: 'text-emerald-600',
      border: 'border-emerald-200/70',
      tag: `${students.filter((s) => s.tuitionStatus === 'Pendiente').length} pendientes`,
    },
    {
      key: 'alumnos' as ModuleKey,
      title: 'Alumnos',
      description: 'Expedientes y matrículas',
      icon: Baby,
      bgIcon: 'bg-[#E0F2FE]',
      textIcon: 'text-sky-500',
      border: 'border-blue-200/70',
      tag: `${students.length} registrados`,
    },
    {
      key: 'profesores' as ModuleKey,
      title: 'Profesores',
      description: 'Educadoras y personal',
      icon: GraduationCap,
      bgIcon: 'bg-[#DCFCE7]/80',
      textIcon: 'text-teal-600',
      border: 'border-green-200/70',
      tag: 'Personal activo',
    },
    {
      key: 'aulas' as ModuleKey,
      title: 'Aulas',
      description: 'Salas y control de cupo',
      icon: School,
      bgIcon: 'bg-[#FEF9C3]',
      textIcon: 'text-amber-600',
      border: 'border-yellow-200/70',
      tag: `${classrooms.length} salas`,
    },
    {
      key: 'documentos' as ModuleKey,
      title: 'Documentos',
      description: 'Expedientes digitales',
      icon: FolderKanban,
      bgIcon: 'bg-[#F3E8FF]',
      textIcon: 'text-purple-600',
      border: 'border-purple-200/70',
      tag: 'Gestor de archivos',
    },
    {
      key: 'entregas' as ModuleKey,
      title: 'Entregas y Recepciones',
      description: 'Acceso y salida por PIN',
      icon: ArrowLeftRight,
      bgIcon: 'bg-[#FCE7F3]',
      textIcon: 'text-pink-600',
      border: 'border-pink-200/70',
      tag: `${studentsPresent} en plantel`,
    },
    {
      key: 'ajustes' as ModuleKey,
      title: 'Ajustes',
      description: 'Identidad, usuarios y SQL',
      icon: Settings,
      bgIcon: 'bg-slate-100',
      textIcon: 'text-slate-600',
      border: 'border-slate-200',
      tag: 'Configuración',
    },
  ];

  return (
    <div id="view-modules-home" className="w-full max-w-4xl py-4 space-y-6">
      {/* Banner Card */}
      <div
        id="inst-banner-card"
        className="rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 relative h-40 bg-cover bg-center flex items-end p-5 transition-all"
        style={{ backgroundImage: `url('${settings.bannerUrl}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/40 to-transparent" />
        <div className="relative z-10 text-white flex flex-col sm:flex-row sm:items-end justify-between w-full gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-pink-500/80 text-white text-[10px] font-bold tracking-wide uppercase">
                Ciclo Escolar 2026
              </span>
              <span className="text-xs text-slate-200 font-mono">SQLite v3.x Activo</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight tracking-tight">{settings.name}</h2>
            <p className="text-xs text-slate-200 mt-0.5">
              Control escolar, asistencia, contabilidad, aulas y expedientes digitales
            </p>
          </div>

          {/* Quick Metrics Bar in Banner */}
          <div className="flex gap-2 text-xs">
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/25">
              <span className="text-[10px] text-slate-200 block uppercase font-medium">Alumnos En Plantel</span>
              <span className="font-bold text-white text-sm font-mono">
                {studentsPresent} / {students.length}
              </span>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/25">
              <span className="text-[10px] text-slate-200 block uppercase font-medium">Capacidad Total</span>
              <span className="font-bold text-white text-sm font-mono">
                {students.length} / {totalCapacity}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Tiles Section (Odoo Style) */}
      <div>
        <div className="flex items-center justify-between mb-3.5 px-1">
          <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Módulos del Sistema
          </h3>
          <span className="text-xs text-slate-500">Selecciona un área para comenzar</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.key}
                id={`card-module-${m.key}`}
                onClick={() => onSelectModule(m.key)}
                className={`flex flex-col items-center justify-between p-5 bg-white/95 backdrop-blur-xs rounded-3xl border ${m.border} shadow-2xs hover:shadow-md hover:-translate-y-1 transition duration-200 group text-center cursor-pointer min-h-[160px]`}
              >
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${m.bgIcon} flex items-center justify-center ${m.textIcon} group-hover:scale-110 transition duration-200 shadow-2xs`}
                >
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>

                <div className="my-2">
                  <span className="font-bold text-slate-800 text-xs sm:text-sm block leading-tight">
                    {m.title}
                  </span>
                  <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {m.description}
                  </span>
                </div>

                <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200/80 px-2 py-0.5 rounded-full">
                  {m.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
