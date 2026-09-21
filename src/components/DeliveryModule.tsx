import { useState, useEffect } from 'react';
import {
  KeyRound,
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  History,
  ShieldCheck,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { Student, AttendanceLog, InstitutionSettings } from '../types.ts';
import PaymentModal from './PaymentModal.tsx';

interface DeliveryModuleProps {
  students: Student[];
  attendanceLogs: AttendanceLog[];
  settings?: InstitutionSettings;
  onRecordAction: (
    student: Student,
    actionType: 'recepcion' | 'entrega',
    timeStr: string,
    dateStr: string
  ) => void;
  onPayTuition?: (
    studentId: number,
    method: 'transferencia' | 'tarjeta',
    amount: number
  ) => Promise<void> | void;
}

export default function DeliveryModule({
  students,
  attendanceLogs,
  settings,
  onRecordAction,
  onPayTuition,
}: DeliveryModuleProps) {
  const [pinBuffer, setPinBuffer] = useState<string>('');
  const [activePin, setActivePin] = useState<string | null>(null);
  const [liveTime, setLiveTime] = useState<string>('');
  const [selectedChildForAction, setSelectedChildForAction] = useState<Student | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedChildForPayment, setSelectedChildForPayment] = useState<Student | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('es-MX', { hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Physical keyboard support for PIN
  useEffect(() => {
    if (activePin) return; // already in children view

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pinBuffer.length < 6) {
          setPinBuffer((prev) => prev + e.key);
        }
      } else if (e.key === 'Backspace') {
        setPinBuffer((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        if (pinBuffer.length === 6) {
          submitPin(pinBuffer);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinBuffer, activePin]);

  useEffect(() => {
    if (pinBuffer.length === 6 && !activePin) {
      const timer = setTimeout(() => {
        submitPin(pinBuffer);
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [pinBuffer, activePin]);

  const handleDigit = (digit: string) => {
    if (pinBuffer.length < 6) {
      setPinBuffer((prev) => prev + digit);
    }
  };

  const clearPin = () => {
    setPinBuffer('');
  };

  const submitPin = (pinToTest: string) => {
    const matched = students.filter((s) => s.securityPin === pinToTest);
    if (matched.length === 0) {
      alert('PIN de 6 dígitos no registrado. Prueba con 123456 (Familia Soto) o 654321 (Familia Castillo).');
      setPinBuffer('');
      return;
    }
    setActivePin(pinToTest);
  };

  const resetSession = () => {
    setActivePin(null);
    setPinBuffer('');
    setSelectedChildForAction(null);
    setShowConfirmModal(false);
  };

  const matchedStudents = activePin
    ? students.filter((s) => s.securityPin === activePin)
    : [];

  const familyName = matchedStudents.length > 0
    ? matchedStudents[0].father.split(' ').slice(1).join(' ') || 'Familia'
    : 'Tutor';

  const handleOpenActionModal = (child: Student) => {
    setSelectedChildForAction(child);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = () => {
    if (!selectedChildForAction) return;

    const actionType: 'recepcion' | 'entrega' = selectedChildForAction.delivered ? 'entrega' : 'recepcion';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    onRecordAction(selectedChildForAction, actionType, timeStr, dateStr);

    const verb = actionType === 'recepcion' ? 'Recepción (Entrada)' : 'Entrega (Salida)';
    setActionSuccessMessage(`¡${verb} confirmada para ${selectedChildForAction.name} a las ${timeStr}!`);

    setShowConfirmModal(false);
    setSelectedChildForAction(null);

    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  return (
    <div id="view-module-entregas" className="w-full max-w-4xl space-y-4">
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {!activePin ? (
        /* STEP 1: PIN ENTRY FOR PARENTS */
        <div className="space-y-4">
          <div
            id="entregas-step-pin"
            className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-md text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#FCE7F3] mx-auto flex items-center justify-center text-pink-500 mb-3 shadow-2xs">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">Acceso de Padres / Tutor</h2>
            <p className="text-xs text-slate-400 mb-5">
              Ingresa tu PIN de 6 dígitos para gestionar la entrega o recepción de tu hijo(a)
            </p>

            {/* PIN Dots */}
            <div className="flex justify-center gap-2 mb-5">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const filled = idx < pinBuffer.length;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      filled
                        ? 'bg-pink-400 border-pink-400 scale-110 shadow-2xs'
                        : 'bg-transparent border-pink-300'
                    }`}
                  />
                );
              })}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto mb-4">
              {['1', '2', '3'].map((n) => (
                <button
                  key={n}
                  onClick={() => handleDigit(n)}
                  className="h-11 rounded-xl bg-[#E0F2FE]/70 hover:bg-[#E0F2FE] font-bold text-slate-700 transition cursor-pointer active:scale-95 shadow-2xs"
                >
                  {n}
                </button>
              ))}
              {['4', '5', '6'].map((n) => (
                <button
                  key={n}
                  onClick={() => handleDigit(n)}
                  className="h-11 rounded-xl bg-[#FCE7F3]/70 hover:bg-[#FCE7F3] font-bold text-slate-700 transition cursor-pointer active:scale-95 shadow-2xs"
                >
                  {n}
                </button>
              ))}
              {['7', '8', '9'].map((n) => (
                <button
                  key={n}
                  onClick={() => handleDigit(n)}
                  className="h-11 rounded-xl bg-[#DCFCE7]/70 hover:bg-[#DCFCE7] font-bold text-slate-700 transition cursor-pointer active:scale-95 shadow-2xs"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={clearPin}
                className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-500 transition cursor-pointer"
              >
                BORRAR
              </button>
              <button
                onClick={() => handleDigit('0')}
                className="h-11 rounded-xl bg-[#E0F2FE]/70 hover:bg-[#E0F2FE] font-bold text-slate-700 transition cursor-pointer active:scale-95 shadow-2xs"
              >
                0
              </button>
              <button
                onClick={() => submitPin(pinBuffer)}
                disabled={pinBuffer.length < 6}
                className="h-11 rounded-xl bg-emerald-400 hover:bg-emerald-500 disabled:opacity-40 text-white flex items-center justify-center shadow-xs transition cursor-pointer active:scale-95"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Demo PIN quick selector */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Accesos directos con PINs de prueba:
              </span>
              <div className="flex flex-wrap justify-center gap-1.5 text-[11px]">
                <button
                  onClick={() => {
                    setPinBuffer('123456');
                    submitPin('123456');
                  }}
                  className="px-2.5 py-1 bg-[#FCE7F3] hover:bg-pink-200 text-pink-900 rounded-lg font-medium transition cursor-pointer"
                >
                  Familia Soto (123456)
                </button>
                <button
                  onClick={() => {
                    setPinBuffer('654321');
                    submitPin('654321');
                  }}
                  className="px-2.5 py-1 bg-[#E0F2FE] hover:bg-sky-200 text-sky-900 rounded-lg font-medium transition cursor-pointer"
                >
                  Familia Castillo (654321)
                </button>
                <button
                  onClick={() => {
                    setPinBuffer('112233');
                    submitPin('112233');
                  }}
                  className="px-2.5 py-1 bg-[#DCFCE7] hover:bg-emerald-200 text-emerald-900 rounded-lg font-medium transition cursor-pointer"
                >
                  Familia Herrera (112233)
                </button>
              </div>
            </div>
          </div>

          {/* Recent Attendance Logs Button */}
          <div className="text-center">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <History className="w-3.5 h-3.5" /> Ver bitácora reciente de entradas y salidas (SQL)
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: CHILDREN OF THE LOGGED TUTOR */
        <div id="entregas-step-children" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={resetSession}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition cursor-pointer"
                title="Cambiar de familia / Cerrar sesión de tutor"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Familia {familyName} • Alumnos Registrados
                </h2>
                <p className="text-xs text-slate-500">
                  Selecciona al alumno para confirmar entrega o recepción
                </p>
              </div>
            </div>

            <div className="bg-[#E0F2FE]/80 px-4 py-2 rounded-2xl border border-blue-200 text-right">
              <span className="text-[10px] text-sky-800 font-semibold uppercase block tracking-wider flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" /> Hora Oficial
              </span>
              <span className="text-lg font-bold text-sky-950 font-mono">{liveTime}</span>
            </div>
          </div>

          {/* Children cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {matchedStudents.map((child) => (
              <div
                key={child.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center text-center justify-between gap-3"
              >
                <div className="w-full flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                    {child.classroom}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      child.delivered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-pink-100 text-pink-700 border border-pink-200'
                    }`}
                  >
                    {child.delivered ? 'EN PLANTEL' : 'FUERA DEL PLANTEL'}
                  </span>
                </div>

                <img
                  src={child.photo}
                  alt={child.name}
                  className={`w-24 h-24 rounded-2xl object-cover border-3 ${
                    child.delivered ? 'border-emerald-300' : 'border-pink-200'
                  } shadow-xs my-1`}
                />

                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{child.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {child.delivered
                      ? `Ingreso: ${child.lastActionTime || 'Hoy'}`
                      : child.lastActionTime
                      ? `Última salida: ${child.lastActionTime}`
                      : 'Pendiente de entrega/recepción'}
                  </p>
                </div>

                {/* Recuadro de Próximo Pago de Colegiatura */}
                <div className="w-full bg-[#FAF7F5] rounded-2xl p-3 border border-slate-200/90 text-left space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-bold uppercase flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-pink-500" /> Próximo Pago:
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        child.tuitionStatus === 'Pagado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : child.tuitionStatus === 'Vencido'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {child.tuitionStatus === 'Pagado' ? 'Al corriente' : child.tuitionStatus === 'Vencido' ? 'Vencido' : 'Pendiente'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-semibold text-slate-700">{child.paymentDate}</span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      ${child.tuitionAmount.toLocaleString('es-MX')} MXN
                    </span>
                  </div>

                  <button
                    type="button"
                    id={`btn-pay-delivery-child-${child.id}`}
                    onClick={() => {
                      setSelectedChildForPayment(child);
                      setShowPaymentModal(true);
                    }}
                    className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                      child.tuitionStatus === 'Pagado'
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-amber-500 hover:bg-amber-600 text-white'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    {child.tuitionStatus === 'Pagado' ? 'Ver / Adelantar Pago' : 'Pagar Colegiatura'}
                  </button>
                </div>

                <button
                  id={`btn-action-child-${child.id}`}
                  onClick={() => handleOpenActionModal(child)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer ${
                    child.delivered
                      ? 'bg-[#FCE7F3] hover:bg-pink-200 text-pink-900 border border-pink-300'
                      : 'bg-[#DCFCE7] hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {child.delivered ? 'Confirmar Salida / Entrega' : 'Confirmar Entrada / Recepción'}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={resetSession}
              className="text-xs text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              Terminar y volver al ingreso de PIN
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION ACTION MODAL */}
      {showConfirmModal && selectedChildForAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-scaleIn">
            <img
              src={selectedChildForAction.photo}
              alt={selectedChildForAction.name}
              className="w-24 h-24 rounded-2xl object-cover shadow-sm border-4 border-[#FCE7F3] mx-auto mb-3"
            />
            <h3 className="text-lg font-bold text-slate-800">{selectedChildForAction.name}</h3>
            <p
              className={`inline-block text-xs font-semibold mt-1 px-3 py-1 rounded-full ${
                selectedChildForAction.delivered
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {selectedChildForAction.delivered
                ? 'Estado actual: En Plantel'
                : 'Estado actual: Fuera del Plantel'}
            </p>

            {/* Current Real Time Box */}
            <div className="my-4 bg-[#FEF9C3]/70 border border-amber-200/80 rounded-2xl p-3 w-full text-center">
              <span className="text-[10px] text-amber-800 font-semibold uppercase block">
                Hora Oficial del Registro
              </span>
              <span className="text-xl font-bold text-slate-800 font-mono">{liveTime}</span>
            </div>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {selectedChildForAction.delivered
                ? '¿Confirmas la ENTREGA del alumno al tutor en este momento? El estado cambiará a "Fuera del Plantel".'
                : '¿Confirmas la RECEPCIÓN del alumno en el plantel? El estado cambiará a "En Plantel".'}
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-child-delivery"
                onClick={handleConfirmAction}
                className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                  selectedChildForAction.delivered
                    ? 'bg-pink-500 hover:bg-pink-600'
                    : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                {selectedChildForAction.delivered ? 'Confirmar Entrega' : 'Confirmar Recepción'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECENT ATTENDANCE LOGS MODAL (SQL Table inspection) */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Bitácora de Asistencias (SQL)</h3>
                <p className="text-xs text-slate-400">
                  Registros en tiempo real de la tabla <code className="text-pink-600 font-mono">attendance_logs</code>
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs my-3">
              {attendanceLogs.length === 0 ? (
                <p className="text-slate-400 text-center py-6">No hay registros de asistencias aún.</p>
              ) : (
                attendanceLogs.map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">{log.studentName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        PIN: {log.tutorPin} • Fecha: {log.date}
                      </span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.actionType === 'recepcion'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}
                      >
                        {log.actionType === 'recepcion' ? 'RECEPCIÓN' : 'ENTREGA'}
                      </span>
                      <span className="block text-[10px] font-mono text-slate-500 mt-0.5">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE OPCIONES DE PAGO DE COLEGIATURA CONECTADO DIRECTAMENTE */}
      {settings && (
        <PaymentModal
          isOpen={showPaymentModal}
          student={selectedChildForPayment}
          settings={settings}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedChildForPayment(null);
          }}
          onPaymentSuccess={async (studentId, method, amount) => {
            if (onPayTuition) {
              await onPayTuition(studentId, method, amount);
            }
            setActionSuccessMessage(`¡Pago de colegiatura de $${amount.toLocaleString('es-MX')} MXN registrado exitosamente!`);
            setTimeout(() => setActionSuccessMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
}
