import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  X,
  Search,
  School,
  AlertCircle,
} from 'lucide-react';
import { Classroom, Student } from '../types.ts';

interface ClassroomsModuleProps {
  classrooms: Classroom[];
  students: Student[];
  onSaveClassroom: (room: Omit<Classroom, 'id'> & { id?: number }) => void;
  onDeleteClassroom: (id: number) => void;
  onAssignStudentToRoom: (studentId: number, roomName: string) => void;
  onRemoveStudentFromRoom: (studentId: number) => void;
}

export default function ClassroomsModule({
  classrooms,
  students,
  onSaveClassroom,
  onDeleteClassroom,
  onAssignStudentToRoom,
  onRemoveStudentFromRoom,
}: ClassroomsModuleProps) {
  // Modal: Create/Edit Room
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
  const [editingRoom, setEditingRoom] = useState<Classroom | null>(null);
  const [roomName, setRoomName] = useState<string>('');
  const [roomCapacity, setRoomCapacity] = useState<number>(15);
  const [roomDesc, setRoomDesc] = useState<string>('');

  // Modal: Add Student to Classroom
  const [targetRoom, setTargetRoom] = useState<Classroom | null>(null);
  const [candidateSearch, setCandidateSearch] = useState<string>('');

  const handleOpenCreateModal = () => {
    setEditingRoom(null);
    setRoomName('');
    setRoomCapacity(15);
    setRoomDesc('');
    setShowRoomModal(true);
  };

  const handleOpenEditModal = (room: Classroom) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setRoomCapacity(room.capacity);
    setRoomDesc(room.description);
    setShowRoomModal(true);
  };

  const handleSaveRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim() || roomCapacity < 1) {
      alert('Por favor introduce un nombre válido y un cupo mayor a 0.');
      return;
    }
    onSaveClassroom({
      id: editingRoom?.id,
      name: roomName.trim(),
      capacity: Number(roomCapacity),
      description: roomDesc.trim(),
    });
    setShowRoomModal(false);
  };

  const handleDeleteRoom = (room: Classroom) => {
    if (confirm(`¿Confirmas la eliminación del aula "${room.name}" de la base de datos SQL?`)) {
      onDeleteClassroom(room.id);
    }
  };

  const filteredCandidates = targetRoom
    ? students.filter((s) =>
        s.name.toLowerCase().includes(candidateSearch.toLowerCase().trim())
      )
    : [];

  return (
    <div id="view-module-aulas" className="w-full max-w-5xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <School className="w-5 h-5 text-amber-500" /> Administración de Aulas
          </h2>
          <p className="text-xs text-slate-500">
            Gestión de salas, cupo total de niños, descripción y alumnos presentes
          </p>
        </div>
        <button
          id="btn-crear-aula"
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-[#DCFCE7] hover:bg-emerald-200 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer border border-emerald-300"
        >
          <Plus className="w-4 h-4 text-emerald-800" /> Crear Aula
        </button>
      </div>

      {/* Classroom Cards */}
      <div className="grid grid-cols-1 gap-5">
        {classrooms.map((room) => {
          const studentsInRoom = students.filter((s) => s.classroom === room.name);
          const occupied = studentsInRoom.length;
          const percent = Math.min(100, Math.round((occupied / room.capacity) * 100));
          const isFull = occupied >= room.capacity;

          return (
            <div
              key={room.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col gap-4"
            >
              {/* Card Header & Controls */}
              <div>
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                      {room.name}
                      {isFull && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                          Cupo Lleno
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{room.description}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(room)}
                      className="p-1.5 hover:bg-[#E0F2FE] rounded-lg text-sky-700 transition cursor-pointer"
                      title="Editar Aula"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(room)}
                      className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-500 transition cursor-pointer"
                      title="Eliminar Aula"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Meter: Control de cupo total de niños */}
                <div className="bg-[#FAF7F5] p-3 rounded-2xl border border-slate-100 my-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      Control de Cupo Total: <strong>{occupied} de {room.capacity} niños</strong>
                    </span>
                    <span className={isFull ? 'text-rose-500 font-bold' : 'text-slate-600 font-mono'}>
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull
                          ? 'bg-rose-400'
                          : percent > 75
                          ? 'bg-amber-400'
                          : 'bg-[#4ADE80]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Present Students List & Add Student Button */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-500" />
                    Alumnos Presentes en el Aula ({occupied})
                  </span>
                  <button
                    onClick={() => {
                      setTargetRoom(room);
                      setCandidateSearch('');
                    }}
                    disabled={isFull}
                    className="px-3 py-1.5 bg-[#E0F2FE] hover:bg-sky-200 disabled:opacity-50 text-sky-950 font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-2xs cursor-pointer border border-sky-300"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-sky-700" />
                    Añadir Alumno a Aula
                  </button>
                </div>

                {studentsInRoom.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No hay alumnos asignados a esta aula actualmente.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {studentsInRoom.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <img
                            src={child.photo}
                            alt={child.name}
                            className="w-7 h-7 rounded-full object-cover border border-slate-100 shrink-0"
                          />
                          <span className="text-xs font-medium text-slate-700 truncate">
                            {child.name}
                          </span>
                        </div>
                        <button
                          onClick={() => onRemoveStudentFromRoom(child.id)}
                          className="p-1 text-slate-300 hover:text-rose-500 rounded transition shrink-0 cursor-pointer"
                          title="Quitar de esta aula"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: CREAR / EDITAR AULA */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scaleIn">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              {editingRoom ? 'Editar Aula' : 'Nueva Aula'}
            </h3>

            <form onSubmit={handleSaveRoomSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-600 mb-1">Nombre del Aula *</label>
                <input
                  required
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ej. Maternal B"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-200 font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">
                  Control de Cupo Total de Niños *
                </label>
                <input
                  required
                  type="number"
                  min={1}
                  max={50}
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(Number(e.target.value))}
                  placeholder="15"
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 mb-1">Descripción del Aula</label>
                <textarea
                  rows={3}
                  value={roomDesc}
                  onChange={(e) => setRoomDesc(e.target.value)}
                  placeholder="Descripción de actividades pedagógicas, equipo y áreas de estimulación..."
                  className="w-full p-2.5 bg-[#FAF7F5] border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#DCFCE7] hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer border border-emerald-300"
                >
                  Guardar Aula (SQL)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AÑADIR ALUMNO A AULA (CON BUSCADOR) */}
      {targetRoom && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">Añadir Alumno al Aula</h3>
                <p className="text-[11px] text-slate-400">
                  Aula destino: <strong className="text-slate-700">{targetRoom.name}</strong> (Cupo:{' '}
                  {students.filter((s) => s.classroom === targetRoom.name).length} / {targetRoom.capacity})
                </p>
              </div>
              <button
                onClick={() => setTargetRoom(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Candidate search input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Buscar niño por nombre..."
                className="w-full pl-9 pr-3 py-2 bg-[#FAF7F5] border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>

            {/* List of candidates */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs mb-4">
              {filteredCandidates.length === 0 ? (
                <p className="text-slate-400 text-center py-6">No se encontraron niños.</p>
              ) : (
                filteredCandidates.map((child) => {
                  const isAlreadyIn = child.classroom === targetRoom.name;
                  const currentRoomCount = students.filter(
                    (s) => s.classroom === targetRoom.name
                  ).length;
                  const roomIsFull = currentRoomCount >= targetRoom.capacity;

                  return (
                    <div
                      key={child.id}
                      className="flex items-center justify-between py-2.5 px-2 hover:bg-slate-50 rounded-xl transition"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <img
                          src={child.photo}
                          alt={child.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div className="truncate">
                          <span className="block font-bold text-slate-800 text-xs truncate">
                            {child.name}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            Aula actual: {child.classroom}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (roomIsFull) {
                            alert(`El aula "${targetRoom.name}" ya alcanzó su cupo máximo.`);
                            return;
                          }
                          onAssignStudentToRoom(child.id, targetRoom.name);
                        }}
                        disabled={isAlreadyIn || roomIsFull}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isAlreadyIn
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : roomIsFull
                            ? 'bg-slate-100 text-rose-400 cursor-not-allowed'
                            : 'bg-[#DCFCE7] hover:bg-emerald-200 text-emerald-950 shadow-2xs'
                        }`}
                      >
                        {isAlreadyIn ? 'Ya Asignado' : 'Asignar'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setTargetRoom(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
