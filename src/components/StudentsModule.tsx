import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  QrCode,
  Edit2,
  Trash2,
  X,
  ShieldCheck,
  CreditCard,
  UserPlus,
  Phone,
} from 'lucide-react';
import { Student, Classroom, TrustedContactItem } from '../types.ts';
import { generateQrCryptoKey } from '../utils/qrSecurity.ts';
import QrPassModal from './QrPassModal.tsx';

interface StudentsModuleProps {
  students: Student[];
  classrooms: Classroom[];
  institutionName?: string;
  onAddStudent: (std: Omit<Student, 'id'>, docPayloads?: { name: string; type: 'pdf' | 'img' }[]) => Promise<void> | void;
  onUpdateStudent: (std: Student) => Promise<void> | void;
  onDeleteStudent: (id: number) => Promise<void> | void;
}

export default function StudentsModule({
  students,
  classrooms,
  institutionName = 'Kínder Creativo',
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
}: StudentsModuleProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClassroom, setSelectedClassroom] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentForQr, setSelectedStudentForQr] = useState<Student | null>(null);

  // Form State
  const [formName, setFormName] = useState<string>('');
  const [formAge, setFormAge] = useState<number>(3);
  const [formBloodType, setFormBloodType] = useState<string>('O+');
  const [formFather, setFormFather] = useState<string>('');
  const [formMother, setFormMother] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formEmergencyPhone, setFormEmergencyPhone] = useState<string>('');
  const [formClassroom, setFormClassroom] = useState<string>('');
  const [formPhoto, setFormPhoto] = useState<string>('');
  const [formPaymentDate, setFormPaymentDate] = useState<string>('5 de cada mes');
  const [formTuitionAmount, setFormTuitionAmount] = useState<number>(4800);
  const [formHasScholarship, setFormHasScholarship] = useState<boolean>(false);
  const [formScholarshipPercent, setFormScholarshipPercent] = useState<number>(0);
  const [formTrustedName, setFormTrustedName] = useState<string>('');
  const [formTrustedRelation, setFormTrustedRelation] = useState<string>('Abuelo/a');
  const [formTrustedPhone, setFormTrustedPhone] = useState<string>('');
  const [trustedList, setTrustedList] = useState<TrustedContactItem[]>([]);

  const openAddModal = () => {
    setEditingStudent(null);
    setFormName('');
    setFormAge(3);
    setFormBloodType('O+');
    setFormFather('');
    setFormMother('');
    setFormPhone('');
    setFormEmergencyPhone('');
    setFormClassroom(classrooms[0]?.name || 'Kínder 1');
    setFormPhoto('https://images.unsplash.com/photo-1543332164-6e82f355badc?w=200&auto=format&fit=crop&q=80');
    setFormPaymentDate('5 de cada mes');
    setFormTuitionAmount(4800);
    setFormHasScholarship(false);
    setFormScholarshipPercent(0);
    setTrustedList([]);
    setIsModalOpen(true);
  };

  const openEditModal = (std: Student) => {
    setEditingStudent(std);
    setFormName(std.name);
    setFormAge(std.age);
    setFormBloodType(std.bloodType);
    setFormFather(std.father);
    setFormMother(std.mother);
    setFormPhone(std.phone);
    setFormEmergencyPhone(std.emergencyPhone);
    setFormClassroom(std.classroom);
    setFormPhoto(std.photo);
    setFormPaymentDate(std.paymentDate);
    setFormTuitionAmount(std.tuitionAmount);
    setFormHasScholarship(std.hasScholarship);
    setFormScholarshipPercent(std.scholarshipPercent);
    setTrustedList(std.trustedFamilyList || []);
    setIsModalOpen(true);
  };

  const handleAddTrustedContact = () => {
    if (!formTrustedName.trim()) return;
    const key = generateQrCryptoKey('FAM', formName || 'ALUM');
    const newContact: TrustedContactItem = {
      name: formTrustedName.trim(),
      relation: formTrustedRelation,
      phone: formTrustedPhone.trim(),
      qrKey: key,
    };
    setTrustedList([...trustedList, newContact]);
    setFormTrustedName('');
    setFormTrustedPhone('');
  };

  const handleRemoveTrustedContact = (index: number) => {
    setTrustedList(trustedList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingStudent) {
      const updated: Student = {
        ...editingStudent,
        name: formName,
        age: formAge,
        bloodType: formBloodType,
        father: formFather,
        mother: formMother,
        phone: formPhone,
        emergencyPhone: formEmergencyPhone,
        classroom: formClassroom,
        photo: formPhoto,
        paymentDate: formPaymentDate,
        tuitionAmount: formTuitionAmount,
        hasScholarship: formHasScholarship,
        scholarshipPercent: formScholarshipPercent,
        trustedContacts: trustedList.map((t) => `${t.name} (${t.relation})`),
        trustedFamilyList: trustedList,
      };
      await onUpdateStudent(updated);
    } else {
      const parentKey = generateQrCryptoKey('PAR', formName);
      const newStd: Omit<Student, 'id'> = {
        name: formName,
        age: formAge,
        bloodType: formBloodType,
        father: formFather,
        mother: formMother,
        email: 'familia@colegio.edu.mx',
        birthdate: '2022-01-01',
        enrollmentDate: new Date().toISOString().split('T')[0],
        phone: formPhone,
        emergencyPhone: formEmergencyPhone,
        classroom: formClassroom,
        photo: formPhoto,
        delivered: false,
        lastActionTime: 'Sin registro',
        securityPin: '123456',
        paymentDate: formPaymentDate,
        tuitionStatus: 'Pendiente',
        tuitionAmount: formTuitionAmount,
        hasScholarship: formHasScholarship,
        scholarshipPercent: formScholarshipPercent,
        trustedContacts: trustedList.map((t) => `${t.name} (${t.relation})`),
        parentQrKey: parentKey,
        trustedFamilyList: trustedList,
      };
      await onAddStudent(newStd);
    }
    setIsModalOpen(false);
  };

  const filtered = students.filter((std) => {
    const matchSearch =
      std.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.father.toLowerCase().includes(searchTerm.toLowerCase()) ||
      std.mother.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (selectedClassroom !== 'all' && std.classroom !== selectedClassroom) return false;
    return true;
  });

  return (
    <div id="view-module-students" className="w-full max-w-5xl space-y-5">
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
              <Users className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wide">
              Expedientes de Alumnos
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            Directorio de Alumnos y Credenciales
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de datos médicos, tutores, familiares de confianza y emisión de códigos QR seguros.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Registrar Alumno
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nombre, padre o madre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-400/50"
          />
        </div>

        <select
          value={selectedClassroom}
          onChange={(e) => setSelectedClassroom(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none w-full sm:w-auto"
        >
          <option value="all">Todas las salas</option>
          {classrooms.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((std) => (
          <div
            key={std.id}
            className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs hover:border-sky-200 transition space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={std.photo}
                  alt={std.name}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=300';
                  }}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-2xs"
                />
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                      {std.classroom}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {std.age} años • {std.bloodType}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm mt-1">{std.name}</h3>
                  <p className="text-[11px] text-slate-400">ID Matrícula: #{std.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(std)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  title="Editar Alumno"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar al alumno ${std.name}?`)) {
                      onDeleteStudent(std.id);
                    }
                  }}
                  className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="Eliminar Alumno"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Guardians Info */}
            <div className="bg-[#FAF7F5] rounded-2xl p-3 border border-slate-200/60 text-xs space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Padres / Tutores:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                  {[std.father, std.mother].filter(Boolean).join(' / ') || 'No especificados'}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Teléfono Contacto:</span>
                <span className="font-mono text-slate-700">{std.phone || std.emergencyPhone || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200/60">
                <span className="text-slate-400">Colegiatura Mensual:</span>
                <span className="font-mono font-bold text-slate-800">
                  ${std.tuitionAmount.toLocaleString('es-MX')} MXN ({std.tuitionStatus})
                </span>
              </div>
            </div>

            {/* QR Pass Action */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {std.trustedFamilyList?.length ? `${std.trustedFamilyList.length} familiares autorizados` : 'Solo padres autorizados'}
                </span>
              </div>

              <button
                onClick={() => setSelectedStudentForQr(std)}
                className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-pink-200 transition cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                Ver Credencial QR
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-auto animate-scaleIn max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">
                {editingStudent ? 'Editar Expediente de Alumno' : 'Registrar Nuevo Alumno'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nombre Completo del Alumno:
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Sofía Morales Garza"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Edad (Años):</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    required
                    value={formAge}
                    onChange={(e) => setFormAge(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo de Sangre:</label>
                  <select
                    value={formBloodType}
                    onChange={(e) => setFormBloodType(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre del Padre:</label>
                  <input
                    type="text"
                    value={formFather}
                    onChange={(e) => setFormFather(e.target.value)}
                    placeholder="Ej. Jorge Morales"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre de la Madre:</label>
                  <input
                    type="text"
                    value={formMother}
                    onChange={(e) => setFormMother(e.target.value)}
                    placeholder="Ej. Carmen Garza"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Teléfono Principal:</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="81 1234 5678"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Teléfono de Emergencia:
                  </label>
                  <input
                    type="text"
                    value={formEmergencyPhone}
                    onChange={(e) => setFormEmergencyPhone(e.target.value)}
                    placeholder="81 9876 5432"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Aula Asignada:</label>
                  <select
                    value={formClassroom}
                    onChange={(e) => setFormClassroom(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {classrooms.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cuota Colegiatura ($ MXN):</label>
                  <input
                    type="number"
                    step="50"
                    value={formTuitionAmount}
                    onChange={(e) => setFormTuitionAmount(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Trusted Family Members Section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-slate-700 block">
                  Familiares Autorizados con Pase QR Adicional:
                </span>

                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <input
                    type="text"
                    placeholder="Nombre del familiar"
                    value={formTrustedName}
                    onChange={(e) => setFormTrustedName(e.target.value)}
                    className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                  />
                  <select
                    value={formTrustedRelation}
                    onChange={(e) => setFormTrustedRelation(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Abuelo/a">Abuelo/a</option>
                    <option value="Tío/a">Tío/a</option>
                    <option value="Hermano/a Mayor">Hermano/a Mayor</option>
                    <option value="Nana / Chofer">Nana / Chofer</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddTrustedContact}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>

                {trustedList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {trustedList.map((contact, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-2 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{contact.name}</span>
                          <span className="text-slate-400 text-[10px] ml-1.5">({contact.relation})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTrustedContact(idx)}
                          className="text-rose-500 hover:text-rose-700 text-xs cursor-pointer font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  {editingStudent ? 'Guardar Cambios' : 'Registrar Alumno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Pass Modal */}
      {selectedStudentForQr && (
        <QrPassModal
          student={selectedStudentForQr}
          isOpen={Boolean(selectedStudentForQr)}
          onClose={() => setSelectedStudentForQr(null)}
          institutionName={institutionName}
        />
      )}
    </div>
  );
}
