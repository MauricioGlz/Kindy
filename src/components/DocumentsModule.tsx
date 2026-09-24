import React, { useState } from 'react';
import { FileText, Plus, CheckCircle2, Clock, Upload, X, Search } from 'lucide-react';
import { DocumentItem, Student } from '../types.ts';

interface DocumentsModuleProps {
  documents: DocumentItem[];
  students: Student[];
  onAddDocument: (doc: Omit<DocumentItem, 'id'>) => Promise<void> | void;
}

export default function DocumentsModule({
  documents,
  students,
  onAddDocument,
}: DocumentsModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(students[0]?.id || 1);
  const [docName, setDocName] = useState('Acta de Nacimiento');
  const [docType, setDocType] = useState<'pdf' | 'img'>('pdf');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const std = students.find((s) => s.id === selectedStudentId);
    if (!std) return;

    await onAddDocument({
      studentId: std.id,
      studentName: std.name,
      name: docName,
      type: docType,
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Completo',
    });

    setIsModalOpen(false);
  };

  const filtered = documents.filter(
    (d) =>
      d.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="view-module-documents" className="w-full max-w-5xl space-y-5">
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <FileText className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
              Expedientes Digitales
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Administrador de Documentos</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Actas de nacimiento, cartillas de vacunación y expedientes escolares en base de datos.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <Upload className="w-4 h-4" /> Anexar Documento
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por alumno o tipo de documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center justify-between gap-3 hover:border-amber-300 transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-xs">{doc.name}</h4>
                <p className="text-[11px] text-slate-500">{doc.studentName}</p>
                <span className="text-[10px] text-slate-400 block mt-0.5">{doc.uploadDate}</span>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full shrink-0">
              {doc.status}
            </span>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Anexar Documento a Alumno</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Alumno:</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.classroom})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo de Documento:</label>
                <select
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Acta de Nacimiento Certificada">Acta de Nacimiento Certificada</option>
                  <option value="CURP Actualizada">CURP Actualizada</option>
                  <option value="Cartilla Nacional de Vacunación">Cartilla Nacional de Vacunación</option>
                  <option value="Comprobante de Domicilio">Comprobante de Domicilio</option>
                  <option value="Certificado Médico Pediátrico">Certificado Médico Pediátrico</option>
                  <option value="Identificación Oficial del Tutor (INE)">Identificación Oficial del Tutor (INE)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs rounded-xl font-bold cursor-pointer"
                >
                  Registrar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
