import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  Calendar,
  Users,
  BadgePercent,
} from 'lucide-react';
import { Student, InstitutionSettings } from '../types.ts';
import PaymentModal from './PaymentModal.tsx';

interface ColegiaturasModuleProps {
  students: Student[];
  settings: InstitutionSettings;
  onPayTuition: (studentId: number, method: 'transferencia' | 'tarjeta', amount: number) => Promise<void> | void;
}

export default function ColegiaturasModule({
  students,
  settings,
  onPayTuition,
}: ColegiaturasModuleProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pendiente' | 'Pagado' | 'Vencido'>('all');
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Metrics
  const totalPaid = useMemo(() => {
    return students
      .filter((s) => s.tuitionStatus === 'Pagado')
      .reduce((sum, s) => sum + s.tuitionAmount, 0);
  }, [students]);

  const totalPending = useMemo(() => {
    return students
      .filter((s) => s.tuitionStatus !== 'Pagado')
      .reduce((sum, s) => sum + s.tuitionAmount, 0);
  }, [students]);

  const paidCount = students.filter((s) => s.tuitionStatus === 'Pagado').length;
  const pendingCount = students.filter((s) => s.tuitionStatus !== 'Pagado').length;

  // Filtered list
  const filteredStudents = useMemo(() => {
    return students.filter((std) => {
      const matchSearch =
        std.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        std.classroom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        std.father.toLowerCase().includes(searchTerm.toLowerCase()) ||
        std.mother.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (filterStatus === 'all') return true;
      return std.tuitionStatus === filterStatus;
    });
  }, [students, searchTerm, filterStatus]);

  const handleOpenPayment = (student: Student) => {
    setSelectedStudentForPayment(student);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async (studentId: number, method: 'transferencia' | 'tarjeta', amount: number) => {
    await onPayTuition(studentId, method, amount);
    const updated = students.find((s) => s.id === studentId);
    setSuccessToast(`¡Pago de $${amount.toLocaleString('es-MX')} MXN registrado exitosamente para ${updated?.name || 'el alumno'}!`);
    setTimeout(() => setSuccessToast(null), 4500);
  };

  return (
    <div id="view-module-colegiaturas" className="w-full max-w-5xl space-y-5">
      {/* Toast Notice */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Module Header Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <CreditCard className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
              Gestión de Colegiaturas
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Colegiaturas y Pagos de Alumnos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulta de fechas de pago, montos de matrícula y liquidación directa por Transferencia bancaria o Tarjeta.
          </p>
        </div>

        {/* Quick Institution Bank Badge */}
        <div className="bg-[#FAF7F5] border border-slate-200/80 rounded-2xl p-3 text-xs flex items-center gap-3">
          <Building2 className="w-7 h-7 text-blue-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Cuenta Receptora</span>
            <span className="font-bold text-slate-800 block text-xs">{settings.bankName || 'BBVA México'}</span>
            <span className="font-mono text-[11px] text-slate-500">{settings.clabe || '012 180 01548293019 4'}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Recaudado Este Mes
            </span>
            <span className="text-lg font-bold text-slate-900 font-mono">
              ${totalPaid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-700 block font-medium">
              {paidCount} de {students.length} alumnos al corriente
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Por Cobrar / Pendientes
            </span>
            <span className="text-lg font-bold text-slate-900 font-mono">
              ${totalPending.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-amber-700 block font-medium">
              {pendingCount} colegiaturas pendientes
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Efectividad de Cobro
            </span>
            <span className="text-lg font-bold text-slate-900 font-mono">
              {students.length > 0 ? Math.round((paidCount / students.length) * 100) : 0}%
            </span>
            <span className="text-[10px] text-slate-500 block">
              Total matrícula: {students.length} alumnos
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por alumno, aula o tutor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400/50"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl gap-1 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Todos ({students.length})
          </button>
          <button
            onClick={() => setFilterStatus('Pendiente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'Pendiente'
                ? 'bg-white text-amber-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pendientes ({students.filter((s) => s.tuitionStatus === 'Pendiente').length})
          </button>
          <button
            onClick={() => setFilterStatus('Pagado')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'Pagado'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Pagados ({students.filter((s) => s.tuitionStatus === 'Pagado').length})
          </button>
          <button
            onClick={() => setFilterStatus('Vencido')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              filterStatus === 'Vencido'
                ? 'bg-white text-rose-700 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Vencidos ({students.filter((s) => s.tuitionStatus === 'Vencido').length})
          </button>
        </div>
      </div>

      {/* Students Tuition List */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No se encontraron alumnos con los criterios seleccionados.</p>
            <p className="text-[11px] text-slate-400 mt-1">Prueba cambiando el término de búsqueda o el filtro de estado.</p>
          </div>
        ) : (
          filteredStudents.map((std) => (
            <div
              key={std.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs hover:border-pink-200 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left: Student Identity */}
              <div className="flex items-center gap-3.5">
                <img
                  src={std.photo}
                  alt={std.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-2xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-sm">{std.name}</h3>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {std.classroom}
                    </span>
                    {std.hasScholarship && (
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <BadgePercent className="w-3 h-3" /> Beca {std.scholarshipPercent}%
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tutor: <span className="text-slate-700 font-medium">{std.father || std.mother}</span> • Pase QR: <span className="font-mono text-[10px] bg-pink-50 text-pink-700 px-1.5 py-0.5 rounded font-semibold">{std.parentQrKey || 'Activo'}</span>
                  </p>
                </div>
              </div>

              {/* Middle: Due Date & Amount */}
              <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                {/* Date */}
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-pink-500" /> Fecha de Pago
                  </span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                    {std.paymentDate}
                  </span>
                  <span
                    className={`inline-block mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      std.tuitionStatus === 'Pagado'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : std.tuitionStatus === 'Vencido'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {std.tuitionStatus === 'Pagado' ? 'PAGADO' : std.tuitionStatus === 'Vencido' ? 'VENCIDO' : 'PENDIENTE'}
                  </span>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Monto a Pagar
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    ${std.tuitionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-slate-400 block">MXN / mes</span>
                </div>

                {/* Pay Button */}
                <div className="shrink-0">
                  <button
                    onClick={() => handleOpenPayment(std)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                      std.tuitionStatus === 'Pagado'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-pink-500 hover:bg-pink-600 text-white shadow-pink-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    {std.tuitionStatus === 'Pagado' ? 'Ver / Pagar' : 'Pagar Colegiatura'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Payment Modal with Transfer and Card Options */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        student={selectedStudentForPayment}
        settings={settings}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedStudentForPayment(null);
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
