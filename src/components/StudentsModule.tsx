import { useState } from 'react';
import {
  Search,
  UserPlus,
  Edit3,
  UserMinus,
  ShieldCheck,
  Plus,
  Trash2,
  Sparkles,
  Mail,
  Calendar,
  CreditCard,
  Award,
  Users,
  AlertTriangle,
  X,
  FileCheck,
} from 'lucide-react';
import { Student, Classroom } from '../types.ts';

interface StudentsModuleProps {
  students: Student[];
  classrooms: Classroom[];
  onAddStudent: (newStd: Omit<Student, 'id'>, docsPayload: { name: string; type: 'pdf' | 'img' }[]) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: number) => void;
}

export default function StudentsModule({
  students,
  classrooms,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
}: StudentsModuleProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<number>(students[0]?.id || 1);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // New Student Form State
  const [newFather, setNewFather] = useState<string>('');
  const [newMother, setNewMother] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newBirthdate, setNewBirthdate] = useState<string>('');
  const [newClassroom, setNewClassroom] = useState<string>(classrooms[0]?.name || 'Maternal A');
  const [newPin, setNewPin] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPaymentDate, setNewPaymentDate] = useState<string>('Día 05 de cada mes');
  const [newHasScholarship, setNewHasScholarship] = useState<boolean>(false);
  const [newScholarshipPercent, setNewScholarshipPercent] = useState<number>(0);
  const [newTrustedContacts, setNewTrustedContacts] = useState<string[]>(['']);
  const [notificationBanner, setNotificationBanner] = useState<string | null>(null);

  // Edit Student Form State
  const [editStudent, setEditStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const generateRandomPin = () => {
    const num = Math.floor(100000 + Math.random() * 900000).toString();
    return num;
  };

  const handleOpenNewModal = () => {
    setNewFather('');
    setNewMother('');
    setNewName('');
    setNewBirthdate('');
    setNewClassroom(classrooms[0]?.name || 'Maternal A');
    setNewPin(generateRandomPin());
    setNewEmail('');
    setNewPaymentDate('Día 05 de cada mes');
    setNewHasScholarship(false);
    setNewScholarshipPercent(0);
    setNewTrustedContacts(['']);
    setShowNewModal(true);
  };

  const handleAddTrustedContactRow = () => {
    setNewTrustedContacts((prev) => [...prev, '']);
  };

  const handleRemoveTrustedContactRow = (index: number) => {
    setNewTrustedContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTrustedContactChange = (index: number, val: string) => {
    setNewTrustedContacts((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleSubmitNewStudent = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPin.length !== 6 || isNaN(Number(newPin))) {
      alert('El PIN de seguridad debe tener exactamente 6 dígitos numéricos.');
      return;
    }

    const cleanTrusted = newTrustedContacts
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const docPayloads: { name: string; type: 'pdf' | 'img' }[] = [
      { name: `Acta_Nacimiento_${newName.replace(/\s+/g, '_')}.pdf`, type: 'pdf' },
      { name: `Comprobante_Domicilio_${newFather.split(' ')[0] || 'Padres'}.pdf`, type: 'pdf' },
    ];

    cleanTrusted.forEach((contact) => {
      docPayloads.push({
        name: `INE_${contact.split(' ')[0] || 'Familiar'}.jpg`,
        type: 'img',
      });
    });

    const studentData: Omit<Student, 'id'> = {
      name: newName.trim(),
      father: newFather.trim(),
      mother: newMother.trim(),
      trustedContacts: cleanTrusted,
      photo: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=300',
      securityPin: newPin.trim(),
      email: newEmail.trim(),
      birthdate: newBirthdate,
      enrollmentDate: new Date().toISOString().split('T')[0],
      paymentDate: newPaymentDate,
      hasScholarship: newHasScholarship,
      scholarshipPercent: newHasScholarship ? newScholarshipPercent : 0,
      classroom: newClassroom,
      delivered: false,
      lastActionTime: null,
      tuitionAmount: 3500 * (1 - (newHasScholarship ? newScholarshipPercent / 100 : 0)),
      tuitionStatus: 'Pendiente',
    };

    onAddStudent(studentData, docPayloads);
    setShowNewModal(false);

    setNotificationBanner(
      `¡Alumno(a) ${newName} dado de alta con éxito en SQL! Se ha enviado un correo de confirmación de registro y PIN (${newPin}) a: ${newEmail}.`
    );
    setTimeout(() => {
      setNotificationBanner(null);
    }, 6000);
  };

  const handleOpenEditModal = () => {
    if (!selectedStudent) return;
    setEditStudent({ ...selectedStudent });
    setShowEditModal(true);
  };

  const handleSubmitEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;

    if (editStudent.securityPin.length !== 6 || isNaN(Number(editStudent.securityPin))) {
      alert('El PIN de seguridad debe tener exactamente 6 dígitos numéricos.');
      return;
    }

    onUpdateStudent(editStudent);
    setShowEditModal(false);
  };

  const handleConfirmDelete = () => {
    if (!selectedStudent) return;
    onDeleteStudent(selectedStudent.id);
    setShowDeleteModal(false);
  };

  return (
    <div
      id="view-module-alumnos"
      className="w-full max-w-5xl bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[640px]"
    >
      {notificationBanner && (
        <div className="md:col-span-2 absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-50 border border-emerald-300 text-emerald-900 px-5 py-3 rounded-2xl shadow-lg text-xs font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{notificationBanner}</span>
        </div>
      )}

      {/* LEFT SIDEBAR: STUDENT LIST & SEARCH */}
      <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/50 flex flex-col shrink-0">
        {/* Top Button: Alta de Alumno */}
        <div className="p-3 border-b border-slate-200 bg-white">
          <button
            id="btn-alta-alumno"
            onClick={handleOpenNewModal}
            className="w-full py-2.5 px-3 bg-[#DCFCE7] hover:bg-[#bbf7d0] text-emerald-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-emerald-300 transition shadow-2xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-emerald-700" />
            Dar de Alta Niño/Alumno
          </button>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-slate-200 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-student-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              type="text"
              placeholder="Buscar alumno por nombre..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAF7F5] border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-pink-200 transition"
            />
          </div>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[240px] md:max-h-none">
          {filteredStudents.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">No hay alumnos coincidentes</p>
          ) : (
            filteredStudents.map((student) => {
              const isActive = student.id === selectedStudent?.id;
              return (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(student.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-left transition cursor-pointer ${
                    isActive
                      ? 'bg-[#FCE7F3]/80 border border-pink-300 text-pink-950 font-semibold shadow-2xs'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <img
                    src={student.photo}
                    alt={student.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="truncate">
                    <span className="block text-xs truncate leading-tight">{student.name}</span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">{student.classroom}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT PANEL: STUDENT DETAIL */}
      <section className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
        {selectedStudent ? (
          <div>
            {/* Header: Photo + Name + Room */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b border-slate-100">
              <img
                src={selectedStudent.photo}
                alt={selectedStudent.name}
                className="w-24 h-24 rounded-3xl object-cover border-4 border-[#FCE7F3] shadow-sm"
              />
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  {selectedStudent.name}
                </h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-sky-800">
                    {selectedStudent.classroom}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      selectedStudent.delivered
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-pink-100 text-pink-800'
                    }`}
                  >
                    {selectedStudent.delivered ? 'En Plantel' : 'Fuera del Plantel'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Expediente SQL Verificado
                  </span>
                </div>
              </div>
            </div>

            {/* Grid Information Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-6 text-xs">
              <div className="bg-[#FAF7F5] p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Padre de Familia</span>
                <span className="font-bold text-slate-800 text-sm">{selectedStudent.father}</span>
              </div>

              <div className="bg-[#FAF7F5] p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Madre de Familia</span>
                <span className="font-bold text-slate-800 text-sm">{selectedStudent.mother}</span>
              </div>

              <div className="bg-[#FAF7F5] p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">PIN de Seguridad (Recepción y Entrega)</span>
                <span className="font-mono font-bold text-pink-700 text-base tracking-widest">
                  {selectedStudent.securityPin}
                </span>
              </div>

              <div className="bg-[#FAF7F5] p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Fecha de Inscripción</span>
                <span className="font-bold text-slate-800 text-sm">{selectedStudent.enrollmentDate}</span>
              </div>

              <div className="bg-[#FAF7F5] p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Fecha de Pago de Colegiatura</span>
                <span className="font-bold text-slate-800 text-sm">{selectedStudent.paymentDate}</span>
              </div>

              <div className="bg-[#FAF7F5] p-3.5 rounded-2xl border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Beca y Descuento</span>
                <span
                  className={`font-bold text-sm ${
                    selectedStudent.hasScholarship ? 'text-emerald-700' : 'text-slate-600'
                  }`}
                >
                  {selectedStudent.hasScholarship
                    ? `Acreditada (${selectedStudent.scholarshipPercent}% de descuento)`
                    : 'Sin Beca asignada'}
                </span>
              </div>

              <div className="bg-[#FAF7F5] p-3.5 rounded-2xl border border-slate-100 sm:col-span-2">
                <span className="text-slate-400 block mb-1.5 font-medium">
                  Familiares de Confianza Autorizados
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.trustedContacts.length > 0 ? (
                    selectedStudent.trustedContacts.map((contact, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-pink-100/70 text-pink-900 rounded-lg text-xs font-medium"
                      >
                        {contact}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic text-xs">
                      Ningún familiar de confianza registrado
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-[#FAF7F5] p-3.5 rounded-2xl border border-slate-100 sm:col-span-2">
                <span className="text-slate-400 block mb-0.5">Correo para Notificación y PIN</span>
                <span className="font-medium text-slate-700 text-xs flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-pink-500" />
                  {selectedStudent.email || 'No registrado'}
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                id="btn-edit-student"
                onClick={handleOpenEditModal}
                className="px-4 py-2.5 bg-[#E0F2FE] hover:bg-sky-200 text-sky-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-sky-300 shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-sky-700" /> Edición de Información
              </button>
              <button
                id="btn-delete-student"
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
              >
                <UserMinus className="w-4 h-4" /> Baja de Alumno
              </button>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-slate-400 text-xs">
            Selecciona un alumno de la barra lateral o da de alta uno nuevo
          </div>
        )}
      </section>

      {/* MODAL: ALTA DE NIÑO / ALUMNO */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8 animate-scaleIn">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Alta de Niño / Alumno</h3>
                <p className="text-[11px] text-slate-400">
                  Ingresa los datos del alumno, familiares de confianza y documentación
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Nombre de Padre *</label>
                  <input
                    required
                    value={newFather}
                    onChange={(e) => setNewFather(e.target.value)}
                    type="text"
                    placeholder="Ej. Roberto Soto Alanís"
                    className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Nombre de Madre *</label>
                  <input
                    required
                    value={newMother}
                    onChange={(e) => setNewMother(e.target.value)}
                    type="text"
                    placeholder="Ej. Camila Martínez Vega"
                    className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Nombre del Niño(a) *</label>
                <input
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  type="text"
                  placeholder="Ej. Daniel Soto Martínez"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Fecha de Nacimiento *</label>
                  <input
                    required
                    value={newBirthdate}
                    onChange={(e) => setNewBirthdate(e.target.value)}
                    type="date"
                    className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Aula Asignada *</label>
                  <select
                    value={newClassroom}
                    onChange={(e) => setNewClassroom(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} (Capacidad: {c.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECCIÓN FAMILIARES DE CONFIANZA */}
              <div className="p-3.5 bg-pink-50/50 rounded-2xl border border-pink-100 space-y-2.5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-700 block text-xs">Familiares de Confianza</span>
                    <span className="text-[10px] text-slate-400">
                      Personas acreditadas para recoger al menor
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTrustedContactRow}
                    className="px-3 py-1.5 bg-[#FCE7F3] hover:bg-pink-200 text-pink-950 font-bold rounded-xl text-xs flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Añadir Familiar
                  </button>
                </div>

                <div className="space-y-2">
                  {newTrustedContacts.map((contact, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={contact}
                        onChange={(e) => handleTrustedContactChange(i, e.target.value)}
                        placeholder="Nombre completo y parentesco (Ej. Rosa Alanís - Abuela)"
                        className="flex-1 p-2 bg-white border border-pink-200 rounded-xl outline-none text-xs focus:ring-1 focus:ring-pink-300"
                      />
                      {newTrustedContacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTrustedContactRow(i)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Quitar familiar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ALTA DE DOCUMENTOS */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 block text-[11px] flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" /> Alta de Documentos del Expediente
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">
                      Acta o Certificado de Nacimiento
                    </label>
                    <input
                      type="file"
                      className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-[#FCE7F3] file:text-pink-900 hover:file:bg-pink-200 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">
                      Comprobante de Domicilio de Padres
                    </label>
                    <input
                      type="file"
                      className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-[#E0F2FE] file:text-sky-900 hover:file:bg-sky-200 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Dynamic INE per trusted contact */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    INE de Familiares de Confianza
                  </span>
                  {newTrustedContacts.filter((c) => c.trim().length > 0).length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic">
                      Registra familiares de confianza arriba para habilitar la carga de sus INEs.
                    </p>
                  ) : (
                    newTrustedContacts
                      .filter((c) => c.trim().length > 0)
                      .map((contact, i) => (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 bg-white rounded-xl border border-slate-200"
                        >
                          <span className="text-xs font-medium text-slate-700 truncate">
                            INE de: <strong>{contact}</strong>
                          </span>
                          <input
                            type="file"
                            className="text-[10px] text-slate-500 file:mr-2 file:py-0.5 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#FCE7F3] file:text-pink-900 hover:file:bg-pink-200 cursor-pointer"
                          />
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* PIN DE 6 DÍGITOS */}
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Configuración de PIN para recepción y entrega (6 dígitos) *
                </label>
                <div className="flex gap-2">
                  <input
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    type="text"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="Ej. 789123"
                    className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none font-mono font-bold tracking-widest text-pink-700 focus:ring-2 focus:ring-pink-200"
                  />
                  <button
                    type="button"
                    onClick={() => setNewPin(generateRandomPin())}
                    className="px-3.5 py-2 bg-[#F3E8FF] hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Generar PIN
                  </button>
                </div>
              </div>

              {/* CORREO DE PADRE O MADRE */}
              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Correo de Padre o Madre para Confirmación *
                </label>
                <input
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  type="email"
                  placeholder="padres@correo.com"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-200"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Al confirmar niño se envía un correo de confirmación de registro y PIN al correo registrado.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#DCFCE7] hover:bg-emerald-200 text-emerald-950 font-bold rounded-xl text-xs shadow-2xs transition cursor-pointer"
                >
                  Confirmar Niño y Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDICIÓN DE INFORMACIÓN DEL ALUMNO */}
      {showEditModal && editStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8 animate-scaleIn">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Edición de Información de Alumno</h3>
                <p className="text-[11px] text-slate-400">
                  Modifica los datos familiares, beca, familiares de confianza y seguridad
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Nombre del Niño(a) *</label>
                  <input
                    required
                    value={editStudent.name}
                    onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                    type="text"
                    className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Aula Asignada *</label>
                  <select
                    value={editStudent.classroom}
                    onChange={(e) => setEditStudent({ ...editStudent, classroom: e.target.value })}
                    className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Nombre de Padre *</label>
                  <input
                    required
                    value={editStudent.father}
                    onChange={(e) => setEditStudent({ ...editStudent, father: e.target.value })}
                    type="text"
                    className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Nombre de Madre *</label>
                  <input
                    required
                    value={editStudent.mother}
                    onChange={(e) => setEditStudent({ ...editStudent, mother: e.target.value })}
                    type="text"
                    className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Familiares de Confianza (separados por coma)
                </label>
                <input
                  type="text"
                  value={editStudent.trustedContacts.join(', ')}
                  onChange={(e) =>
                    setEditStudent({
                      ...editStudent,
                      trustedContacts: e.target.value.split(',').map((s) => s.trim()),
                    })
                  }
                  placeholder="Ej. Rosa Alanís (Abuela), Carlos Soto (Tío)"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">
                    PIN de Seguridad (6 dígitos) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      required
                      value={editStudent.securityPin}
                      onChange={(e) =>
                        setEditStudent({ ...editStudent, securityPin: e.target.value })
                      }
                      type="text"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none font-mono font-bold tracking-widest text-pink-700 focus:ring-2 focus:ring-blue-200"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditStudent({ ...editStudent, securityPin: generateRandomPin() })
                      }
                      className="px-3 py-1.5 bg-[#F3E8FF] hover:bg-purple-200 text-purple-900 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Generar
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Fecha de Pago *</label>
                  <input
                    required
                    value={editStudent.paymentDate}
                    onChange={(e) => setEditStudent({ ...editStudent, paymentDate: e.target.value })}
                    type="text"
                    className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Tiene Beca</label>
                  <select
                    value={editStudent.hasScholarship ? 'true' : 'false'}
                    onChange={(e) => {
                      const has = e.target.value === 'true';
                      setEditStudent({
                        ...editStudent,
                        hasScholarship: has,
                        scholarshipPercent: has ? (editStudent.scholarshipPercent || 15) : 0,
                      });
                    }}
                    className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="false">No</option>
                    <option value="true">Sí</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Porcentaje de Beca (%)</label>
                  <input
                    disabled={!editStudent.hasScholarship}
                    type="number"
                    min={0}
                    max={100}
                    value={editStudent.scholarshipPercent}
                    onChange={(e) =>
                      setEditStudent({
                        ...editStudent,
                        scholarshipPercent: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 bg-[#FAF7F5] disabled:opacity-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Correo de Notificación *</label>
                <input
                  required
                  value={editStudent.email}
                  onChange={(e) => setEditStudent({ ...editStudent, email: e.target.value })}
                  type="email"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E0F2FE] hover:bg-sky-200 text-sky-950 font-bold rounded-xl text-xs shadow-2xs transition cursor-pointer"
                >
                  Guardar Cambios (SQL)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BAJA DE ALUMNO (CONFIRMACIÓN) */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-rose-100 text-center animate-scaleIn">
            <div className="w-12 h-12 bg-rose-100 rounded-2xl mx-auto flex items-center justify-center text-rose-500 mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">Confirmar Baja de Alumno</h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              ¿Estás seguro de que deseas dar de baja definitiva a{' '}
              <strong className="text-slate-800">{selectedStudent.name}</strong>? Esta acción eliminará
              su registro y expediente de la base de datos SQL.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
