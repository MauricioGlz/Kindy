import React, { useState, useMemo, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  File,
  Image as ImageIcon,
  Upload,
  Download,
  Trash2,
  Eye,
  Search,
  Plus,
  Grid,
  List as ListIcon,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  X,
  Printer,
  ShieldCheck,
  User,
  Users,
  HardDrive,
  AlertCircle,
  Calendar,
  Layers,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { DocumentItem, Student } from '../types.ts';

interface DocumentsModuleProps {
  documents: DocumentItem[];
  students: Student[];
  institutionName?: string;
  onUploadDocument?: (doc: Omit<DocumentItem, 'id'>) => Promise<void> | void;
  onAddDocument?: (doc: Omit<DocumentItem, 'id'>) => Promise<void> | void;
  onDeleteDocument?: (id: number) => Promise<void> | void;
}

const DOCUMENT_CATEGORIES = [
  'Acta de Nacimiento Certificada',
  'CURP Actualizada',
  'Cartilla Nacional de Vacunación',
  'Comprobante de Domicilio Vigente',
  'Certificado Médico Pediátrico',
  'Identificación Oficial del Tutor (INE)',
  'Hoja de Inscripción Firmada',
  'Convenio de Entrega Escolar',
  'Otro Documento',
];

export default function DocumentsModule({
  documents,
  students,
  institutionName = 'Kindy Montessori',
  onUploadDocument,
  onAddDocument,
  onDeleteDocument,
}: DocumentsModuleProps) {
  // Navigation State: null = root directory showing folders of all students; number = inside child's folder
  const [currentFolderStudentId, setCurrentFolderStudentId] = useState<number | null>(null);

  // Search and view mode
  const [searchTerm, setSearchTerm] = useState('');
  const [classroomFilter, setClassroomFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<number>(students[0]?.id || 1);
  const [docCategory, setDocCategory] = useState(DOCUMENT_CATEGORIES[0]);
  const [customDocName, setCustomDocName] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'img'>('pdf');
  const [fileSizeStr, setFileSizeStr] = useState('1.2 MB');
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const [selectedRealFileName, setSelectedRealFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Delete Confirmation State
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Current active student if inside a folder
  const activeStudent = useMemo(() => {
    if (currentFolderStudentId === null) return null;
    return students.find((s) => s.id === currentFolderStudentId) || null;
  }, [students, currentFolderStudentId]);

  // Unique classrooms for filter pills
  const classroomsList = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.classroom) set.add(s.classroom);
    });
    return Array.from(set);
  }, [students]);

  // Mapping from studentId to documents list
  const documentsByStudent = useMemo(() => {
    const map = new Map<number, DocumentItem[]>();
    students.forEach((s) => map.set(s.id, []));
    documents.forEach((d) => {
      const list = map.get(d.studentId) || [];
      list.push(d);
      map.set(d.studentId, list);
    });
    return map;
  }, [students, documents]);

  // Filtered Students (Root Folders)
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.classroom && s.classroom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.father && s.father.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.mother && s.mother.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesClass = classroomFilter === 'ALL' || s.classroom === classroomFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, classroomFilter]);

  // Documents inside current student folder
  const currentFolderDocuments = useMemo(() => {
    if (!activeStudent) return [];
    const list = documentsByStudent.get(activeStudent.id) || [];
    if (!searchTerm.trim()) return list;
    return list.filter((d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.category && d.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [activeStudent, documentsByStudent, searchTerm]);

  // Open upload modal
  const handleOpenUploadModal = (studentId?: number) => {
    const targetId = studentId || currentFolderStudentId || students[0]?.id || 1;
    setTargetStudentId(targetId);
    setDocCategory(DOCUMENT_CATEGORIES[0]);
    setCustomDocName('');
    setFileType('pdf');
    setFileSizeStr('1.2 MB');
    setFileDataUrl(null);
    setSelectedRealFileName('');
    setIsUploadModalOpen(true);
  };

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedRealFileName(file.name);
    // Format size
    if (file.size < 1024 * 1024) {
      setFileSizeStr(`${(file.size / 1024).toFixed(1)} KB`);
    } else {
      setFileSizeStr(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    }

    const isImage = file.type.startsWith('image/');
    setFileType(isImage ? 'img' : 'pdf');

    // Default clean filename if empty
    if (!customDocName) {
      setCustomDocName(file.name);
    }

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFileDataUrl(null);
    }
  };

  // Submit Upload Document
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const std = students.find((s) => s.id === targetStudentId);
    if (!std) return;

    let finalName = customDocName.trim();
    if (!finalName) {
      const ext = fileType === 'pdf' ? '.pdf' : '.jpg';
      finalName = `${docCategory.replace(/\s+/g, '_')}_${std.name.split(' ')[0]}${ext}`;
    }

    const payload: Omit<DocumentItem, 'id'> = {
      studentId: std.id,
      studentName: std.name,
      name: finalName,
      type: fileType,
      size: fileSizeStr,
      date: new Date().toLocaleDateString('es-MX'),
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Completo',
      category: docCategory,
      url: fileDataUrl || undefined,
    };

    if (onUploadDocument) {
      await onUploadDocument(payload);
    } else if (onAddDocument) {
      await onAddDocument(payload);
    }

    setIsUploadModalOpen(false);
  };

  // Confirm delete document
  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      if (onDeleteDocument) {
        await onDeleteDocument(docToDelete.id);
      }
      setDocToDelete(null);
      if (previewDoc?.id === docToDelete.id) {
        setPreviewDoc(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Download simulation
  const handleDownloadDoc = (doc: DocumentItem) => {
    if (doc.url && doc.type === 'img') {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.name;
      link.click();
      return;
    }

    // Generate mock text/pdf blob download for simulation
    const content = `================================================
INSTITUTO: ${institutionName.toUpperCase()}
EXPEDIENTE ESCOLAR OFICIAL
DOCUMENTO: ${doc.name}
ALUMNO: ${doc.studentName || 'Alumno Titular'} (ID: ${doc.studentId})
TIPO DE ARCHIVO: ${doc.type.toUpperCase()}
FECHA DE REGISTRO: ${doc.uploadDate || doc.date || 'Reciente'}
ESTADO: VIGENTE Y REGISTRADO EN SQLITE SEGURO
================================================
Este archivo forma parte del expediente confidencial del alumno.`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.name.endsWith('.txt') ? doc.name : `${doc.name}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Total system stats
  const totalFilesCount = documents.length;
  const completeFoldersCount = students.filter(
    (s) => (documentsByStudent.get(s.id)?.length || 0) >= 3
  ).length;

  return (
    <div id="view-module-documents" className="w-full max-w-6xl space-y-5">
      {/* Top Banner / System File Manager Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold tracking-wider uppercase flex items-center gap-1.5 border border-amber-400/30">
                <HardDrive className="w-3.5 h-3.5" /> Administrador de Archivos Escolar
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {institutionName}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Expedientes Digitales por Alumno</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Estructura jerárquica de carpetas individuales: cada alumno cuenta con su propia carpeta de almacenamiento seguro para actas, cartillas, identificaciones y documentos escolares.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
            <button
              onClick={() => handleOpenUploadModal()}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Anexar Documento</span>
            </button>
          </div>
        </div>

        {/* Global Storage Quick Statistics */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-2.5 border border-slate-700/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Carpetas Alumnos</p>
              <p className="text-base font-bold text-white">{students.length}</p>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-2.5 border border-slate-700/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-400/10 text-blue-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Archivos Digitales</p>
              <p className="text-base font-bold text-white">{totalFilesCount}</p>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-2.5 border border-slate-700/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-400/10 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Expedientes al Día</p>
              <p className="text-base font-bold text-emerald-400">{completeFoldersCount} de {students.length}</p>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-xs rounded-xl p-2.5 border border-slate-700/50 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-400/10 text-purple-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Base de Datos</p>
              <p className="text-base font-bold text-white">SQLite Seguro</p>
            </div>
          </div>
        </div>
      </div>

      {/* Explorer Navigation Bar & Breadcrumbs */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 text-xs">
          <button
            onClick={() => {
              setCurrentFolderStudentId(null);
              setSearchTerm('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer shrink-0 ${
              currentFolderStudentId === null
                ? 'bg-amber-100/80 text-amber-900 border border-amber-300/80'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Folder className="w-4 h-4 text-amber-600" />
            <span>📁 Todas las Carpetas</span>
          </button>

          {activeStudent && (
            <>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-900 rounded-xl font-bold border border-blue-200 shrink-0">
                <img
                  src={activeStudent.photo}
                  alt={activeStudent.name}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=300';
                  }}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-blue-300"
                />
                <FolderOpen className="w-4 h-4 text-blue-600" />
                <span>{activeStudent.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-blue-200 text-blue-800 rounded-md">
                  {activeStudent.classroom}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Search, Classroom Filter, and View Mode */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={
                activeStudent
                  ? `Buscar en carpeta de ${activeStudent.name.split(' ')[0]}...`
                  : 'Buscar carpeta de alumno...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:outline-hidden transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View toggle (Grid / List) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              title="Vista de cuadrícula"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Vista de lista detallada"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-800 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Classroom filter pills (Only shown at root folders view) */}
      {currentFolderStudentId === null && classroomsList.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Filtrar Aula:
          </span>
          <button
            onClick={() => setClassroomFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              classroomFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Todas ({students.length})
          </button>
          {classroomsList.map((room) => {
            const count = students.filter((s) => s.classroom === room).length;
            const active = classroomFilter === room;
            return (
              <button
                key={room}
                onClick={() => setClassroomFilter(room)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  active
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {room} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW LEVEL 1: ROOT DIRECTORY (STUDENTS AS FOLDERS)                        */}
      {/* ========================================================================= */}
      {currentFolderStudentId === null && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-amber-500" />
              <span>Carpetas de Alumnos ({filteredStudents.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Haz clic en cualquier carpeta para acceder a sus documentos
            </span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-2xs space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <Folder className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">No se encontraron carpetas</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay ningún alumno que coincida con "{searchTerm}". Intenta con otro término o limpia los filtros.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setClassroomFilter('ALL');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW OF FOLDERS */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((std) => {
                const docs = documentsByStudent.get(std.id) || [];
                const docsCount = docs.length;
                const isComplete = docsCount >= 3;

                return (
                  <div
                    key={std.id}
                    onClick={() => {
                      setCurrentFolderStudentId(std.id);
                      setSearchTerm('');
                    }}
                    className="group bg-white rounded-3xl p-5 border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between"
                  >
                    {/* Folder Tab Visual decoration */}
                    <div className="absolute top-0 left-6 w-20 h-2 bg-amber-400 rounded-b-md opacity-40 group-hover:opacity-100 group-hover:bg-amber-500 transition" />

                    <div>
                      {/* Folder Top Row: Icon + Classroom Badge */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="w-14 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 group-hover:from-amber-400 group-hover:to-amber-500 text-amber-700 group-hover:text-slate-900 flex items-center justify-center shadow-xs transition-colors">
                          <Folder className="w-7 h-7" />
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {std.classroom || 'Sin Aula'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isComplete
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {isComplete ? 'Expediente Completo' : `${docsCount} / 4 docs`}
                          </span>
                        </div>
                      </div>

                      {/* Student Info */}
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={std.photo}
                          alt={std.name}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=300';
                          }}
                          className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-amber-300 transition"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-slate-800 truncate group-hover:text-amber-800 transition">
                            {std.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">
                            {std.father || std.mother ? `Tutor: ${std.father || std.mother}` : 'Tutor registrado'}
                          </p>
                        </div>
                      </div>

                      {/* File preview tags */}
                      <div className="bg-slate-50 group-hover:bg-amber-50/50 rounded-2xl p-2.5 border border-slate-100 group-hover:border-amber-200/60 transition mb-4 space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-slate-400" /> Contenido:
                          </span>
                          <span className="font-bold text-slate-700">
                            {docsCount} {docsCount === 1 ? 'archivo' : 'archivos'}
                          </span>
                        </div>
                        {docs.length > 0 ? (
                          <div className="text-[11px] text-slate-600 truncate font-mono">
                            {docs.map((d) => d.name).slice(0, 2).join(', ')}
                            {docs.length > 2 && ` y ${docs.length - 2} más...`}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic">
                            Carpeta vacía (sin documentos aún)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-400 font-medium">
                        ID: #{std.id}
                      </span>
                      <span className="font-bold text-amber-700 group-hover:text-amber-800 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Abrir carpeta <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW OF FOLDERS */
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Carpeta / Alumno</th>
                      <th className="py-3 px-4">Aula</th>
                      <th className="py-3 px-4">Tutor Principal</th>
                      <th className="py-3 px-4">Archivos</th>
                      <th className="py-3 px-4">Estado Expediente</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStudents.map((std) => {
                      const docs = documentsByStudent.get(std.id) || [];
                      const docsCount = docs.length;
                      const isComplete = docsCount >= 3;

                      return (
                        <tr
                          key={std.id}
                          onClick={() => {
                            setCurrentFolderStudentId(std.id);
                            setSearchTerm('');
                          }}
                          className="hover:bg-amber-50/40 transition cursor-pointer"
                        >
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                              <Folder className="w-4 h-4" />
                            </div>
                            <img
                              src={std.photo}
                              alt={std.name}
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=300';
                              }}
                              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{std.name}</p>
                              <p className="text-[10px] text-slate-400">Expediente #{std.id}</p>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700 text-[10px]">
                              {std.classroom}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {std.father || std.mother || 'No registrado'}
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800">{docsCount} archivos</span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isComplete
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isComplete ? 'Completo' : 'Parcial'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentFolderStudentId(std.id);
                                setSearchTerm('');
                              }}
                              className="px-3 py-1 bg-amber-50 hover:bg-amber-200 text-amber-800 rounded-xl font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition"
                            >
                              Abrir <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW LEVEL 2: INSIDE A STUDENT FOLDER (EXPEDIENTE DEL NIÑO)               */}
      {/* ========================================================================= */}
      {activeStudent && (
        <div className="space-y-4">
          {/* Back button and Student Folder Header */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <button
                onClick={() => {
                  setCurrentFolderStudentId(null);
                  setSearchTerm('');
                }}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 transition cursor-pointer"
                title="Volver a todas las carpetas"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="relative">
                <img
                  src={activeStudent.photo}
                  alt={activeStudent.name}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=300';
                  }}
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-amber-100 shadow-xs"
                />
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-xs">
                  <FolderOpen className="w-3.5 h-3.5" />
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Carpeta: {activeStudent.classroom}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Matrícula: #{activeStudent.id}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  {activeStudent.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Padres: <span className="font-semibold text-slate-700">{activeStudent.father || 'N/A'}</span> / <span className="font-semibold text-slate-700">{activeStudent.mother || 'N/A'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
              <button
                onClick={() => handleOpenUploadModal(activeStudent.id)}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Anexar Documento a este Niño
              </button>
            </div>
          </div>

          {/* Files Header & Count */}
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Documentos en esta Carpeta ({currentFolderDocuments.length})</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Archivos anexados al expediente oficial
            </span>
          </div>

          {/* Documents Content */}
          {currentFolderDocuments.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-dashed border-slate-300 shadow-2xs space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
                <FolderOpen className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Esta carpeta aún no tiene documentos
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Registra el acta de nacimiento, comprobante de domicilio o identificación del tutor para digitalizar el expediente de {activeStudent.name}.
              </p>
              <button
                onClick={() => handleOpenUploadModal(activeStudent.id)}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-xs transition"
              >
                <Plus className="w-4 h-4" /> Subir Primer Documento
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW OF DOCUMENTS IN THIS FOLDER */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {currentFolderDocuments.map((doc) => {
                const isPdf = doc.type === 'pdf';

                return (
                  <div
                    key={doc.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* File Icon & Type Badge */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            isPdf
                              ? 'bg-rose-50 text-rose-600 border border-rose-100'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}
                        >
                          {isPdf ? (
                            <FileText className="w-6 h-6" />
                          ) : (
                            <ImageIcon className="w-6 h-6" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider ${
                              isPdf
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isPdf ? 'PDF' : 'IMAGEN'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {doc.size || '1.2 MB'}
                          </span>
                        </div>
                      </div>

                      {/* Document Title & Category */}
                      <h5 className="font-bold text-slate-800 text-xs line-clamp-2 mb-1 group-hover:text-blue-900 transition">
                        {doc.name}
                      </h5>

                      <p className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-2">
                        {doc.category || 'Documento Oficial'}
                      </p>

                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>Fecha: {doc.uploadDate || doc.date || 'Reciente'}</span>
                      </div>
                    </div>

                    {/* Action Buttons for this File */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                          title="Vista Previa"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver
                        </button>

                        <button
                          onClick={() => handleDownloadDoc(doc)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl cursor-pointer transition"
                          title="Descargar archivo"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {onDeleteDocument && (
                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition"
                          title="Eliminar de esta carpeta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* LIST VIEW OF DOCUMENTS IN THIS FOLDER */
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Archivo</th>
                      <th className="py-3 px-4">Categoría</th>
                      <th className="py-3 px-4">Formato</th>
                      <th className="py-3 px-4">Tamaño</th>
                      <th className="py-3 px-4">Fecha Subida</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {currentFolderDocuments.map((doc) => {
                      const isPdf = doc.type === 'pdf';
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isPdf
                                  ? 'bg-rose-50 text-rose-600'
                                  : 'bg-emerald-50 text-emerald-600'
                              }`}
                            >
                              {isPdf ? (
                                <FileText className="w-4 h-4" />
                              ) : (
                                <ImageIcon className="w-4 h-4" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{doc.name}</p>
                              <p className="text-[10px] text-slate-400">ID #{doc.id}</p>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-[11px] font-semibold text-slate-700">
                              {doc.category || 'Oficial'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                                isPdf
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {doc.type}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                            {doc.size || '1.2 MB'}
                          </td>

                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {doc.uploadDate || doc.date || 'Reciente'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" /> Ver
                              </button>
                              <button
                                onClick={() => handleDownloadDoc(doc)}
                                className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Descargar"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteDocument && (
                                <button
                                  onClick={() => setDocToDelete(doc)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUBIR / ANEXAR DOCUMENTO                                           */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Anexar Documento a Carpeta
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sube un archivo al expediente del alumno
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Select Student / Folder Target */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Carpeta del Alumno Destino:
                </label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:border-amber-400 focus:outline-hidden"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      📁 {s.name} ({s.classroom || 'Sin Aula'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Category */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Categoría del Documento:
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:border-amber-400 focus:outline-hidden"
                >
                  {DOCUMENT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Real File Picker Drag and Drop Zone */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Seleccionar Archivo (PDF o Imagen):
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50/70 hover:bg-amber-50/30 rounded-2xl p-5 text-center cursor-pointer transition group"
                >
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-amber-600 mx-auto mb-2 transition" />
                  {selectedRealFileName ? (
                    <div>
                      <p className="text-xs font-bold text-slate-800">{selectedRealFileName}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                        Archivo cargado exitosamente ({fileSizeStr})
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Haz clic aquí para examinar archivos de tu dispositivo
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Soporta PDF, JPG, PNG (máx. 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* File Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nombre Personalizado del Archivo (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. Acta_Nacimiento_Certificada.pdf"
                  value={customDocName}
                  onChange={(e) => setCustomDocName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:border-amber-400 focus:outline-hidden"
                />
              </div>

              {/* File Format / Type radio */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                  Formato de Visualización:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition ${
                      fileType === 'pdf'
                        ? 'border-rose-400 bg-rose-50/60 text-rose-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fileType"
                      checked={fileType === 'pdf'}
                      onChange={() => setFileType('pdf')}
                      className="accent-rose-500"
                    />
                    <FileText className="w-4 h-4 text-rose-500" />
                    <span>Documento PDF</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-xs font-semibold transition ${
                      fileType === 'img'
                        ? 'border-emerald-400 bg-emerald-50/60 text-emerald-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fileType"
                      checked={fileType === 'img'}
                      onChange={() => setFileType('img')}
                      className="accent-emerald-500"
                    />
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>Imagen / Fotografía</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-bold cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs rounded-xl font-black cursor-pointer shadow-xs transition"
                >
                  Guardar en Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: VISOR DE DOCUMENTO (PREVIEW)                                       */}
      {/* ========================================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    previewDoc.type === 'pdf'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {previewDoc.type === 'pdf' ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-white truncate">
                    {previewDoc.name}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {previewDoc.studentName || 'Alumno'} • {previewDoc.size || '1.2 MB'} • {previewDoc.type.toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownloadDoc(previewDoc)}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="Descargar archivo"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="Imprimir documento"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Viewer Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex items-center justify-center">
              {/* Document Paper Simulation */}
              <div className="bg-white rounded-2xl shadow-md border border-slate-300 w-full max-w-xl p-8 space-y-6 relative overflow-hidden">
                {/* Official School Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
                  <span className="text-6xl font-black text-slate-900 rotate-[-25deg]">
                    EXPEDIENTE ESCOLAR OFICIAL
                  </span>
                </div>

                {/* Document Header */}
                <div className="border-b-2 border-slate-800 pb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      {institutionName}
                    </h4>
                    <h2 className="text-base font-black text-slate-900 mt-0.5">
                      {previewDoc.category || previewDoc.name}
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Archivo Digitalizado en Sistema de Control Escolar
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                      ORIGINAL VERIFICADO
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">
                      FOLIO: #{previewDoc.id}-{previewDoc.studentId}
                    </p>
                  </div>
                </div>

                {/* If user uploaded real image */}
                {previewDoc.url ? (
                  <div className="flex flex-col items-center justify-center">
                    <img
                      src={previewDoc.url}
                      alt={previewDoc.name}
                      className="max-h-80 w-auto rounded-xl object-contain border border-slate-200 shadow-xs"
                    />
                  </div>
                ) : (
                  /* Simulated Document Content by Category */
                  <div className="space-y-4 text-xs text-slate-700">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Alumno Titular:</span>
                        <span className="font-bold text-slate-900">
                          {previewDoc.studentName || 'Alumno'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Identificador de Carpeta:</span>
                        <span className="font-mono font-bold text-slate-800">
                          EXP-ALU-{previewDoc.studentId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Fecha de Emisión / Registro:</span>
                        <span className="font-medium text-slate-700">
                          {previewDoc.uploadDate || previewDoc.date || 'Reciente'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-semibold">Almacenamiento:</span>
                        <span className="font-medium text-slate-700">
                          Base de datos SQLite Integrada ({previewDoc.size || '1.2 MB'})
                        </span>
                      </div>
                    </div>

                    {/* Specific details */}
                    <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white">
                      <h5 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Validación Institucional</span>
                      </h5>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Este documento digital ha sido cotejado contra el documento original físico presentado durante el proceso de matriculación e ingreso escolar en {institutionName}.
                      </p>
                      <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>CERTIFICADO: SHA256-VALIDATED</span>
                        <span>ESTADO: VIGENTE</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Footer with Stamp */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <div>
                    <p className="font-bold text-slate-800">{institutionName}</p>
                    <p className="text-slate-400 text-[10px]">Dirección Académica y Control Escolar</p>
                  </div>
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-emerald-600/60 flex items-center justify-center text-center rotate-[-12deg] p-1">
                    <span className="text-[9px] font-black uppercase text-emerald-700 leading-tight">
                      SELLO DIGITAL<br />COTEJADO<br />2026
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-white px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Visualizando archivo escolar
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadDoc(previewDoc)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Archivo
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE DOCUMENTO                                 */}
      {/* ========================================================================= */}
      {docToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">
                ¿Eliminar este documento?
              </h3>
              <p className="text-xs text-slate-500">
                Se eliminará "{docToDelete.name}" de la carpeta del alumno. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl font-bold cursor-pointer transition flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-xl font-black cursor-pointer transition shadow-xs flex-1 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
