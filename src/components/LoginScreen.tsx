import { useState, useEffect } from 'react';
import { ArrowLeftRight, ArrowLeft, Check, Lock, Sparkles, Terminal } from 'lucide-react';
import { Employee, InstitutionSettings } from '../types.ts';
import { useDebugMode } from '../context/DebugContext.tsx';

interface LoginScreenProps {
  employees: Employee[];
  settings: InstitutionSettings;
  onLoginSuccess: (employee: Employee) => void;
  onDirectDeliveryAccess: () => void;
}

export default function LoginScreen({
  employees,
  settings,
  onLoginSuccess,
  onDirectDeliveryAccess,
}: LoginScreenProps) {
  const { isDebugMode, openDebugModal, deactivateDebugMode } = useDebugMode();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [pinBuffer, setPinBuffer] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedEmployee) return;

      if (e.key >= '0' && e.key <= '9') {
        if (pinBuffer.length < 6) {
          setPinBuffer((prev) => prev + e.key);
          setErrorMsg(null);
        }
      } else if (e.key === 'Backspace') {
        setPinBuffer((prev) => prev.slice(0, -1));
        setErrorMsg(null);
      } else if (e.key === 'Enter') {
        if (pinBuffer.length === 6) {
          verifyPin(pinBuffer);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEmployee, pinBuffer]);

  useEffect(() => {
    if (pinBuffer.length === 6 && selectedEmployee) {
      const timer = setTimeout(() => {
        verifyPin(pinBuffer);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [pinBuffer, selectedEmployee]);

  const verifyPin = (pin: string) => {
    if (!selectedEmployee) return;
    if (pin === selectedEmployee.pin || pin === '123456') {
      onLoginSuccess(selectedEmployee);
    } else {
      setErrorMsg(
        isDebugMode
          ? 'PIN incorrecto. (Modo depuración: usa 123456 o PIN de empleado)'
          : 'PIN incorrecto. Inténtalo de nuevo.'
      );
      setPinBuffer('');
    }
  };

  const handleDigit = (digit: string) => {
    if (pinBuffer.length < 6) {
      setPinBuffer((prev) => prev + digit);
      setErrorMsg(null);
    }
  };

  const clearPin = () => {
    setPinBuffer('');
    setErrorMsg(null);
  };

  const backgroundStyle = settings.loginBgUrl
    ? { backgroundImage: `url(${settings.loginBgUrl})` }
    : undefined;

  return (
    <div
      id="screen-login"
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#FAF7F5] bg-canvas-cover"
      style={backgroundStyle}
    >
      {/* Decorative gradient overlay */}
      {!settings.loginBgUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#E0F2FE]/80 via-[#FCE7F3]/70 to-[#DCFCE7]/70 -z-10" />
      )}

      {/* Top Bar for Debug Mode Access on Login Screen */}
      <div className="absolute top-4 right-4 z-20">
        {!isDebugMode ? (
          <button
            onClick={openDebugModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 hover:bg-white border border-slate-200/90 rounded-full text-slate-700 text-xs font-semibold shadow-2xs backdrop-blur-md transition cursor-pointer"
            title="Activar Modo de Depuración"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-600" />
            <span>Modo de depuración</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50/95 border border-amber-300 rounded-full text-amber-900 text-xs font-semibold shadow-2xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Depuración Activa</span>
            <button
              onClick={deactivateDebugMode}
              className="ml-1 text-amber-700 hover:text-amber-950 font-bold cursor-pointer"
              title="Cerrar depuración"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-7 max-w-md w-full border border-pink-100 relative transition-all duration-300">
        {!selectedEmployee ? (
          /* Step 1: Employee Select */
          <div id="step-employee-select" className="space-y-5">
            <div className="text-center">
              <img
                src={settings.logoUrl}
                alt={settings.name}
                className="w-16 h-16 rounded-2xl mx-auto mb-2.5 object-cover border border-pink-200 shadow-xs"
              />
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">{settings.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Portal de Gestión Escolar • Acceso de Personal</p>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                Selecciona tu perfil
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    id={`btn-emp-${emp.id}`}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setPinBuffer('');
                      setErrorMsg(null);
                    }}
                    className="flex flex-col items-center p-3 rounded-2xl bg-[#FCE7F3]/40 hover:bg-[#FCE7F3] border border-pink-200/80 hover:border-pink-300 transition group text-center cursor-pointer shadow-2xs"
                  >
                    <img
                      src={emp.photo}
                      alt={emp.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow group-hover:scale-105 transition mb-2"
                    />
                    <span className="font-bold text-slate-800 text-xs truncate w-full">{emp.name}</span>
                    <span className="text-[10px] text-pink-700 truncate w-full mt-0.5">{emp.role}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Access to Delivery for Parents */}
            <div className="pt-3 border-t border-slate-100">
              <button
                id="btn-direct-delivery"
                onClick={onDirectDeliveryAccess}
                className="w-full py-3 px-4 bg-[#FCE7F3] hover:bg-[#fbcfe8] text-pink-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-pink-300 transition shadow-2xs cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 text-pink-600" />
                Acceso Rápido: Entrega y Recepción por Código QR
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Animated PIN Entry */
          <div id="step-pin-entry" className="text-center space-y-4">
            <button
              onClick={() => {
                setSelectedEmployee(null);
                setPinBuffer('');
                setErrorMsg(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Cambiar de usuario
            </button>

            <div className="flex flex-col items-center">
              <img
                src={selectedEmployee.photo}
                alt={selectedEmployee.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 shadow-md mb-2"
              />
              <h3 className="font-bold text-slate-800 text-base">{selectedEmployee.name}</h3>
              <p className="text-xs text-slate-400">{selectedEmployee.role}</p>
              <span className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Introduce tu PIN de 6 dígitos
              </span>
            </div>

            {/* 6 PIN Dots */}
            <div className="flex justify-center gap-2.5 my-3">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const isFilled = idx < pinBuffer.length;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-150 ${
                      isFilled
                        ? 'bg-pink-400 border-pink-400 scale-110 shadow-xs'
                        : 'bg-transparent border-pink-300'
                    }`}
                  />
                );
              })}
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium py-1">{errorMsg}</p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
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
                onClick={() => verifyPin(pinBuffer)}
                disabled={pinBuffer.length < 6}
                className="h-11 rounded-xl bg-emerald-400 hover:bg-emerald-500 disabled:opacity-50 text-white flex items-center justify-center shadow-xs transition cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 font-mono pt-1">
              PIN predeterminado demo: <strong>123456</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
