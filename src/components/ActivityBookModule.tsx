import { useState, useMemo } from 'react';
import {
  BookOpen,
  Calendar,
  Smile,
  Meh,
  Frown,
  Angry,
  CheckCircle2,
  Clock,
  UserCheck,
  Search,
  Filter,
  History,
  Printer,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
  CheckSquare,
  Square,
  AlertCircle,
  School,
  Baby,
} from 'lucide-react';
import { Student, Classroom, InstitutionSettings, ActivityLog, MoodType } from '../types.ts';

interface ActivityBookModuleProps {
  students: Student[];
  classrooms: Classroom[];
  settings: InstitutionSettings;
  activityLogs: ActivityLog[];
  onSaveLog: (log: Omit<ActivityLog, 'id'> & { id?: number }) => Promise<void>;
  onToggleAcknowledge: (studentId: number, date: string, acknowledgedBy: string) => Promise<void>;
}

export default function ActivityBookModule({
  students,
  classrooms,
  settings,
  activityLogs,
  onSaveLog,
  onToggleAcknowledge,
}: ActivityBookModuleProps) {
  // Current date in YYYY-MM-DD format
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [selectedStudentId, setSelectedStudentId] = useState<number>(students[0]?.id || 1);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClassroom, setSelectedClassroom] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'editor' | 'historial'>('editor');
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Selected Student
  const currentStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || students[0],
    [students, selectedStudentId]
  );

  // Filtered Students list for the student picker
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchClass = selectedClassroom === 'Todas' || s.classroom === selectedClassroom;
      const matchQuery =
        searchQuery.trim() === '' ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.classroom.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchQuery;
    });
  }, [students, selectedClassroom, searchQuery]);

  // Current log for selected student and date
  const currentLog = useMemo(() => {
    return (
      activityLogs.find(
        (l) => l.studentId === selectedStudentId && l.date === selectedDate
      ) || null
    );
  }, [activityLogs, selectedStudentId, selectedDate]);

  // Form states initialized with currentLog or defaults
  const [mood, setMood] = useState<MoodType>(currentLog?.mood || 'feliz');
  const [completedActivities, setCompletedActivities] = useState<string[]>(
    currentLog?.completedActivities || []
  );
  const [notes, setNotes] = useState<string>(currentLog?.notes || '');
  const [parentAcknowledged, setParentAcknowledged] = useState<boolean>(
    currentLog?.parentAcknowledged || false
  );
  const [signerName, setSignerName] = useState<string>('');

  // Sync state whenever student, date, or logs change
  const [prevSyncKey, setPrevSyncKey] = useState<string>(`${selectedStudentId}-${selectedDate}`);
  const currentSyncKey = `${selectedStudentId}-${selectedDate}`;

  if (prevSyncKey !== currentSyncKey) {
    setPrevSyncKey(currentSyncKey);
    setMood(currentLog?.mood || 'feliz');
    setCompletedActivities(currentLog?.completedActivities || []);
    setNotes(currentLog?.notes || '');
    setParentAcknowledged(currentLog?.parentAcknowledged || false);
    setSignerName(
      currentLog?.acknowledgedBy ||
        currentStudent?.mother ||
        currentStudent?.father ||
        'Tutor Legal'
    );
  }

  // Active activities list from settings with fallback
  const activityChecklist = useMemo(() => {
    if (settings.customActivities && settings.customActivities.length > 0) {
      return settings.customActivities;
    }
    return [
      'Comió toda su comida / porción',
      'Durmió siesta (sueño reparador)',
      'Fue al baño / control de esfínteres / cambio de pañal',
      'Participó en dinámicas, cantos y asamblea',
      'Hidratación adecuada (bebió agua)',
      'Juego al aire libre y estimulación motriz',
    ];
  }, [settings.customActivities]);

  // Student history logs (sorted latest to oldest)
  const studentHistory = useMemo(() => {
    return activityLogs
      .filter((l) => l.studentId === selectedStudentId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [activityLogs, selectedStudentId]);

  const toggleActivity = (item: string) => {
    setCompletedActivities((prev) =>
      prev.includes(item) ? prev.filter((a) => a !== item) : [...prev, item]
    );
  };

  const handleQuickAddNote = (text: string) => {
    setNotes((prev) => {
      const clean = prev.trim();
      return clean ? `${clean}. ${text}` : text;
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentStudent) return;
    setIsSaving(true);

    try {
      await onSaveLog({
        id: currentLog?.id,
        studentId: currentStudent.id,
        date: selectedDate,
        mood,
        completedActivities,
        notes: notes.trim(),
        parentAcknowledged,
        acknowledgedBy: parentAcknowledged
          ? signerName.trim() || currentStudent.mother || currentStudent.father || 'Tutor'
          : null,
        acknowledgedAt: parentAcknowledged
          ? currentLog?.acknowledgedAt ||
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : null,
      });

      setNotice(`Libreta de actividades de ${currentStudent.name} guardada exitosamente.`);
      setTimeout(() => setNotice(null), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAcknowledgeDirect = async () => {
    if (!currentStudent) return;
    const defaultSigner =
      signerName.trim() || currentStudent.mother || currentStudent.father || 'Tutor Autorizado';
    await onToggleAcknowledge(currentStudent.id, selectedDate, defaultSigner);
    setNotice(
      !parentAcknowledged
        ? `Reporte firmado como enterado por ${defaultSigner}.`
        : 'Estatus de firma revertido a pendiente.'
    );
    setTimeout(() => setNotice(null), 3500);
  };

  const handleShiftDate = (days: number) => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const moodOptions: {
    type: MoodType;
    label: string;
    description: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
    badge: string;
  }[] = [
    {
      type: 'feliz',
      label: 'Feliz',
      description: 'Alegre, sociable y participativo',
      icon: Smile,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 hover:bg-emerald-100',
      border: 'border-emerald-300',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    {
      type: 'neutral',
      label: 'Neutral',
      description: 'Tranquilo, sereno y adaptable',
      icon: Meh,
      color: 'text-sky-700',
      bg: 'bg-sky-50 hover:bg-sky-100',
      border: 'border-sky-300',
      badge: 'bg-sky-100 text-sky-800',
    },
    {
      type: 'lloroso',
      label: 'Lloroso',
      description: 'Sensible o nostálgico con llanto',
      icon: Frown,
      color: 'text-blue-700',
      bg: 'bg-blue-50 hover:bg-blue-100',
      border: 'border-blue-300',
      badge: 'bg-blue-100 text-blue-800',
    },
    {
      type: 'molesto',
      label: 'Molesto',
      description: 'Irritable, inquieto o con berrinche',
      icon: Angry,
      color: 'text-rose-700',
      bg: 'bg-rose-50 hover:bg-rose-100',
      border: 'border-rose-300',
      badge: 'bg-rose-100 text-rose-800',
    },
  ];

  const getMoodInfo = (m: MoodType) => {
    return moodOptions.find((o) => o.type === m) || moodOptions[0];
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="view-module-libreta" className="w-full max-w-6xl mx-auto space-y-5 animate-fadeIn">
      {notice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-2xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-2xs border border-amber-200 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Libreta de Actividades Diarias
            </h2>
            <p className="text-xs text-slate-500">
              Bitácora diaria escolar, estado de ánimo, rutinas y firma de enterado de tutores
            </p>
          </div>
        </div>

        {/* View Mode Tabs: Editor vs Historial */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'editor'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Reporte del Día</span>
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'historial'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-teal-600" />
              <span>Historial ({studentHistory.length})</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer print:hidden"
            title="Imprimir hoja de libreta"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unified Master-Detail Layout: Left Column (Student Selector) + Right Column (Fused Top Banner & Bottom Editor / Historial) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Student Selector Sidebar */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-4">
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Baby className="w-4 h-4 text-pink-500" /> Seleccionar Alumno
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {filteredStudents.length} alumnos
              </span>
            </div>

            {/* Classroom filter & search */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Buscar alumno..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-2.5 py-1.5 bg-[#FAF7F5] border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                </div>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="p-1.5 bg-[#FAF7F5] border border-slate-200 rounded-xl text-xs outline-none text-slate-700"
                >
                  <option value="Todas">Todas</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Students list with comfortable height for desktop sidebar */}
              <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-1">
                {filteredStudents.map((s) => {
                  const isSelected = s.id === selectedStudentId;
                  const studentTodayLog = activityLogs.find(
                    (l) => l.studentId === s.id && l.date === selectedDate
                  );

                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudentId(s.id)}
                      className={`w-full p-2.5 rounded-2xl flex items-center justify-between gap-2 transition text-left cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-50/90 border-amber-300 text-slate-900 shadow-2xs ring-1 ring-amber-200'
                          : 'bg-[#FAF7F5]/80 hover:bg-slate-100 border-transparent text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={s.photo}
                          alt={s.name}
                          className="w-8 h-8 rounded-full object-cover border border-white shrink-0 shadow-2xs"
                        />
                        <div className="truncate">
                          <span className="font-bold text-xs block truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {s.classroom}
                          </span>
                        </div>
                      </div>

                      {/* Indicator if student has log for selected date */}
                      {studentTodayLog ? (
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            studentTodayLog.parentAcknowledged ? 'bg-emerald-500' : 'bg-amber-400'
                          }`}
                          title={
                            studentTodayLog.parentAcknowledged
                              ? 'Reporte registrado y firmado por tutor'
                              : 'Reporte registrado (pendiente de firma)'
                          }
                        />
                      ) : (
                        <span
                          className="w-2 h-2 rounded-full bg-slate-300 shrink-0"
                          title="Sin reporte para esta fecha"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Unified Single Container for Active Student Header, Date Bar & Main Content */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden divide-y divide-slate-100">
          {/* Active Student & Date Controls Section */}
          <div className="p-5 sm:p-6 space-y-3.5">
            {/* Active Student Card */}
            {currentStudent && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-amber-50/80 via-white to-pink-50/70 rounded-2xl border border-amber-200/70">
                <div className="flex items-center gap-3">
                  <img
                    src={currentStudent.photo}
                    alt={currentStudent.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-2xs shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{currentStudent.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="inline-flex items-center gap-1 font-semibold text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full text-[11px]">
                        <School className="w-3 h-3" /> {currentStudent.classroom}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span>
                        Tutor:{' '}
                        <strong>{currentStudent.mother || currentStudent.father || 'Registrado'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Pill */}
                <div>
                  {currentLog ? (
                    currentLog.parentAcknowledged ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Firmado de enterado</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pendiente de firma</span>
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                      <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sin reporte para el día</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Date Selector with quick shortcuts */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleShiftDate(-1)}
                  className="p-1.5 bg-[#FAF7F5] hover:bg-slate-200 rounded-xl text-slate-600 transition cursor-pointer border border-slate-200"
                  title="Día anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5 bg-[#FAF7F5] border border-slate-200 px-3 py-1.5 rounded-xl">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent outline-none font-bold text-slate-800 cursor-pointer text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleShiftDate(1)}
                  className="p-1.5 bg-[#FAF7F5] hover:bg-slate-200 rounded-xl text-slate-600 transition cursor-pointer border border-slate-200"
                  title="Día siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedDate(todayStr)}
                  className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer border ${
                    selectedDate === todayStr
                      ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                      : 'bg-[#FAF7F5] text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const y = new Date();
                    y.setDate(y.getDate() - 1);
                    setSelectedDate(y.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 rounded-xl bg-[#FAF7F5] text-slate-600 border border-slate-200 hover:bg-slate-100 font-semibold transition cursor-pointer"
                >
                  Ayer
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: ACTIVITY EDITOR FORM (Divided into sections inside the single card) */}
          {activeTab === 'editor' && (
            <form onSubmit={handleSave} className="divide-y divide-slate-100">
              {/* SECTION 1: ESTADO DE ÁNIMO DEL DÍA */}
              <div className="p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Smile className="w-4 h-4 text-amber-500" /> 1. Estado de Ánimo Durante el Día
                    </h3>
                    <p className="text-xs text-slate-400">
                      Selecciona la actitud o emoción predominante del alumno hoy
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Seleccionado: <strong className="capitalize text-slate-800">{mood}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  {moodOptions.map((opt) => {
                    const IconComponent = opt.icon;
                    const isSelected = mood === opt.type;

                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => setMood(opt.type)}
                        className={`p-3.5 rounded-2xl border-2 flex flex-col items-center text-center gap-2 transition cursor-pointer relative ${
                          isSelected
                            ? `${opt.bg} ${opt.border} ring-2 ring-amber-300 shadow-xs`
                            : 'bg-[#FAF7F5] border-slate-200 hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-white shadow-2xs' : 'bg-slate-200/60'
                          }`}
                        >
                          <IconComponent
                            className={`w-7 h-7 ${isSelected ? opt.color : 'text-slate-500'}`}
                          />
                        </div>
                        <div>
                          <span className="font-bold text-xs block text-slate-800">{opt.label}</span>
                          <span className="text-[10px] text-slate-400 line-clamp-1">
                            {opt.description}
                          </span>
                        </div>

                        {isSelected && (
                          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: ACTIVIDADES DEL DÍA A DÍA (CHECKLIST PERSONALIZABLE) */}
              <div className="p-5 sm:p-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-600" /> 2. Actividades y Rutinas
                      Diarias Realizadas
                    </h3>
                    <p className="text-xs text-slate-400">
                      Marca las rutinas cumplidas hoy (personalizables desde el módulo de Ajustes)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
                      {completedActivities.length} de {activityChecklist.length} completadas
                    </span>
                    <button
                      type="button"
                      onClick={() => setCompletedActivities([...activityChecklist])}
                      className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold cursor-pointer underline"
                    >
                      Marcar todas
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {activityChecklist.map((act, index) => {
                    const isChecked = completedActivities.includes(act);

                    return (
                      <div
                        key={index}
                        onClick={() => toggleActivity(act)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 text-slate-800 shadow-2xs'
                            : 'bg-[#FAF7F5] border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="shrink-0">
                          {isChecked ? (
                            <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-lg border-2 border-slate-300 bg-white" />
                          )}
                        </div>
                        <span className="text-xs font-semibold leading-tight">{act}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 3: CAMPO DE TEXTO - COMPORTAMIENTO Y OBSERVACIONES */}
              <div className="p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" /> 3. Comportamiento y Observaciones
                      del Niño
                    </h3>
                    <p className="text-xs text-slate-400">
                      Describe detalles relevantes sobre su interacción, estado de ánimo o cuidados
                      especiales
                    </p>
                  </div>
                </div>

                {/* Quick Note suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">Atajos rápidos:</span>
                  {[
                    'Comió con mucho apetito',
                    'Durmió siesta profunda y tranquila',
                    'Muy participativo y colaborativo',
                    'Compartió juguetes amablemente',
                    'Lloró un poco al llegar pero se integró rápido',
                    'Se le administró medicamento indicado',
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleQuickAddNote(suggestion)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-[11px] font-medium transition cursor-pointer border border-slate-200"
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>

                <div>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ejemplo: Luca estuvo muy alegre durante la asamblea. Participó cantando las canciones de la mañana, comió toda su fruta con gusto y compartió sus bloques de madera con sus compañeros..."
                    className="w-full p-3.5 bg-[#FAF7F5] border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-purple-200 text-xs text-slate-800 leading-relaxed font-normal resize-y"
                  />
                </div>
              </div>

              {/* SECTION 4: ENTERADO Y FIRMA DEL PADRE/MADRE/TUTOR */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between pb-2 border-b border-slate-100 gap-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-teal-600" /> 4. Indicador de Enterado / Firma
                      de Tutores
                    </h3>
                    <p className="text-xs text-slate-400">
                      Confirmación de lectura y aceptación del reporte diario por parte de los padres
                    </p>
                  </div>

                  {parentAcknowledged ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reporte Declarado como Enterado</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-600 font-semibold text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Aún no firmado por el tutor</span>
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F5] border border-slate-200/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Nombre del Padre, Madre o Tutor que declara enterado:
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          placeholder="Ej. Roberto Soto Alanís (Padre)"
                          className="p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-teal-200 font-semibold text-slate-800 w-64"
                        />

                        {/* Quick presets for parents */}
                        {currentStudent && (
                          <div className="flex items-center gap-1">
                            {currentStudent.father && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSignerName(`${currentStudent.father} (Padre)`)
                                }
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                              >
                                Papá: {currentStudent.father.split(' ')[0]}
                              </button>
                            )}
                            {currentStudent.mother && (
                              <button
                                type="button"
                                onClick={() =>
                                  setSignerName(`${currentStudent.mother} (Madre)`)
                                }
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold transition cursor-pointer"
                              >
                                Mamá: {currentStudent.mother.split(' ')[0]}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Direct Toggle Button for Acknowledge */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setParentAcknowledged(!parentAcknowledged);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer border shadow-2xs ${
                          parentAcknowledged
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white hover:bg-teal-50 text-teal-800 border-teal-300'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>
                          {parentAcknowledged ? 'Enterado Confirmado ✓' : 'Marcar como Enterado'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {parentAcknowledged && currentLog?.acknowledgedAt && (
                    <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1 pt-1 border-t border-slate-200/60">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>
                        Firma registrada a las <strong>{currentLog.acknowledgedAt}</strong> por{' '}
                        <strong>{currentLog.acknowledgedBy || signerName}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* BOTTOM ACTIONS BAR */}
              <div className="p-5 sm:p-6 bg-[#FAF7F5]/50 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  Los cambios se guardan y vacían automáticamente en el historial de {selectedDate}.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-2xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Guardando...' : 'Guardar Libreta Diaria'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: HISTORIAL DE DÍAS ANTERIORES */}
          {activeTab === 'historial' && (
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <History className="w-4 h-4 text-teal-600" /> Historial de Libretas: {currentStudent?.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Consulta los reportes diarios de días anteriores y su estado de firma
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('editor')}
                  className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-700" /> Crear o editar reporte
                </button>
              </div>

              {studentHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-600">No hay reportes previos registrados</p>
                  <p className="text-[11px] mt-1">
                    Completa el reporte de hoy desde la pestaña &quot;Reporte del Día&quot;.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentHistory.map((item) => {
                    const moodInfo = getMoodInfo(item.mood);
                    const MoodIcon = moodInfo.icon;

                    return (
                      <div
                        key={item.id || item.date}
                        className="p-4 rounded-2xl bg-[#FAF7F5] border border-slate-200 hover:border-slate-300 transition space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              {item.date} {item.date === todayStr && '(Hoy)'}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${moodInfo.badge}`}
                            >
                              <MoodIcon className="w-3 h-3" />
                              {moodInfo.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.parentAcknowledged ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Firmado de enterado</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Pendiente de firma</span>
                              </span>
                            )}

                            <button
                              onClick={() => {
                                setSelectedDate(item.date);
                                setActiveTab('editor');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Ver / Editar
                            </button>
                          </div>
                        </div>

                        {/* Completed activities pills */}
                        {item.completedActivities && item.completedActivities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.completedActivities.map((act, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 text-[11px] font-medium"
                              >
                                ✓ {act}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Notes */}
                        {item.notes && (
                          <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 italic">
                            &quot;{item.notes}&quot;
                          </p>
                        )}

                        {/* Parent signature info */}
                        {item.parentAcknowledged && item.acknowledgedBy && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            Firmado por: <strong>{item.acknowledgedBy}</strong>{' '}
                            {item.acknowledgedAt && `(${item.acknowledgedAt})`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
