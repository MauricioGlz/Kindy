import { useState, useEffect } from 'react';
import {
  initSqlDatabase,
  sqlGetStudents,
  sqlGetClassrooms,
  sqlGetEmployees,
  sqlGetTeachers,
  sqlGetDocuments,
  sqlGetAttendanceLogs,
  sqlGetSettings,
  sqlAddStudent,
  sqlUpdateStudent,
  sqlDeleteStudent,
  sqlRecordStudentAction,
  sqlSaveClassroom,
  sqlDeleteClassroom,
  sqlAssignStudentClassroom,
  sqlToggleTuitionStatus,
  sqlPayTuition,
  sqlAddDocument,
  sqlAddTeacher,
  sqlUpdateSettings,
  sqlAddEmployee,
  sqlDeleteEmployee,
  sqlResetDatabase,
} from './db/sqlEngine.ts';
import {
  Student,
  Classroom,
  Employee,
  Teacher,
  DocumentItem,
  AttendanceLog,
  InstitutionSettings,
  ModuleKey,
} from './types.ts';

import LoginScreen from './components/LoginScreen.tsx';
import TopNavbar from './components/TopNavbar.tsx';
import ModuleSelector from './components/ModuleSelector.tsx';
import StudentsModule from './components/StudentsModule.tsx';
import DeliveryModule from './components/DeliveryModule.tsx';
import ClassroomsModule from './components/ClassroomsModule.tsx';
import AccountingModule from './components/AccountingModule.tsx';
import ColegiaturasModule from './components/ColegiaturasModule.tsx';
import DocumentsModule from './components/DocumentsModule.tsx';
import TeachersModule from './components/TeachersModule.tsx';
import SettingsModule from './components/SettingsModule.tsx';
import SqlConsoleModal from './components/SqlConsoleModal.tsx';
import { ArrowLeft, Database, Loader2 } from 'lucide-react';

export default function App() {
  const [dbLoading, setDbLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // App Navigation State
  const [currentView, setCurrentView] = useState<'login' | 'modules' | ModuleKey>('login');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);

  // Live Data loaded from SQLite
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [settings, setSettings] = useState<InstitutionSettings>({
    name: 'Kinder Creativo',
    logoUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=160',
    bannerUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1200&q=80',
    homeBgUrl: '',
    loginBgUrl: '',
  });

  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);

  // Initialize and reload SQLite Database
  const reloadDataFromSql = async () => {
    try {
      const [s, c, e, t, d, a, st] = await Promise.all([
        sqlGetStudents(),
        sqlGetClassrooms(),
        sqlGetEmployees(),
        sqlGetTeachers(),
        sqlGetDocuments(),
        sqlGetAttendanceLogs(),
        sqlGetSettings(),
      ]);
      setStudents(s);
      setClassrooms(c);
      setEmployees(e);
      setTeachers(t);
      setDocuments(d);
      setAttendanceLogs(a);
      setSettings(st);
    } catch (e: any) {
      console.error('Error reading from SQLite:', e);
    }
  };

  useEffect(() => {
    initSqlDatabase()
      .then(async () => {
        await reloadDataFromSql();
        setDbLoading(false);
      })
      .catch((err) => {
        console.error('Failed to initialize SQLite database:', err);
        setDbError('No se pudo inicializar la base de datos SQL. Recarga la página.');
        setDbLoading(false);
      });
  }, []);

  // Handlers
  const handleLoginSuccess = (emp: Employee) => {
    setCurrentUser(emp);
    setCurrentView('modules');
  };

  const handleDirectDeliveryAccess = () => {
    setCurrentUser(null);
    setCurrentView('entregas');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  const handleAddStudent = async (
    std: Omit<Student, 'id'>,
    docPayloads: { name: string; type: 'pdf' | 'img' }[]
  ) => {
    await sqlAddStudent(std, docPayloads);
    await reloadDataFromSql();
  };

  const handleUpdateStudent = async (std: Student) => {
    await sqlUpdateStudent(std);
    await reloadDataFromSql();
  };

  const handleDeleteStudent = async (id: number) => {
    await sqlDeleteStudent(id);
    await reloadDataFromSql();
  };

  const handleRecordAction = async (
    student: Student,
    actionType: 'recepcion' | 'entrega',
    timeStr: string,
    dateStr: string
  ) => {
    await sqlRecordStudentAction(student, actionType, timeStr, dateStr);
    await reloadDataFromSql();
  };

  const handleSaveClassroom = async (room: Omit<Classroom, 'id'> & { id?: number }) => {
    await sqlSaveClassroom(room);
    await reloadDataFromSql();
  };

  const handleDeleteClassroom = async (id: number) => {
    await sqlDeleteClassroom(id);
    await reloadDataFromSql();
  };

  const handleAssignStudentToRoom = async (studentId: number, roomName: string) => {
    await sqlAssignStudentClassroom(studentId, roomName);
    await reloadDataFromSql();
  };

  const handleRemoveStudentFromRoom = async (studentId: number) => {
    await sqlAssignStudentClassroom(studentId, 'Sin Aula');
    await reloadDataFromSql();
  };

  const handleToggleTuitionStatus = async (studentId: number) => {
    await sqlToggleTuitionStatus(studentId);
    await reloadDataFromSql();
  };

  const handlePayTuition = async (
    studentId: number,
    method: 'transferencia' | 'tarjeta',
    _amount: number
  ) => {
    await sqlPayTuition(studentId, method);
    await reloadDataFromSql();
  };

  const handleUploadDocument = async (doc: Omit<DocumentItem, 'id'>) => {
    await sqlAddDocument(doc);
    await reloadDataFromSql();
  };

  const handleAddTeacher = async (teacher: Omit<Teacher, 'id'>) => {
    await sqlAddTeacher(teacher);
    await reloadDataFromSql();
  };

  const handleUpdateSettings = async (newSettings: InstitutionSettings) => {
    await sqlUpdateSettings(newSettings);
    await reloadDataFromSql();
  };

  const handleAddEmployee = async (emp: Omit<Employee, 'id'>) => {
    await sqlAddEmployee(emp);
    await reloadDataFromSql();
  };

  const handleDeleteEmployee = async (id: number) => {
    await sqlDeleteEmployee(id);
    await reloadDataFromSql();
  };

  const handleResetDatabase = async () => {
    await sqlResetDatabase();
    await reloadDataFromSql();
  };

  if (dbLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F5] p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-[#FCE7F3] flex items-center justify-center text-pink-500 mb-4 animate-bounce">
          <Database className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
          Cargando Sistema Kinder...
        </h2>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 justify-center">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-500" />
          Inicializando motor de base de datos relacional SQLite (WASM)...
        </p>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F5] p-6 text-center">
        <div className="bg-white p-6 rounded-3xl border border-rose-200 max-w-sm shadow-md">
          <p className="text-xs text-rose-600 font-semibold mb-3">{dbError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-pink-500 text-white rounded-xl text-xs font-bold"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <LoginScreen
        employees={employees}
        settings={settings}
        onLoginSuccess={handleLoginSuccess}
        onDirectDeliveryAccess={handleDirectDeliveryAccess}
      />
    );
  }

  const moduleTitles: Record<ModuleKey, string> = {
    home: 'Inicio',
    colegiaturas: 'Colegiaturas y Pagos',
    contabilidad: 'Contabilidad y Finanzas',
    alumnos: 'Alumnos y Expedientes',
    profesores: 'Profesores y Educadoras',
    aulas: 'Aulas y Salas',
    documentos: 'Administrador de Documentos',
    entregas: 'Entregas y Recepciones por PIN',
    ajustes: 'Ajustes del Sistema',
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex flex-col selection:bg-pink-100 selection:text-pink-900">
      {/* Top Navbar */}
      <TopNavbar
        settings={settings}
        currentUser={currentUser}
        onGoHome={() => setCurrentView('modules')}
        onLogout={handleLogout}
        onOpenSqlConsole={() => setIsSqlModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center p-3 sm:p-6 w-full max-w-7xl mx-auto">
        {/* Breadcrumbs / Back Bar when inside a specific module */}
        {currentView !== 'modules' && (
          <div className="w-full max-w-5xl flex items-center justify-between mb-4 px-1">
            <button
              onClick={() => setCurrentView('modules')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1 px-2.5 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Menú Principal
            </button>
            <span className="text-xs font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
              {moduleTitles[currentView]}
            </span>
          </div>
        )}

        {/* View Switcher */}
        {currentView === 'modules' && (
          <ModuleSelector
            settings={settings}
            students={students}
            classrooms={classrooms}
            onSelectModule={(mod) => setCurrentView(mod)}
          />
        )}

        {currentView === 'colegiaturas' && (
          <ColegiaturasModule
            students={students}
            settings={settings}
            onPayTuition={handlePayTuition}
          />
        )}

        {currentView === 'alumnos' && (
          <StudentsModule
            students={students}
            classrooms={classrooms}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {currentView === 'entregas' && (
          <DeliveryModule
            students={students}
            attendanceLogs={attendanceLogs}
            settings={settings}
            onRecordAction={handleRecordAction}
            onPayTuition={handlePayTuition}
          />
        )}

        {currentView === 'aulas' && (
          <ClassroomsModule
            classrooms={classrooms}
            students={students}
            onSaveClassroom={handleSaveClassroom}
            onDeleteClassroom={handleDeleteClassroom}
            onAssignStudentToRoom={handleAssignStudentToRoom}
            onRemoveStudentFromRoom={handleRemoveStudentFromRoom}
          />
        )}

        {currentView === 'contabilidad' && (
          <AccountingModule
            students={students}
            onToggleTuitionStatus={handleToggleTuitionStatus}
          />
        )}

        {currentView === 'documentos' && (
          <DocumentsModule
            students={students}
            documents={documents}
            onUploadDocument={handleUploadDocument}
          />
        )}

        {currentView === 'profesores' && (
          <TeachersModule
            teachers={teachers}
            classrooms={classrooms}
            onAddTeacher={handleAddTeacher}
          />
        )}

        {currentView === 'ajustes' && (
          <SettingsModule
            settings={settings}
            employees={employees}
            onUpdateSettings={handleUpdateSettings}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onOpenSqlConsole={() => setIsSqlModalOpen(true)}
            onResetDatabase={handleResetDatabase}
          />
        )}
      </main>

      {/* SQL Console and Live Inspector Modal */}
      <SqlConsoleModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
        onRefreshAppState={reloadDataFromSql}
      />
    </div>
  );
}
