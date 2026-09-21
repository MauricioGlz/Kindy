import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Receipt,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { Student, InstitutionSettings } from '../types.ts';

interface PaymentModalProps {
  isOpen: boolean;
  student: Student | null;
  settings: InstitutionSettings;
  onClose: () => void;
  onPaymentSuccess: (studentId: number, method: 'transferencia' | 'tarjeta', amount: number) => Promise<void> | void;
}

export default function PaymentModal({
  isOpen,
  student,
  settings,
  onClose,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<'transferencia' | 'tarjeta'>('transferencia');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Transfer state
  const [transferRef, setTransferRef] = useState<string>('');

  // Card form state
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [cardBrand, setCardBrand] = useState<'visa' | 'mastercard' | 'amex' | 'generic'>('generic');

  // Submission state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(false);
  const [receiptFolio, setReceiptFolio] = useState<string>('');
  const [completedMethod, setCompletedMethod] = useState<'transferencia' | 'tarjeta'>('transferencia');

  useEffect(() => {
    if (student) {
      // Pre-fill holder name with father or mother name
      setCardHolder(student.father || student.mother || '');
      setTransferRef(`COL-${student.id}-${new Date().getMonth() + 1}`);
      setPaymentCompleted(false);
      setIsProcessing(false);
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
    }
  }, [student]);

  if (!isOpen || !student) return null;

  // Bank Info from settings or fallback defaults
  const bankName = settings.bankName || 'BBVA México';
  const accountHolder = settings.accountHolder || settings.name || 'Kinder Creativo S.C.';
  const clabe = settings.clabe || '012 180 01548293019 4';
  const accountNumber = settings.accountNumber || '1548293019';
  const transferConcept = `Colegiatura ${student.name.split(' ')[0]} ${student.id}`;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text.replace(/\s+/g, ' '));
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    // detect brand
    if (raw.startsWith('4')) setCardBrand('visa');
    else if (/^(5[1-5]|2[2-7])/.test(raw)) setCardBrand('mastercard');
    else if (/^3[47]/.test(raw)) setCardBrand('amex');
    else setCardBrand('generic');

    // format in groups of 4
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExpiry(raw);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCardCvv(raw);
  };

  const handleProcessCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = cardNumber.replace(/\s/g, '');
    if (cleanNum.length < 15) {
      alert('Por favor ingresa un número de tarjeta válido.');
      return;
    }
    if (cardExpiry.length < 5) {
      alert('Por favor ingresa una fecha de expiración válida (MM/AA).');
      return;
    }
    if (cardCvv.length < 3) {
      alert('Por favor ingresa el código CVV.');
      return;
    }

    setIsProcessing(true);
    // Simulate transaction processing
    setTimeout(async () => {
      const folio = 'KC-' + Math.floor(100000 + Math.random() * 900000);
      setReceiptFolio(folio);
      setCompletedMethod('tarjeta');
      await onPaymentSuccess(student.id, 'tarjeta', student.tuitionAmount);
      setIsProcessing(false);
      setPaymentCompleted(true);
    }, 1200);
  };

  const handleConfirmTransfer = async () => {
    setIsProcessing(true);
    setTimeout(async () => {
      const folio = 'SPEI-' + Math.floor(100000 + Math.random() * 900000);
      setReceiptFolio(folio);
      setCompletedMethod('transferencia');
      await onPaymentSuccess(student.id, 'transferencia', student.tuitionAmount);
      setIsProcessing(false);
      setPaymentCompleted(true);
    }, 800);
  };

  return (
    <div
      id="payment-modal-backdrop"
      className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="payment-modal-container"
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden relative animate-scaleIn my-auto"
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={student.photo}
              alt={student.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-white/80 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {student.classroom}
                </span>
                <span className="text-xs text-pink-100 font-medium">
                  {student.tuitionStatus === 'Pagado' ? 'Al corriente' : 'Pago de Colegiatura'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">{student.name}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/90 transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Tuition Summary Banner */}
          <div className="bg-[#FAF7F5] rounded-2xl p-4 border border-slate-200/70 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-pink-500" /> Fecha de pago / Vencimiento
              </span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{student.paymentDate}</p>
              {student.hasScholarship && (
                <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Beca institucional: {student.scholarshipPercent}% desc.
                </span>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                Total a Liquidar
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                ${student.tuitionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 block">MXN</span>
            </div>
          </div>

          {paymentCompleted ? (
            /* SUCCESS CONFIRMATION RECEIPT */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 mx-auto flex items-center justify-center text-emerald-600 shadow-sm animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-800">¡Pago Registrado con Éxito!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  La colegiatura de <span className="font-semibold text-slate-700">{student.name}</span> ha sido
                  actualizada a estado <span className="font-bold text-emerald-600">Pagado</span> en la base de datos SQL.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-w-sm mx-auto space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Folio de Comprobante:</span>
                  <span className="font-mono font-bold text-slate-800">{receiptFolio}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Método de pago:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {completedMethod === 'tarjeta' ? 'Tarjeta Bancaria' : 'Transferencia SPEI'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Monto cubierto:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ${student.tuitionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Fecha de operación:</span>
                  <span className="text-slate-800">{new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full max-w-sm py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold text-xs shadow-md transition cursor-pointer"
              >
                Finalizar y Cerrar
              </button>
            </div>
          ) : (
            /* PAYMENT METHOD SELECTION TABS */
            <>
              {/* Method Switcher */}
              <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
                <button
                  type="button"
                  id="tab-btn-transferencia"
                  onClick={() => setActiveTab('transferencia')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'transferencia'
                      ? 'bg-white text-pink-600 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Pago por Transferencia
                </button>
                <button
                  type="button"
                  id="tab-btn-tarjeta"
                  onClick={() => setActiveTab('tarjeta')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'tarjeta'
                      ? 'bg-white text-pink-600 shadow-xs border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  Pago con Tarjeta
                </button>
              </div>

              {/* OPTION 1: TRANSFERENCIA SPEI */}
              {activeTab === 'transferencia' && (
                <div id="payment-view-transfer" className="space-y-4 animate-fadeIn">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Realiza tu pago desde la aplicación de tu banco utilizando los datos de la cuenta oficial de la guardería:
                  </p>

                  <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                    {/* Bank Name */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Institución Bancaria</span>
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-600" /> {bankName}
                        </span>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-semibold border border-blue-100">
                        Cuenta Verificada
                      </span>
                    </div>

                    {/* Beneficiary */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Beneficiario</span>
                        <span className="text-xs font-semibold text-slate-800 mt-0.5">{accountHolder}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(accountHolder, 'holder')}
                        className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition"
                        title="Copiar beneficiario"
                      >
                        {copiedField === 'holder' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* CLABE */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">CLABE Interbancaria</span>
                        <span className="text-sm font-mono font-bold text-slate-900 mt-0.5 tracking-wider">{clabe}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(clabe, 'clabe')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-lg transition"
                      >
                        {copiedField === 'clabe' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar CLABE
                          </>
                        )}
                      </button>
                    </div>

                    {/* Account Number */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Número de Cuenta</span>
                        <span className="text-xs font-mono font-semibold text-slate-800 mt-0.5">{accountNumber}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(accountNumber, 'account')}
                        className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition"
                        title="Copiar cuenta"
                      >
                        {copiedField === 'account' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Concept */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase block">Concepto / Referencia</span>
                        <span className="text-xs font-semibold text-pink-700 mt-0.5">{transferConcept}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(transferConcept, 'concept')}
                        className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition"
                        title="Copiar concepto"
                      >
                        {copiedField === 'concept' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Tracking reference input */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Folio de Rastreo SPEI / Comprobante (Opcional):
                    </label>
                    <input
                      type="text"
                      value={transferRef}
                      onChange={(e) => setTransferRef(e.target.value)}
                      placeholder="Ej: 2026091800142"
                      className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400/50"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmTransfer}
                    disabled={isProcessing}
                    className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Verificando transferencia...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Notificar y Registrar Pago por Transferencia
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* OPTION 2: TARJETA DE CRÉDITO O DÉBITO */}
              {activeTab === 'tarjeta' && (
                <form id="payment-view-card" onSubmit={handleProcessCardPayment} className="space-y-4 animate-fadeIn">
                  {/* Card Visual Preview */}
                  <div className="relative h-44 rounded-3xl p-5 text-white bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 shadow-md flex flex-col justify-between overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex justify-between items-center relative z-10">
                      <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-300">
                        {settings.name || 'Kinder Creativo'}
                      </span>
                      <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-white">
                        {cardBrand === 'visa' && <span className="text-blue-400 italic font-black">VISA</span>}
                        {cardBrand === 'mastercard' && <span className="text-orange-400 font-black">Mastercard</span>}
                        {cardBrand === 'amex' && <span className="text-sky-300 font-black">AMEX</span>}
                        {cardBrand === 'generic' && <CreditCard className="w-5 h-5 text-slate-400" />}
                      </div>
                    </div>

                    <div className="relative z-10 font-mono text-base sm:text-lg tracking-widest text-slate-100">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-end relative z-10 text-[10px]">
                      <div>
                        <span className="text-slate-400 uppercase text-[9px] block">Titular</span>
                        <span className="font-semibold text-slate-100 uppercase tracking-wide">
                          {cardHolder || 'NOMBRE DEL TITULAR'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 uppercase text-[9px] block">Vence</span>
                        <span className="font-semibold text-slate-100 font-mono">
                          {cardExpiry || 'MM/AA'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Fields Form */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nombre en la tarjeta:
                      </label>
                      <input
                        type="text"
                        required
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="Ej. CAMILA MARTÍNEZ VEGA"
                        className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400/50 uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Número de Tarjeta (16 dígitos):
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4000 1234 5678 9010"
                          maxLength={19}
                          className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400/50 tracking-wider"
                        />
                        <div className="absolute right-3 top-2.5 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Vigencia (MM/AA):
                        </label>
                        <input
                          type="text"
                          required
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          placeholder="MM/AA"
                          maxLength={5}
                          className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400/50 text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          CVV / CVC (3-4 dígitos):
                        </label>
                        <input
                          type="password"
                          required
                          value={cardCvv}
                          onChange={handleCvvChange}
                          placeholder="•••"
                          maxLength={4}
                          className="w-full text-xs font-mono px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400/50 text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Transacción protegida con cifrado SSL bancario de 256 bits.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Procesando cobro con pasarela bancaria...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" /> Pagar ${student.tuitionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
