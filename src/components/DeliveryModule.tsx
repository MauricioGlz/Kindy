import { useState, useEffect } from 'react';
import {
  QrCode,
  Camera,
  ScanLine,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  History,
  ShieldCheck,
  CreditCard,
  Calendar,
  KeyRound,
  Users,
  Check,
  Sparkles,
  BookOpen,
  Smile,
  Meh,
  Frown,
  Angry,
  UserCheck,
  CheckSquare,
} from 'lucide-react';
import { Student, AttendanceLog, InstitutionSettings, ActivityLog, MoodType } from '../types.ts';
import PaymentModal from './PaymentModal.tsx';
import QrScannerModal from './QrScannerModal.tsx';
import {
  createParentQrPayload,
  createTrustedContactQrPayload,
} from '../utils/qrSecurity.ts';
import { useDebugMode } from '../context/DebugContext.tsx';

interface DeliveryModuleProps {
  students: Student[];
  attendanceLogs: AttendanceLog[];
  activityLogs?: ActivityLog[];
  settings?: InstitutionSettings;
  onRecordAction: (
    student: Student,
    actionType: 'recepcion' | 'entrega',
    timeStr: string,
    dateStr: string,
    authorizedPerson?: string,
    qrKey?: string
  ) => void;
  onPayTuition?: (
    studentId: number,
    method: 'transferencia' | 'tarjeta',
    amount: number
  ) => Promise<void> | void;
  onToggleAcknowledgeActivityLog?: (
    studentId: number,
    date: string,
    acknowledgedBy: string
  ) => Promise<void> | void;
}

interface ActiveQrSession {
  student: Student;
  authorizedPerson: string;
  qrKey: string;
  roleDescription: string;
  verificationMethod: 'camera' | 'file' | 'code' | 'demo';
}

export default function DeliveryModule({
  students,
  attendanceLogs,
  activityLogs,
  settings,
  onRecordAction,
  onPayTuition,
  onToggleAcknowledgeActivityLog,
}: DeliveryModuleProps) {
  const { isDebugMode } = useDebugMode();
  // Live clock
  const [liveTime, setLiveTime] = useState<string>('');

  // Scanner Modal state
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [activeSession, setActiveSession] = useState<ActiveQrSession | null>(null);

  // Manual key input state
  const [manualKeyBuffer, setManualKeyBuffer] = useState<string>('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Action Confirmation Modal
  const [selectedChildForAction, setSelectedChildForAction] = useState<Student | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // History & Tuition Modals
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [selectedChildForPayment, setSelectedChildForPayment] = useState<Student | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  const todayDateStr = new Date().toISOString().split('T')[0];

  // Daily activity log for the student in the active session (if any)
  const currentStudentDailyReport = activeSession?.student
    ? activityLogs?.find(
        (l) => l.studentId === activeSession.student.id && l.date === todayDateStr
      ) || null
    : null;

  const getMoodInfo = (m?: MoodType) => {
    switch (m) {
      case 'feliz':
        return {
          label: 'Feliz',
          icon: Smile,
          color: 'text-emerald-700',
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          desc: 'Alegre, sociable y participativo',
        };
      case 'neutral':
        return {
          label: 'Neutral',
          icon: Meh,
          color: 'text-sky-700',
          bg: 'bg-sky-50 border-sky-300 text-sky-800',
          badge: 'bg-sky-100 text-sky-900 border-sky-300',
          desc: 'Tranquilo, sereno y adaptable',
        };
      case 'lloroso':
        return {
          label: 'Lloroso',
          icon: Frown,
          color: 'text-blue-700',
          bg: 'bg-blue-50 border-blue-300 text-blue-800',
          badge: 'bg-blue-100 text-blue-900 border-blue-300',
          desc: 'Sensible o nostálgico con llanto',
        };
      case 'molesto':
        return {
          label: 'Molesto',
          icon: Angry,
          color: 'text-rose-700',
          bg: 'bg-rose-50 border-rose-300 text-rose-800',
          badge: 'bg-rose-100 text-rose-900 border-rose-300',
          desc: 'Irritable, inquieto o con berrinche',
        };
      default:
        return {
          label: 'Feliz',
          icon: Smile,
          color: 'text-emerald-700',
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
          badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          desc: 'Alegre y participativo',
        };
    }
  };

  const handleAcknowledgeInDelivery = async () => {
    if (!activeSession || !onToggleAcknowledgeActivityLog) return;
    const signer =
      activeSession.authorizedPerson ||
      activeSession.student.mother ||
      activeSession.student.father ||
      'Tutor Autorizado';
    await onToggleAcknowledgeActivityLog(activeSession.student.id, todayDateStr, signer);
    setActionSuccessMessage(`¡Reporte diario firmado como enterado por ${signer}!`);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4000);
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('es-MX', { hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handler when a QR code payload is scanned (from camera, file or demo)
  const handleQrVerified = (verifiedStudent: Student, personName: string, qrKey: string) => {
    setIsScannerOpen(false);
    setManualError(null);

    // Determine role description
    let role = 'Tutor Autorizado';
    if (personName.includes(verifiedStudent.father) || personName.includes(verifiedStudent.mother)) {
      role = 'Padre / Madre de Familia';
    } else {
      const famItem = verifiedStudent.trustedFamilyList?.find((f) => f.qrKey === qrKey);
      if (famItem) {
        role = `${famItem.relation} Autorizado(a)`;
      } else {
        role = 'Familiar de Confianza';
      }
    }

    setActiveSession({
      student: verifiedStudent,
      authorizedPerson: personName,
      qrKey,
      roleDescription: role,
      verificationMethod: 'camera',
    });
  };

  // Manual key verification (for barcode gun or manual typing)
  const handleManualKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const key = manualKeyBuffer.trim();
    if (!key) return;

    // Search by parentQrKey or by trusted family qrKey
    for (const std of students) {
      if (std.parentQrKey && std.parentQrKey.toLowerCase() === key.toLowerCase()) {
        const parents = `${std.father} / ${std.mother}`;
        handleQrVerified(std, parents, std.parentQrKey);
        setManualKeyBuffer('');
        return;
      }
      if (std.trustedFamilyList) {
        const foundFam = std.trustedFamilyList.find(
          (f) => f.qrKey.toLowerCase() === key.toLowerCase()
        );
        if (foundFam) {
          handleQrVerified(std, `${foundFam.name} (${foundFam.relation})`, foundFam.qrKey);
          setManualKeyBuffer('');
          return;
        }
      }
      // Also fallback search in legacy securityPin
      if (std.securityPin === key) {
        handleQrVerified(std, `${std.father} / ${std.mother}`, std.parentQrKey || key);
        setManualKeyBuffer('');
        return;
      }
    }

    setManualError('Llave criptográfica no encontrada. Verifica la clave o escanea el QR con la cámara.');
  };

  const handleSimulateQuickPass = (student: Student, type: 'parent' | 'family') => {
    if (type === 'parent') {
      const parentPayload = createParentQrPayload(student);
      handleQrVerified(student, `${student.father} / ${student.mother}`, parentPayload.qrKey);
    } else {
      const famItem = student.trustedFamilyList?.[0] || {
        name: student.trustedContacts?.[0] || 'Familiar de Confianza',
        relation: 'Familiar',
        qrKey: `KND-FAM-${student.id}-TEST`,
      };
      const famPayload = createTrustedContactQrPayload(student, famItem);
      handleQrVerified(student, `${famItem.name} (${famItem.relation})`, famPayload.qrKey);
    }
  };

  const resetSession = () => {
    setActiveSession(null);
    setManualKeyBuffer('');
    setManualError(null);
    setSelectedChildForAction(null);
    setShowConfirmModal(false);
  };

  const handleOpenActionModal = (child: Student) => {
    setSelectedChildForAction(child);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = () => {
    if (!selectedChildForAction || !activeSession) return;

    const actionType: 'recepcion' | 'entrega' = selectedChildForAction.delivered
      ? 'entrega'
      : 'recepcion';
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toISOString().split('T')[0];

    onRecordAction(
      selectedChildForAction,
      actionType,
      timeStr,
      dateStr,
      activeSession.authorizedPerson,
      activeSession.qrKey
    );

    const verb = actionType === 'recepcion' ? 'Recepción (Entrada al Plantel)' : 'Entrega (Salida a Tutor)';
    setActionSuccessMessage(
      `¡${verb} confirmada para ${selectedChildForAction.name} con validación de QR exitosa!`
    );

    // Update session student state locally as well
    setActiveSession((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        student: {
          ...prev.student,
          delivered: actionType === 'recepcion',
          lastActionTime: timeStr,
        },
      };
    });

    setShowConfirmModal(false);
    setSelectedChildForAction(null);

    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4500);
  };

  return (
    <div id="view-module-entregas" className="w-full max-w-4xl space-y-4">
      {/* Toast notification */}
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-2xl flex items-center gap-2.5 text-xs font-semibold shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {!activeSession ? (
        /* STEP 1: SCAN QR CODE STATION */
        <div className="space-y-4">
          <div
            id="entregas-step-qr"
            className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-md text-center space-y-6"
          >
            {/* Header Icon */}
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-pink-200">
                <QrCode className="w-10 h-10" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Estación de Recepción y Entrega por QR
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Escanea el Código QR único de los Padres o Familiares de Confianza autorizados.
                Cada QR contiene una llave criptográfica intransferible para máxima seguridad.
              </p>
            </div>

            {/* Main Action: Open Camera Scanner */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-open-qr-scanner"
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-4 px-6 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                <div className="p-1.5 bg-white/20 rounded-xl group-hover:scale-110 transition">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span>Escanear Código QR con la Cámara</span>
                <ScanLine className="w-4 h-4 opacity-80" />
              </button>
            </div>

            {/* Quick Demo Passes Access for Testing (ONLY IN DEBUG MODE) */}
            {isDebugMode && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-pink-500" /> Accesos Rápidos de Prueba (Modo Depuración):
                  </span>
                  <span className="text-[10px] text-slate-400">Clic para simular escaneo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {students.slice(0, 4).map((std) => (
                    <div
                      key={std.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs hover:border-pink-300 transition"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {std.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {std.classroom} • {std.delivered ? 'En Plantel' : 'Fuera'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSimulateQuickPass(std, 'parent')}
                          className="px-2 py-1 bg-pink-100 hover:bg-pink-200 text-pink-900 text-[10px] font-bold rounded-lg transition cursor-pointer"
                          title="Simular QR Padres"
                        >
                          QR Padres
                        </button>
                        {std.trustedFamilyList && std.trustedFamilyList.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSimulateQuickPass(std, 'family')}
                            className="px-2 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 text-[10px] font-bold rounded-lg transition cursor-pointer"
                            title="Simular QR Familiar"
                          >
                            QR Familiar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Key / Barcode Scanner Fallback */}
            <form onSubmit={handleManualKeySubmit} className="pt-2 border-t border-slate-100 text-left space-y-2">
              <label className="block text-[11px] font-semibold text-slate-600">
                O ingresa la llave criptográfica / lector de código de barras manual:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={manualKeyBuffer}
                    onChange={(e) => {
                      setManualKeyBuffer(e.target.value);
                      setManualError(null);
                    }}
                    placeholder="Ej. KND-PAR-SOTO-... o PIN de 6 dígitos"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Validar
                </button>
              </div>
              {manualError && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {manualError}
                </p>
              )}
            </form>
          </div>

          {/* Recent Attendance Logs Button (ONLY IN DEBUG MODE) */}
          {isDebugMode && (
            <div className="text-center animate-fadeIn">
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition cursor-pointer py-1 px-3 rounded-xl hover:bg-white border border-transparent hover:border-slate-200"
              >
                <History className="w-3.5 h-3.5 text-pink-500" /> Ver bitácora reciente de entradas y salidas (SQL)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* STEP 2: VERIFIED QR SESSION (CHILD CARD + TUITION INTEGRATION) */
        <div id="entregas-step-verified" className="space-y-4 animate-fadeIn">
          {/* Top Session Banner */}
          <div className="flex flex-wrap items-center justify-between bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                onClick={resetSession}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition cursor-pointer"
                title="Escanear otro código QR / Cerrar sesión"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {activeSession.authorizedPerson}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> QR Verificado
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Rol: <strong className="text-slate-700">{activeSession.roleDescription}</strong> • Llave:{' '}
                  <span className="font-mono text-[10px] text-slate-600">{activeSession.qrKey}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-[#E0F2FE]/80 px-4 py-2 rounded-2xl border border-blue-200 text-right">
                <span className="text-[10px] text-sky-800 font-semibold uppercase block tracking-wider flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" /> Hora Oficial
                </span>
                <span className="text-lg font-bold text-sky-950 font-mono">{liveTime}</span>
              </div>
              <button
                onClick={resetSession}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Escanear Siguiente
              </button>
            </div>
          </div>

          {/* Child Card with Direct Colegiatura Integration & Daily Report */}
          <div className={(settings?.enabledModules?.libreta !== false && activeSession.student.delivered) ? 'max-w-5xl mx-auto' : 'max-w-md mx-auto'}>
            {(settings?.enabledModules?.libreta !== false && activeSession.student.delivered) ? (
              /* HORIZONTAL SPLIT VIEW (DELIVERY / SALIDA) */
              <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-fadeIn">
                {/* Left Column: Student Identity, Status, Colegiatura & Action (4 cols on lg) */}
                <div className="lg:col-span-4 flex flex-col justify-between space-y-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-5 lg:pb-0 lg:pr-5">
                  <div className="space-y-3 text-center">
                    <div className="w-full flex justify-between items-center text-[10px] font-bold">
                      {settings?.enabledModules?.aulas !== false ? (
                        <span className="text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {activeSession.student.classroom}
                        </span>
                      ) : <span />}
                      <span className="px-3 py-1 rounded-full font-bold text-[10px] tracking-wider uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                        EN PLANTEL
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <img
                        src={activeSession.student.photo}
                        alt={activeSession.student.name}
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-emerald-300 shadow-xs my-1"
                      />
                      <h3 className="font-bold text-slate-800 text-base">{activeSession.student.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ingreso registrado: {activeSession.student.lastActionTime || 'Hoy'}
                      </p>
                      <div className="mt-2 text-xs bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-slate-600 inline-flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Retira: <strong>{activeSession.authorizedPerson}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* RECUADRO DE COLEGIATURA CONECTADO DIRECTAMENTE (SI HABILITADO) */}
                    {settings?.enabledModules?.contabilidad !== false && (
                      <div className="w-full bg-[#FAF7F5] rounded-2xl p-3 border border-slate-200/90 text-left space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-bold uppercase flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-pink-500" /> Colegiatura:
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                              activeSession.student.tuitionStatus === 'Pagado'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : activeSession.student.tuitionStatus === 'Vencido'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {activeSession.student.tuitionStatus === 'Pagado'
                              ? 'Al corriente'
                              : activeSession.student.tuitionStatus === 'Vencido'
                              ? 'Vencido'
                              : 'Pendiente'}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              {activeSession.student.paymentDate}
                            </span>
                            <span className="text-[10px] text-slate-400">Vencimiento</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-mono font-black text-slate-900 block">
                              ${activeSession.student.tuitionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400">MXN</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          id={`btn-pay-delivery-child-${activeSession.student.id}`}
                          onClick={() => {
                            setSelectedChildForPayment(activeSession.student);
                            setShowPaymentModal(true);
                          }}
                          className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                            activeSession.student.tuitionStatus === 'Pagado'
                              ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          {activeSession.student.tuitionStatus === 'Pagado'
                            ? 'Ver / Adelantar Pago'
                            : 'Pagar Colegiatura Ahora'}
                        </button>
                      </div>
                    )}

                    {/* BOTÓN CONFIRMAR ENTREGA */}
                    <button
                      id={`btn-action-child-${activeSession.student.id}`}
                      onClick={() => handleOpenActionModal(activeSession.student)}
                      className="w-full py-3 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 text-white shadow-pink-200"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Confirmar Salida / Entrega a {activeSession.authorizedPerson.split(' ')[0]}</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Daily Report Horizontal Layout (8 cols on lg) */}
                <div
                  id={`daily-report-delivery-${activeSession.student.id}`}
                  className="lg:col-span-8 flex flex-col justify-between space-y-4 bg-gradient-to-b from-amber-50/60 via-white to-amber-50/30 rounded-2xl p-4 sm:p-5 border border-amber-200/90 text-left shadow-2xs"
                >
                  {/* Top Bar of Report */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          Libreta y Reporte Diario de Actividades
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Jornada escolar de hoy ({todayDateStr}) • Aula {activeSession.student.classroom}
                        </span>
                      </div>
                    </div>

                    <div>
                      {currentStudentDailyReport ? (
                        currentStudentDailyReport.parentAcknowledged ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Enterado Confirmado</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pendiente de Firma</span>
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Sin registro previo</span>
                      )}
                    </div>
                  </div>

                  {currentStudentDailyReport ? (
                    <div className="space-y-4 flex-1">
                      {/* Top horizontal row: Estado de Ánimo (half) + Resumen de rutinas (half) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Estado de Ánimo */}
                        {(() => {
                          const moodInfo = getMoodInfo(currentStudentDailyReport.mood);
                          const MoodIcon = moodInfo.icon;
                          return (
                            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${moodInfo.bg}`}>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-2xs shrink-0">
                                  <MoodIcon className={`w-6 h-6 ${moodInfo.color}`} />
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                    Estado de Ánimo
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 capitalize block">
                                    {moodInfo.label}
                                  </span>
                                  <span className="text-[10px] opacity-80 block line-clamp-1">
                                    {moodInfo.desc}
                                  </span>
                                </div>
                              </div>
                              <span className="text-2xl shrink-0 pr-1">
                                {currentStudentDailyReport.mood === 'feliz' && '😊'}
                                {currentStudentDailyReport.mood === 'neutral' && '😐'}
                                {currentStudentDailyReport.mood === 'lloroso' && '😢'}
                                {currentStudentDailyReport.mood === 'molesto' && '😠'}
                              </span>
                            </div>
                          );
                        })()}

                        {/* Cumplimiento de Rutinas */}
                        <div className="p-3 rounded-2xl border border-slate-200/90 bg-white flex items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                              <CheckSquare className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                                Rutinas Completadas
                              </span>
                              <span className="text-xs font-bold text-slate-800">
                                {currentStudentDailyReport.completedActivities?.length || 0} actividades
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                Registradas durante la jornada
                              </span>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0">
                            {currentStudentDailyReport.completedActivities?.length || 0} ✓
                          </span>
                        </div>
                      </div>

                      {/* Middle horizontal grid: Rutinas Realizadas en 2 columnas */}
                      {currentStudentDailyReport.completedActivities &&
                        currentStudentDailyReport.completedActivities.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Detalle de Rutinas Realizadas:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {currentStudentDailyReport.completedActivities.map((act, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-medium shadow-2xs"
                                >
                                  <div className="w-4 h-4 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                  <span className="truncate" title={act}>{act}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Observaciones de la Educadora */}
                      {currentStudentDailyReport.notes && (
                        <div className="space-y-1.5 bg-white p-3 rounded-2xl border border-slate-200/90 text-xs shadow-2xs">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Observaciones del Comportamiento:
                          </span>
                          <p className="text-slate-700 italic leading-relaxed text-xs pl-2 border-l-2 border-purple-300">
                            &quot;{currentStudentDailyReport.notes}&quot;
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400 text-xs space-y-2 flex-1 flex flex-col justify-center">
                      <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-600">Bitácora escolar en proceso</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        La educadora del aula {activeSession.student.classroom} aún está actualizando las actividades de hoy.
                      </p>
                    </div>
                  )}

                  {/* Bottom Bar: Firma / Acuse de Enterado */}
                  {currentStudentDailyReport && (
                    <div className="pt-2 border-t border-amber-200/60">
                      {currentStudentDailyReport.parentAcknowledged ? (
                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div className="leading-tight">
                              <span className="font-bold text-emerald-950 block text-xs">
                                Reporte firmado y enterado por tutor
                              </span>
                              <span className="text-[11px] text-emerald-700">
                                Confirmado por: <strong>{currentStudentDailyReport.acknowledgedBy || activeSession.authorizedPerson}</strong>{' '}
                                {currentStudentDailyReport.acknowledgedAt && `(${currentStudentDailyReport.acknowledgedAt})`}
                              </span>
                            </div>
                          </div>

                          {onToggleAcknowledgeActivityLog && (
                            <button
                              type="button"
                              onClick={handleAcknowledgeInDelivery}
                              className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer font-medium"
                            >
                              Cambiar a pendiente
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="font-bold text-amber-950 block text-xs">
                                Firma de enterado pendiente
                              </span>
                              <span className="text-[11px] text-amber-800">
                                Confirma de enterado al entregar al menor a <strong>{activeSession.authorizedPerson}</strong>
                              </span>
                            </div>
                          </div>

                          {onToggleAcknowledgeActivityLog && (
                            <button
                              type="button"
                              id={`btn-ack-delivery-${activeSession.student.id}`}
                              onClick={handleAcknowledgeInDelivery}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>Firmar como Enterado</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* COMPACT VIEW (ENTRADA / O SALIDA SIN REPORTE DIARIO) */
              <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center text-center justify-between gap-4">
                <div className="w-full flex justify-between items-center text-[10px] font-bold">
                  {settings?.enabledModules?.aulas !== false ? (
                    <span className="text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {activeSession.student.classroom}
                    </span>
                  ) : <span />}
                  <span
                    className={`px-3 py-1 rounded-full font-bold text-[10px] tracking-wider uppercase ${
                      activeSession.student.delivered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-pink-100 text-pink-700 border border-pink-200'
                    }`}
                  >
                    {activeSession.student.delivered ? 'EN PLANTEL' : 'FUERA DEL PLANTEL'}
                  </span>
                </div>

                <img
                  src={activeSession.student.photo}
                  alt={activeSession.student.name}
                  className={`w-28 h-28 rounded-2xl object-cover border-4 shadow-sm my-1 ${
                    activeSession.student.delivered ? 'border-emerald-300' : 'border-pink-200'
                  }`}
                />

                <div>
                  <h3 className="font-bold text-slate-800 text-base">{activeSession.student.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeSession.student.delivered
                      ? `Ingreso registrado: ${activeSession.student.lastActionTime || 'Hoy'}`
                      : activeSession.student.lastActionTime
                      ? `Última salida: ${activeSession.student.lastActionTime}`
                      : 'Listo para confirmar recepción en plantel'}
                  </p>
                  {activeSession.student.delivered && (
                    <div className="mt-2 text-xs bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-slate-600 inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Retira: <strong>{activeSession.authorizedPerson}</strong></span>
                    </div>
                  )}
                </div>

                {/* RECUADRO DE COLEGIATURA CONECTADO DIRECTAMENTE (SI HABILITADO) */}
                {settings?.enabledModules?.contabilidad !== false && (
                  <div className="w-full bg-[#FAF7F5] rounded-2xl p-3.5 border border-slate-200/90 text-left space-y-2.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-500 font-bold uppercase flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-pink-500" /> Próximo Pago de Colegiatura:
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] ${
                          activeSession.student.tuitionStatus === 'Pagado'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : activeSession.student.tuitionStatus === 'Vencido'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {activeSession.student.tuitionStatus === 'Pagado'
                          ? 'Al corriente'
                          : activeSession.student.tuitionStatus === 'Vencido'
                          ? 'Vencido'
                          : 'Pendiente'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">
                          {activeSession.student.paymentDate}
                        </span>
                        <span className="text-[10px] text-slate-400">Fecha de vencimiento</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono font-black text-slate-900 block">
                          ${activeSession.student.tuitionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400">MXN</span>
                      </div>
                    </div>

                    {/* BOTÓN PARA PAGAR: MISMA INTERFAZ DE OPCIONES DE PAGO */}
                    <button
                      type="button"
                      id={`btn-pay-delivery-child-${activeSession.student.id}`}
                      onClick={() => {
                        setSelectedChildForPayment(activeSession.student);
                        setShowPaymentModal(true);
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                        activeSession.student.tuitionStatus === 'Pagado'
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      {activeSession.student.tuitionStatus === 'Pagado'
                        ? 'Ver / Adelantar Pago'
                        : 'Pagar Colegiatura Ahora'}
                    </button>
                  </div>
                )}

                {/* BOTÓN CONFIRMAR ENTRADA O SALIDA */}
                <button
                  id={`btn-action-child-${activeSession.student.id}`}
                  onClick={() => handleOpenActionModal(activeSession.student)}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition shadow-2xs cursor-pointer flex items-center justify-center gap-2 ${
                    activeSession.student.delivered
                      ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-pink-200'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>
                    {activeSession.student.delivered
                      ? `Confirmar Salida / Entrega a ${activeSession.authorizedPerson.split(' ')[0]}`
                      : 'Confirmar Entrada / Recepción en Plantel'}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={resetSession}
              className="text-xs text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              Terminar y volver a la estación de escaneo QR
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM ACTION (RECEPCIÓN O ENTREGA) */}
      {showConfirmModal && selectedChildForAction && activeSession && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center animate-scaleIn">
            <img
              src={selectedChildForAction.photo}
              alt={selectedChildForAction.name}
              className="w-24 h-24 rounded-2xl object-cover shadow-sm border-4 border-pink-200 mx-auto mb-3"
            />
            <h3 className="text-lg font-bold text-slate-800">{selectedChildForAction.name}</h3>
            
            <div className="mt-2 space-y-1">
              <span
                className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full ${
                  selectedChildForAction.delivered
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {selectedChildForAction.delivered ? 'Estado actual: En Plantel' : 'Estado actual: Fuera del Plantel'}
              </span>

              <p className="text-xs text-slate-600 font-medium">
                Tutor Acreditado: <strong className="text-slate-800">{activeSession.authorizedPerson}</strong>
              </p>
            </div>

            {/* Current Real Time Box */}
            <div className="my-3 bg-[#FEF9C3]/80 border border-amber-200/80 rounded-2xl p-3 w-full text-center">
              <span className="text-[10px] text-amber-800 font-semibold uppercase block">
                Hora Oficial del Registro
              </span>
              <span className="text-xl font-bold text-slate-800 font-mono">{liveTime}</span>
            </div>

            {/* Daily report notice only for Entrega (when child is already inside), never during recepción */}
            {selectedChildForAction.delivered && currentStudentDailyReport && (
              <div className="my-3 p-2.5 bg-amber-50/90 border border-amber-200 rounded-xl text-left text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900 flex items-center gap-1 text-[11px]">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700" /> Reporte diario escolar:
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentStudentDailyReport.parentAcknowledged
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {currentStudentDailyReport.parentAcknowledged ? 'Enterado ✓' : 'Firma pendiente'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Ánimo: <strong className="capitalize">{currentStudentDailyReport.mood}</strong> •{' '}
                  {currentStudentDailyReport.completedActivities.length} actividades cumplidas
                </p>
              </div>
            )}

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              {selectedChildForAction.delivered
                ? `¿Confirmas la ENTREGA del menor a ${activeSession.authorizedPerson}? Se guardará el registro con su firma QR.`
                : '¿Confirmas la RECEPCIÓN del alumno en el plantel? Se guardará el registro con la firma QR.'}
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

      {/* SCANNER CAMERA & FILE MODAL */}
      <QrScannerModal
        isOpen={isScannerOpen}
        students={students}
        onClose={() => setIsScannerOpen(false)}
        onVerified={handleQrVerified}
      />

      {/* RECENT ATTENDANCE LOGS MODAL (SQL Table inspection - ONLY IN DEBUG MODE) */}
      {isDebugMode && showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-pink-500" /> Bitácora de Asistencias y QR (SQL)
                </h3>
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
                  <div key={log.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-800 block">{log.studentName}</span>
                      <span className="text-[10px] text-slate-500 block">
                        Acreditado: <strong className="text-slate-700">{log.authorizedPerson || 'Tutor'}</strong>
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono block truncate max-w-[200px]">
                        Llave QR: {log.qrKey || log.tutorPin || 'N/A'} • {log.date}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
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

      {/* PAYMENT MODAL (DIRECT TUITION PAYMENT) */}
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
            // Update student status inside session as well
            if (activeSession && activeSession.student.id === studentId) {
              setActiveSession({
                ...activeSession,
                student: {
                  ...activeSession.student,
                  tuitionStatus: 'Pagado',
                },
              });
            }
            setActionSuccessMessage(`¡Pago de colegiatura de $${amount.toLocaleString('es-MX')} MXN registrado exitosamente!`);
            setTimeout(() => setActionSuccessMessage(null), 4500);
          }}
        />
      )}
    </div>
  );
}
