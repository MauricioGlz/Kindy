import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  UserCheck,
  Calendar,
  Users,
  KeyRound,
  Download,
} from 'lucide-react';
import { Student, TrustedContactItem } from '../types.ts';
import {
  createParentQrPayload,
  createTrustedContactQrPayload,
  serializeQrPayload,
  generateQrDataUrl,
} from '../utils/qrSecurity.ts';

interface QrPassModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QrPassModal({ student, isOpen, onClose }: QrPassModalProps) {
  const [selectedPassType, setSelectedPassType] = useState<'parents' | number>('parents');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeKey, setActiveKey] = useState<string>('');
  const [activeName, setActiveName] = useState<string>('');
  const [activeRole, setActiveRole] = useState<string>('');

  useEffect(() => {
    if (!student) return;

    let payloadStr = '';
    if (selectedPassType === 'parents') {
      const payload = createParentQrPayload(student);
      payloadStr = serializeQrPayload(payload);
      setActiveKey(student.parentQrKey);
      setActiveName([student.father, student.mother].filter(Boolean).join(' / ') || 'Padres de Familia');
      setActiveRole('Padres / Tutores Principales');
    } else {
      const contact = student.trustedFamilyList?.[selectedPassType];
      if (contact) {
        const payload = createTrustedContactQrPayload(student, contact);
        payloadStr = serializeQrPayload(payload);
        setActiveKey(contact.qrKey);
        setActiveName(contact.name);
        setActiveRole(`Familiar Autorizado (${contact.relation})`);
      }
    }

    if (payloadStr) {
      generateQrDataUrl(payloadStr).then(setQrDataUrl);
    }
  }, [student, selectedPassType]);

  if (!isOpen || !student) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative my-auto animate-scaleIn print:border-none print:shadow-none print:max-w-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Credencial Digital de Acceso QR</h3>
              <p className="text-xs text-slate-400">Pase oficial con llave criptográfica única e intransferible</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pass Selector Tabs */}
        <div className="flex p-1 bg-slate-100 rounded-xl gap-1 my-4 print:hidden overflow-x-auto">
          <button
            onClick={() => setSelectedPassType('parents')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedPassType === 'parents'
                ? 'bg-white text-pink-600 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            QR Padres de Familia
          </button>
          {student.trustedFamilyList?.map((contact, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPassType(idx)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedPassType === idx
                  ? 'bg-white text-pink-600 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              QR {contact.relation}: {contact.name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Printable Physical Badge Container */}
        <div className="border-2 border-dashed border-pink-200 rounded-3xl p-5 bg-gradient-to-b from-pink-50/40 via-white to-pink-50/20 text-center space-y-4 print:border-slate-800 print:bg-white print:p-8">
          <div className="flex items-center justify-between border-b border-pink-100 pb-3">
            <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Credencial Oficial de Recolección
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {student.classroom}
            </span>
          </div>

          <div className="flex items-center justify-center gap-4">
            <img
              src={student.photo}
              alt={student.name}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md"
            />
            <div className="text-left">
              <h4 className="font-extrabold text-slate-900 text-base">{student.name}</h4>
              <p className="text-xs text-slate-500 font-medium">Matrícula: #{student.id.toString().padStart(4, '0')}</p>
              <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                {student.bloodType} • Seguro Activo
              </span>
            </div>
          </div>

          {/* QR Code Canvas */}
          <div className="p-3 bg-white rounded-2xl shadow-xs border border-slate-200/80 inline-block">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Código QR de Acceso" className="w-44 h-44 mx-auto object-contain" />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-slate-300 text-xs">
                Generando QR...
              </div>
            )}
          </div>

          {/* Guardian Info */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 text-left space-y-1">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Titular Autorizado</span>
            <p className="text-xs font-bold text-slate-800">{activeName}</p>
            <p className="text-[11px] text-pink-600 font-medium">{activeRole}</p>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Llave Criptográfica:</span>
              <span className="font-semibold text-slate-600">{activeKey}</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-tight">
            Presenta este Código QR al personal del colegio durante la recepción y salida de tu pequeño.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-4 print:hidden">
          <a
            href={qrDataUrl}
            download={`QR-${student.name.replace(/\s+/g, '_')}-${activeRole.slice(0, 8)}.png`}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" /> Descargar QR
          </a>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Imprimir Credencial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
