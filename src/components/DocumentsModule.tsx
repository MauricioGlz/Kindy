import { useState } from 'react';
import {
  Folder,
  Grid,
  List,
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  Plus,
  Upload,
  FolderKanban,
  FileQuestion,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Student, DocumentItem } from '../types.ts';

interface DocumentsModuleProps {
  students: Student[];
  documents: DocumentItem[];
  onUploadDocument: (doc: Omit<DocumentItem, 'id'>) => void;
}

export default function DocumentsModule({
  students,
  documents,
  onUploadDocument,
}: DocumentsModuleProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openFolderStudentId, setOpenFolderStudentId] = useState<number | null>(null);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [docName, setDocName] = useState<string>('');
  const [docType, setDocType] = useState<'pdf' | 'img'>('pdf');
  const [docFileSize, setDocFileSize] = useState<string>('1.2 MB');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const selectedStudentForFolder = openFolderStudentId
    ? students.find((s) => s.id === openFolderStudentId)
    : null;

  const currentFolderDocs = openFolderStudentId
    ? documents.filter((d) => d.studentId === openFolderStudentId)
    : [];

  const handleOpenUploadModal = () => {
    setDocName('');
    setDocType('pdf');
    setDocFileSize('1.2 MB');
    setShowUploadModal(true);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openFolderStudentId || !docName.trim()) return;

    onUploadDocument({
      studentId: openFolderStudentId,
      name: docName.endsWith('.pdf') || docName.endsWith('.jpg') || docName.endsWith('.png')
        ? docName.trim()
        : `${docName.trim()}.${docType === 'pdf' ? 'pdf' : 'jpg'}`,
      size: docFileSize,
      type: docType,
      date: new Date().toLocaleDateString('es-MX'),
    });

    setShowUploadModal(false);
    setFeedbackMsg('¡Documento acreditado y guardado en SQLite con éxito!');
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  return (
    <div id="view-module-documentos" className="w-full max-w-5xl space-y-4">
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-2xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            {openFolderStudentId !== null && (
              <button
                id="doc-btn-back-folder"
                onClick={() => setOpenFolderStudentId(null)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition cursor-pointer"
                title="Volver a todas las carpetas"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-purple-600" />
              {selectedStudentForFolder
                ? `Carpeta: ${selectedStudentForFolder.name}`
                : 'Administrador de Documentos'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedStudentForFolder
              ? 'Expediente digital, actas, comprobantes e identificaciones acreditadas'
              : 'Cada niño registrado representa una carpeta de expedientes digitales'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {selectedStudentForFolder && (
            <button
              onClick={handleOpenUploadModal}
              className="px-3.5 py-1.5 bg-[#F3E8FF] hover:bg-purple-200 text-purple-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-purple-300 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-purple-700" /> Añadir Archivo
            </button>
          )}

          {/* View mode toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              id="doc-view-grid-btn"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white shadow-2xs text-slate-700'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Vista en Iconos (Cuadrícula)"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              id="doc-view-list-btn"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white shadow-2xs text-slate-700'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Vista en Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Browser Container */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs min-h-[380px]">
        {openFolderStudentId === null ? (
          /* ROOT FOLDER VIEW: Each student is a folder */
          students.length === 0 ? (
            <p className="text-xs text-slate-400 py-16 text-center">
              No hay alumnos ni carpetas registradas en la base de datos.
            </p>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {students.map((student) => {
                const count = documents.filter((d) => d.studentId === student.id).length;
                return (
                  <button
                    key={student.id}
                    onClick={() => setOpenFolderStudentId(student.id)}
                    className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#FAF7F5] hover:bg-amber-50/70 border border-slate-200/90 hover:border-amber-300 transition group text-center cursor-pointer shadow-2xs"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#FEF9C3] flex items-center justify-center text-amber-500 mb-2.5 group-hover:scale-105 transition shadow-2xs">
                      <Folder className="w-8 h-8 fill-amber-300 stroke-amber-600" />
                    </div>
                    <span className="font-bold text-xs text-slate-800 truncate w-full">
                      {student.name}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      {count} archivo{count !== 1 ? 's' : ''} • {student.classroom}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {students.map((student) => {
                const count = documents.filter((d) => d.studentId === student.id).length;
                return (
                  <div
                    key={student.id}
                    onClick={() => setOpenFolderStudentId(student.id)}
                    className="flex items-center justify-between py-3 px-3 hover:bg-[#FAF7F5] rounded-xl cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-amber-500 fill-amber-200 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800 block">{student.name}</span>
                        <span className="text-[10px] text-slate-400">{student.classroom}</span>
                      </div>
                    </div>
                    <span className="text-slate-500 font-medium text-xs">
                      {count} documento{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* INSIDE A STUDENT'S FOLDER */
          currentFolderDocs.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FileQuestion className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">No hay documentos registrados para este alumno.</p>
              <button
                onClick={handleOpenUploadModal}
                className="mt-4 px-3.5 py-1.5 bg-[#F3E8FF] text-purple-900 font-semibold rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Subir primer archivo
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {currentFolderDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col items-center justify-between p-4 rounded-2xl bg-[#FAF7F5] border border-slate-200/90 text-center shadow-2xs hover:shadow-xs transition"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-2xs ${
                      doc.type === 'pdf' ? 'bg-rose-100 text-rose-500' : 'bg-[#E0F2FE] text-sky-600'
                    }`}
                  >
                    {doc.type === 'pdf' ? (
                      <FileText className="w-6 h-6" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                  </div>
                  <span className="font-semibold text-xs text-slate-800 truncate w-full" title={doc.name}>
                    {doc.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {doc.size} • {doc.date}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {currentFolderDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-3 px-3 hover:bg-[#FAF7F5] rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        doc.type === 'pdf' ? 'bg-rose-100 text-rose-500' : 'bg-[#E0F2FE] text-sky-600'
                      }`}
                    >
                      {doc.type === 'pdf' ? (
                        <FileText className="w-4 h-4" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800 block">{doc.name}</span>
                      <span className="text-[10px] text-slate-400">{doc.size}</span>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs font-mono">{doc.date}</span>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && selectedStudentForFolder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-800">Añadir Documento al Expediente</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mb-4">
              Expediente de: <strong className="text-slate-700">{selectedStudentForFolder.name}</strong>
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Nombre del Archivo *</label>
                <input
                  required
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="Ej. Cartilla_Vacunacion.pdf"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Tipo de Archivo</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as 'pdf' | 'img')}
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none"
                >
                  <option value="pdf">Documento PDF</option>
                  <option value="img">Imagen (JPG / PNG / INE)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Seleccionar Archivo Local</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setDocName(file.name);
                      setDocFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
                      setDocType(file.type.includes('pdf') ? 'pdf' : 'img');
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#F3E8FF] file:text-purple-900 hover:file:bg-purple-200 cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F3E8FF] hover:bg-purple-200 text-purple-950 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer border border-purple-300"
                >
                  Guardar Documento (SQL)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
