import React from 'react';
import {
  CreditCard,
  QrCode,
  Users,
  Building2,
  Calculator,
  FileText,
  GraduationCap,
  Settings,
  Database,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
} from 'lucide-react';
import { ModuleKey, Student, Classroom } from '../types.ts';

interface ModuleSelectorProps {
  students: Student[];
  classrooms: Classroom[];
  onSelectModule: (module: ModuleKey) => void;
  onOpenSqlConsole: () => void;
}

export default function ModuleSelector({
  students,
  classrooms,
  onSelectModule,
  onOpenSqlConsole,
}: ModuleSelectorProps) {
  const inPlantelCount = students.filter((s) => s.delivered).length;
  const outsideCount = students.length - inPlantelCount;
  const pendingTuitions = students.filter((s) => s.tuitionStatus !== 'Pagado').length;
  const totalTuitionAmount = students.reduce((sum, s) => sum + s.tuitionAmount, 0);

  const modules = [
    {
      key: 'colegiaturas' as ModuleKey,
      title: 'Colegiaturas y Pagos',
      desc: 'Consulta de montos a pagar, fechas de vencimiento y pagos por Transferencia o Tarjeta bancaria.',
      badge: `${pendingTuitions} pendientes`,
      badgeColor: pendingTuitions > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
      icon: <CreditCard className="w-6 h-6 text-pink-500" />,
      accentColor: 'border-pink-200 hover:border-pink-400 bg-gradient-to-br from-pink-50/40 via-white to-white',
      featured: true,
    },
    {
      key: 'entregas' as ModuleKey,
      title: 'Entregas y Recepciones por QR',
      desc: 'Escaneo con cámara de códigos QR criptográficos para padres y familiares autorizados con sincronización de colegiaturas.',
      badge: `${inPlantelCount} en plantel`,
      badgeColor: 'bg-emerald-100 text-emerald-800',
      icon: <QrCode className="w-6 h-6 text-emerald-600" />,
      accentColor: 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-br from-emerald-50/40 via-white to-white',
      featured: true,
    },
    {
      key: 'alumnos' as ModuleKey,
      title: 'Alumnos y Expedientes',
      desc: 'Registro completo de alumnos, expedientes médicos, tutores, familiares de confianza y emisión de credenciales QR.',
      badge: `${students.length} alumnos`,
      badgeColor: 'bg-sky-100 text-sky-800',
      icon: <Users className="w-6 h-6 text-sky-600" />,
      accentColor: 'border-slate-200 hover:border-sky-300 bg-white',
    },
    {
      key: 'aulas' as ModuleKey,
      title: 'Aulas y Salas',
      desc: 'Organización por grupos de edad (Maternal, Kínder, Preprimaria), capacidades y asignación de alumnos.',
      badge: `${classrooms.length} aulas`,
      badgeColor: 'bg-indigo-100 text-indigo-800',
      icon: <Building2 className="w-6 h-6 text-indigo-600" />,
      accentColor: 'border-slate-200 hover:border-indigo-300 bg-white',
    },
    {
      key: 'contabilidad' as ModuleKey,
      title: 'Contabilidad y Finanzas',
      desc: 'Control de ingresos por colegiatura, balances de caja, egresos de materiales y reportes contables.',
      badge: `$${totalTuitionAmount.toLocaleString('es-MX')} mensual`,
      badgeColor: 'bg-purple-100 text-purple-800',
      icon: <Calculator className="w-6 h-6 text-purple-600" />,
      accentColor: 'border-slate-200 hover:border-purple-300 bg-white',
    },
    {
      key: 'documentos' as ModuleKey,
      title: 'Administrador de Documentos',
      desc: 'Actas de nacimiento, CURP, comprobantes de vacunación y solicitudes de admisión en base de datos.',
      badge: 'Expedientes digitales',
      badgeColor: 'bg-amber-100 text-amber-800',
      icon: <FileText className="w-6 h-6 text-amber-600" />,
      accentColor: 'border-slate-200 hover:border-amber-300 bg-white',
    },
    {
      key: 'profesores' as ModuleKey,
      title: 'Profesores y Educadoras',
      desc: 'Directorio de maestras titulares, especialidades pedagógicas, teléfonos y asignación a salas.',
      badge: 'Equipo docente',
      badgeColor: 'bg-teal-100 text-teal-800',
      icon: <GraduationCap className="w-6 h-6 text-teal-600" />,
      accentColor: 'border-slate-200 hover:border-teal-300 bg-white',
    },
    {
      key: 'ajustes' as ModuleKey,
      title: 'Ajustes del Sistema',
      desc: 'Datos de la guardería, datos bancarios para transferencias, cuotas de colegiatura y personal.',
      badge: 'Configuración',
      badgeColor: 'bg-slate-100 text-slate-700',
      icon: <Settings className="w-6 h-6 text-slate-600" />,
      accentColor: 'border-slate-200 hover:border-slate-300 bg-white',
    },
  ];

  return (
    <div id="view-module-selector" className="space-y-6">
      {/* Quick Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Alumnos en Plantel
            </span>
            <span className="text-xl font-bold text-slate-900 font-mono">{inPlantelCount}</span>
            <span className="text-[10px] text-emerald-700 block font-medium">
              {outsideCount} fuera del plantel
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Colegiaturas del Mes
            </span>
            <span className="text-xl font-bold text-slate-900 font-mono">
              {students.length - pendingTuitions} / {students.length}
            </span>
            <span className="text-[10px] text-pink-700 block font-medium">
              {pendingTuitions} alumnos pendientes
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3.5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Motor Relacional SQL
              </span>
              <span className="text-sm font-bold text-slate-800 block">SQLite Activo</span>
              <span className="text-[10px] text-indigo-600 block">7 tablas persistentes</span>
            </div>
          </div>
          <button
            onClick={onOpenSqlConsole}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Abrir
          </button>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((mod) => (
          <div
            key={mod.key}
            onClick={() => onSelectModule(mod.key)}
            className={`rounded-3xl p-5 border ${mod.accentColor} shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
          >
            {mod.featured && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
            )}

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 rounded-2xl bg-white shadow-2xs border border-slate-100 group-hover:scale-110 transition">
                  {mod.icon}
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${mod.badgeColor}`}>
                  {mod.badge}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-pink-600 transition">
                {mod.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {mod.desc}
              </p>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-pink-600 transition">
              <span>Abrir Módulo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
