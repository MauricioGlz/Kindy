import { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Phone,
  School,
  X,
  CheckCircle2,
  Pencil,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { Teacher, Classroom } from '../types.ts';

interface TeachersModuleProps {
  teachers: Teacher[];
  classrooms: Classroom[];
  onAddTeacher: (t: Omit<Teacher, 'id'>) => void;
  onUpdateTeacher: (t: Teacher) => void;
  onDeleteTeacher?: (id: number) => void;
}

export default function TeachersModule({
  teachers,
  classrooms,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
}: TeachersModuleProps) {
  // Modal de Alta
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newClassroom, setNewClassroom] = useState<string>(classrooms[0]?.name || 'Maternal A');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newSpecialty, setNewSpecialty] = useState<string>('');
  const [newPhoto, setNewPhoto] = useState<string>(
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200'
  );

  // Modal de Edición
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editClassroom, setEditClassroom] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editSpecialty, setEditSpecialty] = useState<string>('');
  const [editPhoto, setEditPhoto] = useState<string>('');

  const [notice, setNotice] = useState<string | null>(null);

  // Abrir modal de edición con los datos del profesor seleccionado
  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setEditName(t.name);
    setEditClassroom(t.classroom);
    setEditPhone(t.phone);
    setEditSpecialty(t.specialty);
    setEditPhoto(t.photo);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onAddTeacher({
      name: newName.trim(),
      classroom: newClassroom,
      phone: newPhone.trim() || '+52 55 0000 0000',
      specialty: newSpecialty.trim() || 'Educación Inicial',
      photo: newPhoto.trim() || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    });

    setShowAddModal(false);
    setNewName('');
    setNewPhone('');
    setNewSpecialty('');
    setNotice(`Profesor(a) ${newName} dado(a) de alta con éxito.`);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editName.trim()) return;

    const updatedTeacher: Teacher = {
      ...editingTeacher,
      name: editName.trim(),
      classroom: editClassroom.trim() || classrooms[0]?.name || 'Maternal A',
      phone: editPhone.trim() || '+52 55 0000 0000',
      specialty: editSpecialty.trim() || 'Educación Inicial',
      photo: editPhoto.trim() || editingTeacher.photo,
    };

    onUpdateTeacher(updatedTeacher);
    setEditingTeacher(null);
    setNotice(`Datos de ${updatedTeacher.name} actualizados correctamente.`);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleDelete = (t: Teacher) => {
    if (!onDeleteTeacher) return;
    if (confirm(`¿Estás seguro de dar de baja al profesor(a) "${t.name}"?`)) {
      onDeleteTeacher(t.id);
      setNotice(`Profesor(a) ${t.name} removido(a) de la plantilla.`);
      setTimeout(() => setNotice(null), 3500);
    }
  };

  return (
    <div id="view-module-profesores" className="w-full max-w-5xl space-y-5">
      {notice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-2xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-600" /> Plantilla Docente y Educadoras
          </h2>
          <p className="text-xs text-slate-500">
            Directorio y gestión del personal educativo, educadoras y puericultistas
          </p>
        </div>
        <button
          id="btn-add-teacher"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#DCFCE7] hover:bg-emerald-200 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer border border-emerald-300"
        >
          <Plus className="w-4 h-4 text-emerald-800" /> Alta de Profesor(a)
        </button>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {teachers.map((t) => (
          <div
            key={t.id}
            id={`teacher-card-${t.id}`}
            className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center justify-between gap-3 hover:shadow-xs transition relative group"
          >
            {/* Action buttons at top right */}
            <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
              <button
                type="button"
                id={`btn-edit-teacher-${t.id}`}
                onClick={() => handleOpenEdit(t)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-teal-700 border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
                title={`Editar datos de ${t.name}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              {onDeleteTeacher && (
                <button
                  type="button"
                  onClick={() => handleDelete(t)}
                  className="p-1.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-xl transition cursor-pointer shadow-2xs"
                  title={`Eliminar profesor(a) ${t.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <img
              src={t.photo}
              alt={t.name}
              onError={(e) => {
                // Fallback avatar if URL is invalid
                (e.currentTarget as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200';
              }}
              className="w-20 h-20 rounded-full object-cover border-3 border-[#DCFCE7] shadow-2xs my-1"
            />
            <div className="w-full px-2">
              <h3 className="font-bold text-slate-800 text-sm truncate" title={t.name}>
                {t.name}
              </h3>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full mt-1.5">
                <School className="w-3 h-3" /> Aula: {t.classroom}
              </span>
              <p className="text-xs text-slate-500 mt-2 font-medium line-clamp-2">
                {t.specialty}
              </p>
            </div>

            <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-500 truncate">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-[11px] truncate">{t.phone}</span>
              </div>

              {/* Botón explícito para editar los datos */}
              <button
                type="button"
                onClick={() => handleOpenEdit(t)}
                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
              >
                <Pencil className="w-3 h-3" /> Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL ALTA DE PROFESOR */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-600" /> Alta de Profesor(a)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Nombre Completo *</label>
                <input
                  required
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Lic. Laura Gutiérrez"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Aula Asignada *</label>
                <select
                  value={newClassroom}
                  onChange={(e) => setNewClassroom(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Especialidad / Cargo</label>
                <input
                  type="text"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                  placeholder="Ej. Psicología Infantil y Psicomotricidad"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Ej. +52 55 1234 5678"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">URL de Foto de Perfil</label>
                <input
                  type="text"
                  value={newPhoto}
                  onChange={(e) => setNewPhoto(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#DCFCE7] hover:bg-emerald-200 text-emerald-950 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer border border-emerald-300"
                >
                  Registrar Profesor(a)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR DATOS DEL PROFESOR */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-teal-600" /> Editar Datos del Profesor(a)
              </h3>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatar Preview */}
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-3">
              <img
                src={editPhoto || editingTeacher.photo}
                alt={editName || 'Profesor'}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200';
                }}
                className="w-12 h-12 rounded-full object-cover border-2 border-teal-300 shrink-0"
              />
              <div className="min-w-0">
                <span className="font-bold text-slate-800 text-xs block truncate">
                  {editName || 'Nombre del Profesor'}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  Aula: {editClassroom || 'Sin asignar'}
                </span>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Nombre Completo *</label>
                <input
                  required
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Ej. Lic. Laura Gutiérrez"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-200 font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Aula Asignada *</label>
                <select
                  value={editClassroom}
                  onChange={(e) => setEditClassroom(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none text-slate-800"
                >
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Especialidad / Cargo</label>
                <input
                  type="text"
                  value={editSpecialty}
                  onChange={(e) => setEditSpecialty(e.target.value)}
                  placeholder="Ej. Psicología Infantil y Estimulación"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="Ej. +52 55 1234 5678"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1 flex items-center justify-between">
                  <span>URL de Foto de Perfil</span>
                  <span className="text-[10px] text-slate-400">Enlace directo</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editPhoto}
                    onChange={(e) => setEditPhoto(e.target.value)}
                    className="w-full p-2.5 pl-8 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none font-mono text-[11px] text-slate-800"
                  />
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
