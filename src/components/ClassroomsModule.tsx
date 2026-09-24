import React, { useState } from 'react';
import { Building2, Plus, Users, User, X, Trash2 } from 'lucide-react';
import { Classroom, Student } from '../types.ts';

interface ClassroomsModuleProps {
  classrooms: Classroom[];
  students: Student[];
  onSaveClassroom: (room: Omit<Classroom, 'id'> & { id?: number }) => Promise<void> | void;
  onDeleteClassroom: (id: number) => Promise<void> | void;
}

export default function ClassroomsModule({
  classrooms,
  students,
  onSaveClassroom,
  onDeleteClassroom,
}: ClassroomsModuleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(20);
  const [color, setColor] = useState('#FCE7F3');
  const [ageRange, setAgeRange] = useState('3 a 4 años');
  const [teacherName, setTeacherName] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSaveClassroom({
      name: name.trim(),
      capacity,
      color,
      ageRange,
      teacherName,
    });
    setName('');
    setIsModalOpen(false);
  };

  return (
    <div id="view-module-classrooms" className="w-full max-w-5xl space-y-5">
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
              <Building2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
              Distribución de Salas
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Aulas y Grupos Escolares</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de salas pedagógicas, capacidad máxima y distribución de alumnos.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Nueva Sala / Aula
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classrooms.map((room) => {
          const enrolledStudents = students.filter((s) => s.classroom === room.name);
          const percent = Math.min(100, Math.round((enrolledStudents.length / room.capacity) * 100));

          return (
            <div
              key={room.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs hover:border-indigo-200 transition space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-800 font-extrabold text-sm shadow-2xs border border-black/5"
                    style={{ backgroundColor: room.color }}
                  >
                    {room.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{room.name}</h3>
                    <p className="text-xs text-slate-400 font-medium">{room.ageRange}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar la sala "${room.name}"?`)) {
                      onDeleteClassroom(room.id);
                    }
                  }}
                  className="p-1.5 text-slate-300 hover:text-rose-600 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress & Occupancy */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500">Ocupación de la Sala:</span>
                  <span className="text-slate-800 font-mono">
                    {enrolledStudents.length} / {room.capacity} alumnos ({percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Teacher */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Maestra Titular:
                </span>
                <span className="font-bold text-slate-800">{room.teacherName || 'Por asignar'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base">Crear Nueva Aula</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nombre del Aula:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Kínder 3 Bilingüe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Capacidad Máxima:</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rango de Edad:</label>
                  <input
                    type="text"
                    required
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Educadora Titular:</label>
                <input
                  type="text"
                  placeholder="Ej. Mtra. Sofía Garza"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white"
                />
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
                  Crear Aula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
