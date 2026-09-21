import { useState } from 'react';
import { GraduationCap, Plus, Phone, School, X, CheckCircle2 } from 'lucide-react';
import { Teacher, Classroom } from '../types.ts';

interface TeachersModuleProps {
  teachers: Teacher[];
  classrooms: Classroom[];
  onAddTeacher: (t: Omit<Teacher, 'id'>) => void;
}

export default function TeachersModule({
  teachers,
  classrooms,
  onAddTeacher,
}: TeachersModuleProps) {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [classroom, setClassroom] = useState<string>(classrooms[0]?.name || 'Maternal A');
  const [phone, setPhone] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('');
  const [photo, setPhoto] = useState<string>('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200');
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddTeacher({
      name: name.trim(),
      classroom,
      phone: phone.trim() || '+52 55 0000 0000',
      specialty: specialty.trim() || 'Educación Inicial',
      photo: photo.trim(),
    });

    setShowModal(false);
    setName('');
    setPhone('');
    setSpecialty('');
    setNotice(`Profesor(a) ${name} dado de alta con éxito en la base de datos SQL.`);
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div id="view-module-profesores" className="w-full max-w-5xl space-y-5">
      {notice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-2xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
            Directorio de profesoras, educadoras y puericultistas por aula
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
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
            className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center justify-between gap-3 hover:shadow-xs transition"
          >
            <img
              src={t.photo}
              alt={t.name}
              className="w-20 h-20 rounded-full object-cover border-3 border-[#DCFCE7] shadow-2xs my-1"
            />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{t.name}</h3>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-full mt-1">
                <School className="w-3 h-3" /> Aula: {t.classroom}
              </span>
              <p className="text-xs text-slate-500 mt-2 font-medium">{t.specialty}</p>
            </div>
            <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-500">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono">{t.phone}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL ALTA DE PROFESOR */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-slate-800">Alta de Profesor(a)</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Nombre Completo *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Lic. Laura Gutiérrez"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Aula Asignada *</label>
                <select
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
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
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej. Psicología Infantil y Psicomotricidad"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +52 55 1234 5678"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">URL de Foto de Perfil</label>
                <input
                  type="text"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#DCFCE7] hover:bg-emerald-200 text-emerald-950 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer border border-emerald-300"
                >
                  Guardar en SQL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
