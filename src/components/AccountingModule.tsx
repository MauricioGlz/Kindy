import { useState } from 'react';
import {
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Student } from '../types.ts';

interface AccountingModuleProps {
  students: Student[];
  onToggleTuitionStatus: (studentId: number) => void;
}

export default function AccountingModule({
  students,
  onToggleTuitionStatus,
}: AccountingModuleProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const totalIncome = students
    .filter((s) => s.tuitionStatus === 'Pagado')
    .reduce((acc, s) => acc + s.tuitionAmount, 0) + 40000; // Base historical fees

  const totalExpenses = 18450;
  const netBalance = totalIncome - totalExpenses;

  const filteredStudents = students.filter((s) => {
    if (filterStatus === 'all') return true;
    return s.tuitionStatus.toLowerCase() === filterStatus.toLowerCase();
  });

  const handleExport = () => {
    const csvHeader = 'ID,Alumno,Aula,Colegiatura,Estado\n';
    const rows = students
      .map((s) => `${s.id},"${s.name}","${s.classroom}",$${s.tuitionAmount},${s.tuitionStatus}`)
      .join('\n');
    const blob = new Blob([csvHeader + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_contabilidad_kinder_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice('¡Archivo CSV de colegiaturas exportado exitosamente!');
    setTimeout(() => setExportNotice(null), 3500);
  };

  return (
    <div id="view-module-contabilidad" className="w-full max-w-4xl space-y-5">
      {exportNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-2xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" /> Módulo Contable y Colegiaturas
          </h2>
          <p className="text-xs text-slate-500">
            Supervisión de colegiaturas, ingresos y egresos institucionales
          </p>
        </div>
        <button
          id="btn-export-accounting"
          onClick={handleExport}
          className="px-4 py-2 bg-[#E0F2FE] hover:bg-sky-200 text-sky-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer border border-sky-300"
        >
          <FileSpreadsheet className="w-4 h-4 text-sky-800" /> Exportar Datos CSV
        </button>
      </div>

      {/* Metrics Cards: Ingresos, Egresos, Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Total Ingresos</span>
            <span className="text-xl font-bold text-emerald-600 font-mono tracking-tight">
              ${totalIncome.toLocaleString('es-MX')}.00
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">Colegiaturas y cuotas</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#DCFCE7] flex items-center justify-center text-emerald-600 shadow-2xs">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-pink-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Total Egresos</span>
            <span className="text-xl font-bold text-rose-500 font-mono tracking-tight">
              ${totalExpenses.toLocaleString('es-MX')}.00
            </span>
            <span className="text-[10px] text-rose-600 block mt-0.5">Nómina e insumos didácticos</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#FCE7F3] flex items-center justify-center text-rose-500 shadow-2xs">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-blue-100 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold block">Balance Neto</span>
            <span className="text-xl font-bold text-sky-700 font-mono tracking-tight">
              ${netBalance.toLocaleString('es-MX')}.00
            </span>
            <span className="text-[10px] text-sky-700 block mt-0.5">Superávit operativo</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-[#E0F2FE] flex items-center justify-center text-sky-600 shadow-2xs">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Student Tuition Control Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-slate-800 text-sm">
            Control de Colegiaturas por Alumnos ({students.length})
          </h3>

          {/* Filters */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({students.length})
            </button>
            <button
              onClick={() => setFilterStatus('pagado')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterStatus === 'pagado'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Pagados ({students.filter((s) => s.tuitionStatus === 'Pagado').length})
            </button>
            <button
              onClick={() => setFilterStatus('pendiente')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterStatus === 'pendiente'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Pendientes ({students.filter((s) => s.tuitionStatus === 'Pendiente').length})
            </button>
            <button
              onClick={() => setFilterStatus('vencido')}
              className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                filterStatus === 'vencido'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Vencidos ({students.filter((s) => s.tuitionStatus === 'Vencido').length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-3 font-semibold">Alumno</th>
                <th className="pb-3 font-semibold">Aula</th>
                <th className="pb-3 font-semibold">Monto Mensual</th>
                <th className="pb-3 font-semibold">Beca</th>
                <th className="pb-3 font-semibold">Estado Colegiatura</th>
                <th className="pb-3 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredStudents.map((child) => {
                const badgeClass =
                  child.tuitionStatus === 'Pagado'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : child.tuitionStatus === 'Pendiente'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200';

                return (
                  <tr key={child.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 flex items-center gap-2.5">
                      <img
                        src={child.photo}
                        alt={child.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 block">{child.name}</span>
                        <span className="text-[10px] text-slate-400">{child.paymentDate}</span>
                      </div>
                    </td>
                    <td className="py-3 font-medium">{child.classroom}</td>
                    <td className="py-3 font-mono font-bold text-slate-800">
                      ${child.tuitionAmount.toLocaleString('es-MX')}.00
                    </td>
                    <td className="py-3">
                      {child.hasScholarship ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-emerald-900 border border-emerald-200">
                          {child.scholarshipPercent}% Desc.
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Normal</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
                        {child.tuitionStatus}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onToggleTuitionStatus(child.id)}
                        className="px-3 py-1.5 bg-[#E0F2FE] hover:bg-sky-200 text-sky-950 rounded-xl text-xs font-semibold transition cursor-pointer border border-sky-300 shadow-2xs"
                      >
                        Cambiar Estado
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
