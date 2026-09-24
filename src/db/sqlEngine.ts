import initSqlJs, { Database, QueryExecResult } from 'sql.js';
import { SQL_WASM_BASE64 } from './sqlWasmBase64.ts';
import {
  Student,
  Classroom,
  Employee,
  Teacher,
  DocumentItem,
  AttendanceLog,
  InstitutionSettings,
  TrustedContactItem,
} from '../types.ts';
import { generateQrCryptoKey } from '../utils/qrSecurity.ts';

let dbInstance: Database | null = null;
let isInitialized = false;

const DB_STORAGE_KEY = 'kinder_sqlite_db_v1';

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 1,
    name: 'Mariana Ramos',
    role: 'Educadora Maternal A',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    pin: '123456',
  },
  {
    id: 2,
    name: 'Carlos Mendoza',
    role: 'Profesor Preescolar 1',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    pin: '123456',
  },
  {
    id: 3,
    name: 'Fernanda Luna',
    role: 'Puericultista Lactantes',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
    pin: '123456',
  },
];

const INITIAL_CLASSROOMS: Classroom[] = [
  {
    id: 1,
    name: 'Lactantes',
    capacity: 8,
    description: 'Cunas individuales ergonómicas, estimulación sensorial temprana y cambiadores sanitizados.',
  },
  {
    id: 2,
    name: 'Maternal A',
    capacity: 15,
    description: 'Desarrollo motriz fino y grueso, cantos infantiles, socialización y juego heurístico.',
  },
  {
    id: 3,
    name: 'Preescolar 1',
    capacity: 18,
    description: 'Iniciación al lenguaje, números, pensamiento lógico-matemático y expresión plástica creativa.',
  },
];

const INITIAL_TEACHERS: Teacher[] = [
  {
    id: 1,
    name: 'Lic. Mariana Ramos',
    classroom: 'Maternal A',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    phone: '+52 55 4123 8901',
    specialty: 'Pedagogía y Estimulación Temprana',
  },
  {
    id: 2,
    name: 'Prof. Carlos Mendoza',
    classroom: 'Preescolar 1',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    phone: '+52 55 7890 2341',
    specialty: 'Educación Preescolar e Inglés Inicial',
  },
  {
    id: 3,
    name: 'Fernanda Luna',
    classroom: 'Lactantes',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
    phone: '+52 55 6712 9087',
    specialty: 'Puericultura y Cuidados Infantiles',
  },
];

const INITIAL_STUDENTS: Student[] = [
  {
    id: 1,
    name: 'Lucas Soto Martínez',
    father: 'Roberto Soto Alanís',
    mother: 'Camila Martínez Vega',
    parentQrKey: 'KND-PAR-LUCA-98F2-2026',
    trustedContacts: ['Rosa Alanís (Abuela)', 'Carlos Soto (Tío)'],
    trustedFamilyList: [
      { name: 'Rosa Alanís', relation: 'Abuela', phone: '+52 55 1234 5678', qrKey: 'KND-FAM-ROSA-81B4-2026' },
      { name: 'Carlos Soto', relation: 'Tío', phone: '+52 55 8765 4321', qrKey: 'KND-FAM-CARL-42E1-2026' },
    ],
    photo: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=300',
    securityPin: '123456',
    email: 'roberto.soto@ejemplo.com',
    birthdate: '2023-04-12',
    enrollmentDate: '2025-08-15',
    paymentDate: 'Día 05 de cada mes',
    hasScholarship: true,
    scholarshipPercent: 20,
    classroom: 'Maternal A',
    delivered: false,
    lastActionTime: null,
    tuitionAmount: 2800,
    tuitionStatus: 'Pagado',
  },
  {
    id: 2,
    name: 'Mateo Soto Martínez',
    father: 'Roberto Soto Alanís',
    mother: 'Camila Martínez Vega',
    parentQrKey: 'KND-PAR-MATE-55A3-2026',
    trustedContacts: ['Rosa Alanís (Abuela)'],
    trustedFamilyList: [
      { name: 'Rosa Alanís', relation: 'Abuela', phone: '+52 55 1234 5678', qrKey: 'KND-FAM-ROSA-81B4-2026' },
    ],
    photo: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300',
    securityPin: '123456',
    email: 'roberto.soto@ejemplo.com',
    birthdate: '2024-02-18',
    enrollmentDate: '2026-01-10',
    paymentDate: 'Día 05 de cada mes',
    hasScholarship: true,
    scholarshipPercent: 25,
    classroom: 'Lactantes',
    delivered: false,
    lastActionTime: null,
    tuitionAmount: 2850,
    tuitionStatus: 'Pagado',
  },
  {
    id: 3,
    name: 'Emma Castillo Rivas',
    father: 'Javier Castillo León',
    mother: 'Daniela Rivas Paz',
    parentQrKey: 'KND-PAR-EMMA-72C9-2026',
    trustedContacts: ['Elena Paz (Tía)'],
    trustedFamilyList: [
      { name: 'Elena Paz', relation: 'Tía', phone: '+52 55 3344 5566', qrKey: 'KND-FAM-ELEN-99D2-2026' },
    ],
    photo: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=300',
    securityPin: '654321',
    email: 'daniela.rivas@ejemplo.com',
    birthdate: '2022-11-05',
    enrollmentDate: '2025-09-01',
    paymentDate: 'Día 10 de cada mes',
    hasScholarship: false,
    scholarshipPercent: 0,
    classroom: 'Preescolar 1',
    delivered: true,
    lastActionTime: '08:15 AM',
    tuitionAmount: 3500,
    tuitionStatus: 'Pendiente',
  },
  {
    id: 4,
    name: 'Sofía Herrera Gil',
    father: 'Emilio Herrera Ortiz',
    mother: 'Lucía Gil Marín',
    parentQrKey: 'KND-PAR-SOFI-31D8-2026',
    trustedContacts: ['Patricia Marín (Abuela)', 'Mario Gil (Tío)'],
    trustedFamilyList: [
      { name: 'Patricia Marín', relation: 'Abuela', phone: '+52 55 2211 4433', qrKey: 'KND-FAM-PATR-67A1-2026' },
      { name: 'Mario Gil', relation: 'Tío', phone: '+52 55 6677 8899', qrKey: 'KND-FAM-MARI-23C5-2026' },
    ],
    photo: 'https://images.unsplash.com/photo-1595454223600-91fbdd77e584?w=300',
    securityPin: '112233',
    email: 'lucia.gil@ejemplo.com',
    birthdate: '2024-03-20',
    enrollmentDate: '2025-08-20',
    paymentDate: 'Día 01 de cada mes',
    hasScholarship: true,
    scholarshipPercent: 15,
    classroom: 'Lactantes',
    delivered: true,
    lastActionTime: '08:20 AM',
    tuitionAmount: 3230,
    tuitionStatus: 'Pagado',
  },
  {
    id: 5,
    name: 'Leo Paredes Soto',
    father: 'Gustavo Paredes Blanco',
    mother: 'Ana Soto Gómez',
    parentQrKey: 'KND-PAR-LEOP-14E7-2026',
    trustedContacts: [],
    trustedFamilyList: [],
    photo: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=300',
    securityPin: '445566',
    email: 'gustavo.paredes@ejemplo.com',
    birthdate: '2022-09-14',
    enrollmentDate: '2026-02-01',
    paymentDate: 'Día 05 de cada mes',
    hasScholarship: false,
    scholarshipPercent: 0,
    classroom: 'Preescolar 1',
    delivered: false,
    lastActionTime: null,
    tuitionAmount: 3500,
    tuitionStatus: 'Vencido',
  },
];

const INITIAL_DOCUMENTS: DocumentItem[] = [
  { id: 1, studentId: 1, name: 'Acta_Nacimiento_Lucas.pdf', size: '1.4 MB', type: 'pdf', date: '15/08/2025' },
  { id: 2, studentId: 1, name: 'Comprobante_Domicilio_Soto.pdf', size: '850 KB', type: 'pdf', date: '15/08/2025' },
  { id: 3, studentId: 1, name: 'INE_Rosa_Alanis.jpg', size: '2.1 MB', type: 'img', date: '16/08/2025' },
  { id: 4, studentId: 1, name: 'INE_Carlos_Soto.jpg', size: '1.9 MB', type: 'img', date: '16/08/2025' },

  { id: 5, studentId: 2, name: 'Certificado_Nacimiento_Mateo.pdf', size: '1.1 MB', type: 'pdf', date: '10/01/2026' },
  { id: 6, studentId: 2, name: 'Comprobante_Domicilio.pdf', size: '850 KB', type: 'pdf', date: '10/01/2026' },
  { id: 7, studentId: 2, name: 'INE_Rosa_Alanis.jpg', size: '2.1 MB', type: 'img', date: '11/01/2026' },

  { id: 8, studentId: 3, name: 'Acta_Nacimiento_Emma.pdf', size: '1.8 MB', type: 'pdf', date: '01/09/2025' },
  { id: 9, studentId: 3, name: 'Comprobante_Domicilio_Castillo.pdf', size: '920 KB', type: 'pdf', date: '01/09/2025' },
  { id: 10, studentId: 3, name: 'INE_Elena_Paz.jpg', size: '2.4 MB', type: 'img', date: '02/09/2025' },

  { id: 11, studentId: 4, name: 'Certificado_Nacimiento_Sofia.pdf', size: '1.3 MB', type: 'pdf', date: '20/08/2025' },
  { id: 12, studentId: 4, name: 'Comprobante_CFE_Herrera.pdf', size: '780 KB', type: 'pdf', date: '20/08/2025' },
  { id: 13, studentId: 4, name: 'INE_Patricia_Marin.jpg', size: '1.7 MB', type: 'img', date: '21/08/2025' },
  { id: 14, studentId: 4, name: 'INE_Mario_Gil.jpg', size: '1.9 MB', type: 'img', date: '21/08/2025' },

  { id: 15, studentId: 5, name: 'Acta_Nacimiento_Leo.pdf', size: '1.5 MB', type: 'pdf', date: '01/02/2026' },
  { id: 16, studentId: 5, name: 'Comprobante_Domicilio_Paredes.pdf', size: '640 KB', type: 'pdf', date: '01/02/2026' },
];

const INITIAL_SETTINGS: InstitutionSettings = {
  name: 'Kindy Montessori',
  logoUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=160',
  bannerUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200',
  homeBgUrl: '',
  loginBgUrl: '',
  bankName: 'BBVA México',
  accountHolder: 'Kindy Montessori S.C.',
  clabe: '012 180 01548293019 4',
  accountNumber: '1548293019',
};

let cachedWasmBinary: ArrayBuffer | null = null;

function getWasmBinary(): ArrayBuffer {
  if (cachedWasmBinary) return cachedWasmBinary;
  const binaryString = atob(SQL_WASM_BASE64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  cachedWasmBinary = bytes.buffer;
  return cachedWasmBinary;
}

export async function initSqlDatabase(): Promise<Database> {
  if (dbInstance && isInitialized) {
    return dbInstance;
  }

  const wasmBinary = getWasmBinary();
  const SQL = await initSqlJs({
    wasmBinary,
  });

  const savedData = localStorage.getItem(DB_STORAGE_KEY);
  if (savedData) {
    try {
      const uInt8Array = new Uint8Array(JSON.parse(savedData));
      dbInstance = new SQL.Database(uInt8Array);
      runMigrations(dbInstance);
      isInitialized = true;
      return dbInstance;
    } catch (e) {
      console.warn('Could not restore saved SQLite state, recreating tables...', e);
    }
  }

  dbInstance = new SQL.Database();
  createTables(dbInstance);
  runMigrations(dbInstance);
  seedInitialData(dbInstance);
  persistDb();
  isInitialized = true;
  return dbInstance;
}

function runMigrations(db: Database) {
  try {
    db.run(`ALTER TABLE students ADD COLUMN parent_qr_key TEXT;`);
  } catch {}
  try {
    db.run(`ALTER TABLE students ADD COLUMN trusted_family_list TEXT;`);
  } catch {}
  try {
    db.run(`ALTER TABLE attendance_logs ADD COLUMN authorized_person TEXT;`);
  } catch {}
  try {
    db.run(`ALTER TABLE attendance_logs ADD COLUMN qr_key TEXT;`);
  } catch {}
}

function persistDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const array = Array.from(data);
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(array));
  } catch (e) {
    console.error('Error saving SQLite DB to localStorage:', e);
  }
}

function createTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      father TEXT NOT NULL,
      mother TEXT NOT NULL,
      trusted_contacts TEXT,
      trusted_family_list TEXT,
      photo TEXT,
      parent_qr_key TEXT,
      security_pin TEXT,
      email TEXT NOT NULL,
      birthdate TEXT,
      enrollment_date TEXT,
      payment_date TEXT,
      has_scholarship INTEGER DEFAULT 0,
      scholarship_percent INTEGER DEFAULT 0,
      classroom TEXT NOT NULL,
      delivered INTEGER DEFAULT 0,
      last_action_time TEXT,
      tuition_amount REAL DEFAULT 3500,
      tuition_status TEXT DEFAULT 'Pendiente'
    );

    CREATE TABLE IF NOT EXISTS classrooms (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      capacity INTEGER NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      photo TEXT,
      pin TEXT DEFAULT '123456'
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      classroom TEXT NOT NULL,
      photo TEXT,
      phone TEXT,
      specialty TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY,
      student_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      size TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attendance_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      student_name TEXT NOT NULL,
      authorized_person TEXT NOT NULL,
      tutor_pin TEXT,
      action_type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      date TEXT NOT NULL,
      qr_key TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

function seedInitialData(db: Database) {
  // Seed Classrooms
  for (const c of INITIAL_CLASSROOMS) {
    db.run(
      `INSERT INTO classrooms (id, name, capacity, description) VALUES (?, ?, ?, ?)`,
      [c.id, c.name, c.capacity, c.description]
    );
  }

  // Seed Employees
  for (const e of INITIAL_EMPLOYEES) {
    db.run(
      `INSERT INTO employees (id, name, role, photo, pin) VALUES (?, ?, ?, ?, ?)`,
      [e.id, e.name, e.role, e.photo, e.pin]
    );
  }

  // Seed Teachers
  for (const t of INITIAL_TEACHERS) {
    db.run(
      `INSERT INTO teachers (id, name, classroom, photo, phone, specialty) VALUES (?, ?, ?, ?, ?, ?)`,
      [t.id, t.name, t.classroom, t.photo, t.phone, t.specialty]
    );
  }

  // Seed Students
  for (const s of INITIAL_STUDENTS) {
    db.run(
      `INSERT INTO students (
        id, name, father, mother, trusted_contacts, trusted_family_list, photo, parent_qr_key, security_pin, email,
        birthdate, enrollment_date, payment_date, has_scholarship, scholarship_percent,
        classroom, delivered, last_action_time, tuition_amount, tuition_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.name,
        s.father,
        s.mother,
        JSON.stringify(s.trustedContacts),
        JSON.stringify(s.trustedFamilyList || []),
        s.photo,
        s.parentQrKey,
        s.securityPin || '123456',
        s.email,
        s.birthdate,
        s.enrollmentDate,
        s.paymentDate,
        s.hasScholarship ? 1 : 0,
        s.scholarshipPercent,
        s.classroom,
        s.delivered ? 1 : 0,
        s.lastActionTime,
        s.tuitionAmount,
        s.tuitionStatus,
      ]
    );
  }

  // Seed Documents
  for (const d of INITIAL_DOCUMENTS) {
    db.run(
      `INSERT INTO documents (id, student_id, name, size, type, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [d.id, d.studentId, d.name, d.size, d.type, d.date]
    );
  }

  // Seed initial Attendance Logs
  db.run(`
    INSERT INTO attendance_logs (student_id, student_name, authorized_person, tutor_pin, action_type, timestamp, date, qr_key)
    VALUES (3, 'Emma Castillo Rivas', 'Daniela Rivas Paz (Madre)', '654321', 'recepcion', '08:15 AM', '2026-09-17', 'KND-PAR-EMMA-72C9-2026');
    INSERT INTO attendance_logs (student_id, student_name, authorized_person, tutor_pin, action_type, timestamp, date, qr_key)
    VALUES (4, 'Sofía Herrera Gil', 'Patricia Marín (Abuela)', '112233', 'recepcion', '08:20 AM', '2026-09-17', 'KND-FAM-PATR-67A1-2026');
  `);

  // Seed Settings
  db.run(`INSERT INTO settings (key, value) VALUES ('institution', ?)`, [
    JSON.stringify(INITIAL_SETTINGS),
  ]);
}

// --------------------------------------------------------------------------
// Typed SQL Query Functions
// --------------------------------------------------------------------------

export async function sqlGetStudents(): Promise<Student[]> {
  const db = await initSqlDatabase();
  const res = db.exec(`SELECT * FROM students ORDER BY id DESC`);
  if (!res.length) return [];

  const columns = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });

    const rawContacts: string[] = obj.trusted_contacts ? JSON.parse(obj.trusted_contacts) : [];
    
    let familyList: TrustedContactItem[] = [];
    if (obj.trusted_family_list) {
      try {
        familyList = JSON.parse(obj.trusted_family_list);
      } catch {
        familyList = [];
      }
    }
    if (!familyList || familyList.length === 0) {
      familyList = rawContacts.map((c) => {
        const match = c.match(/^(.*?)\s*\((.*?)\)$/);
        const name = match ? match[1].trim() : c;
        const relation = match ? match[2].trim() : 'Familiar';
        return {
          name,
          relation,
          qrKey: generateQrCryptoKey('FAM', name),
        };
      });
    }

    const parentQr = obj.parent_qr_key || generateQrCryptoKey('PAR', obj.name);

    return {
      id: obj.id,
      name: obj.name,
      father: obj.father,
      mother: obj.mother,
      parentQrKey: parentQr,
      trustedContacts: rawContacts,
      trustedFamilyList: familyList,
      photo: obj.photo,
      securityPin: obj.security_pin || '123456',
      email: obj.email,
      birthdate: obj.birthdate,
      enrollmentDate: obj.enrollment_date,
      paymentDate: obj.payment_date,
      hasScholarship: obj.has_scholarship === 1,
      scholarshipPercent: obj.scholarship_percent || 0,
      classroom: obj.classroom,
      delivered: obj.delivered === 1,
      lastActionTime: obj.last_action_time,
      tuitionAmount: obj.tuition_amount,
      tuitionStatus: obj.tuition_status as 'Pagado' | 'Pendiente' | 'Vencido',
    };
  });
}

export async function sqlAddStudent(
  student: Omit<Student, 'id'>,
  docPayloads?: { name: string; type: 'pdf' | 'img' }[]
): Promise<Student> {
  const db = await initSqlDatabase();
  const id = Date.now();
  const parentQr = student.parentQrKey || generateQrCryptoKey('PAR', student.name);
  const familyList = (student.trustedFamilyList && student.trustedFamilyList.length > 0)
    ? student.trustedFamilyList
    : (student.trustedContacts || []).map((c) => {
        const match = c.match(/^(.*?)\s*\((.*?)\)$/);
        const name = match ? match[1].trim() : c;
        const relation = match ? match[2].trim() : 'Familiar';
        return {
          name,
          relation,
          qrKey: generateQrCryptoKey('FAM', name),
        };
      });

  const contactsArr = familyList.map((f) => `${f.name} (${f.relation})`);

  db.run(
    `INSERT INTO students (
      id, name, father, mother, trusted_contacts, trusted_family_list, photo, parent_qr_key, security_pin, email,
      birthdate, enrollment_date, payment_date, has_scholarship, scholarship_percent,
      classroom, delivered, last_action_time, tuition_amount, tuition_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      student.name,
      student.father,
      student.mother,
      JSON.stringify(contactsArr),
      JSON.stringify(familyList),
      student.photo,
      parentQr,
      student.securityPin || '123456',
      student.email,
      student.birthdate,
      student.enrollmentDate,
      student.paymentDate,
      student.hasScholarship ? 1 : 0,
      student.scholarshipPercent,
      student.classroom,
      student.delivered ? 1 : 0,
      student.lastActionTime,
      student.tuitionAmount,
      student.tuitionStatus,
    ]
  );

  if (docPayloads && docPayloads.length > 0) {
    const today = new Date().toLocaleDateString('es-MX');
    docPayloads.forEach((doc, idx) => {
      db.run(
        `INSERT INTO documents (id, student_id, name, size, type, date) VALUES (?, ?, ?, ?, ?, ?)`,
        [Date.now() + idx + 1, id, doc.name, '1.4 MB', doc.type, today]
      );
    });
  }

  persistDb();
  return { ...student, id, parentQrKey: parentQr, trustedFamilyList: familyList, trustedContacts: contactsArr };
}

export async function sqlAssignStudentClassroom(studentId: number, roomName: string): Promise<void> {
  const db = await initSqlDatabase();
  db.run(`UPDATE students SET classroom = ? WHERE id = ?`, [roomName, studentId]);
  persistDb();
}

export async function sqlToggleTuitionStatus(studentId: number): Promise<void> {
  const db = await initSqlDatabase();
  const res = db.exec(`SELECT tuition_status FROM students WHERE id = ${studentId}`);
  if (res.length && res[0].values.length) {
    const current = res[0].values[0][0] as string;
    const nextStatus = current === 'Pagado' ? 'Pendiente' : current === 'Pendiente' ? 'Vencido' : 'Pagado';
    db.run(`UPDATE students SET tuition_status = ? WHERE id = ?`, [nextStatus, studentId]);
    persistDb();
  }
}

export async function sqlPayTuition(
  studentId: number,
  _paymentMethod: 'transferencia' | 'tarjeta'
): Promise<void> {
  const db = await initSqlDatabase();
  db.run(`UPDATE students SET tuition_status = 'Pagado' WHERE id = ?`, [studentId]);
  persistDb();
}

export async function sqlUpdateStudent(student: Student): Promise<void> {
  const db = await initSqlDatabase();
  const parentQr = student.parentQrKey || generateQrCryptoKey('PAR', student.name);
  const familyList = (student.trustedFamilyList && student.trustedFamilyList.length > 0)
    ? student.trustedFamilyList
    : (student.trustedContacts || []).map((c) => {
        const match = c.match(/^(.*?)\s*\((.*?)\)$/);
        const name = match ? match[1].trim() : c;
        const relation = match ? match[2].trim() : 'Familiar';
        return {
          name,
          relation,
          qrKey: generateQrCryptoKey('FAM', name),
        };
      });

  const contactsArr = familyList.map((f) => `${f.name} (${f.relation})`);

  db.run(
    `UPDATE students SET
      name = ?, father = ?, mother = ?, trusted_contacts = ?, trusted_family_list = ?, photo = ?,
      parent_qr_key = ?, security_pin = ?, email = ?, birthdate = ?, enrollment_date = ?,
      payment_date = ?, has_scholarship = ?, scholarship_percent = ?,
      classroom = ?, delivered = ?, last_action_time = ?, tuition_amount = ?,
      tuition_status = ?
    WHERE id = ?`,
    [
      student.name,
      student.father,
      student.mother,
      JSON.stringify(contactsArr),
      JSON.stringify(familyList),
      student.photo,
      parentQr,
      student.securityPin || '123456',
      student.email,
      student.birthdate,
      student.enrollmentDate,
      student.paymentDate,
      student.hasScholarship ? 1 : 0,
      student.scholarshipPercent,
      student.classroom,
      student.delivered ? 1 : 0,
      student.lastActionTime,
      student.tuitionAmount,
      student.tuitionStatus,
      student.id,
    ]
  );
  persistDb();
}

export async function sqlDeleteStudent(id: number): Promise<void> {
  const db = await initSqlDatabase();
  db.run(`DELETE FROM students WHERE id = ?`, [id]);
  db.run(`DELETE FROM documents WHERE student_id = ?`, [id]);
  persistDb();
}

export async function sqlRecordStudentAction(
  student: Student,
  actionType: 'recepcion' | 'entrega',
  timeStr: string,
  dateStr: string,
  authorizedPerson?: string,
  qrKey?: string
): Promise<void> {
  const db = await initSqlDatabase();
  const newDelivered = actionType === 'recepcion' ? 1 : 0;
  db.run(`UPDATE students SET delivered = ?, last_action_time = ? WHERE id = ?`, [
    newDelivered,
    timeStr,
    student.id,
  ]);
  const person = authorizedPerson || [student.father, student.mother].filter(Boolean).join(' / ') || 'Tutor Autorizado';
  const key = qrKey || student.parentQrKey || 'QR-DEFAULT';
  db.run(
    `INSERT INTO attendance_logs (student_id, student_name, authorized_person, tutor_pin, action_type, timestamp, date, qr_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [student.id, student.name, person, student.securityPin || '', actionType, timeStr, dateStr, key]
  );
  persistDb();
}

export async function sqlGetClassrooms(): Promise<Classroom[]> {
  const db = await initSqlDatabase();
  const res = db.exec(`SELECT * FROM classrooms ORDER BY id ASC`);
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return {
      id: obj.id,
      name: obj.name,
      capacity: obj.capacity,
      description: obj.description,
    };
  });
}

export async function sqlSaveClassroom(room: Omit<Classroom, 'id'> & { id?: number }): Promise<Classroom> {
  const db = await initSqlDatabase();
  const id = room.id || Date.now();
  db.run(
    `INSERT OR REPLACE INTO classrooms (id, name, capacity, description) VALUES (?, ?, ?, ?)`,
    [id, room.name, room.capacity, room.description]
  );
  persistDb();
  return { id, name: room.name, capacity: room.capacity, description: room.description };
}

export async function sqlDeleteClassroom(id: number): Promise<void> {
  const db = await initSqlDatabase();
  db.run(`DELETE FROM classrooms WHERE id = ?`, [id]);
  persistDb();
}

export async function sqlGetEmployees(): Promise<Employee[]> {
  const db = await initSqlDatabase();
  const res = db.exec(`SELECT * FROM employees ORDER BY id ASC`);
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return {
      id: obj.id,
      name: obj.name,
      role: obj.role,
      photo: obj.photo,
      pin: obj.pin || '123456',
    };
  });
}

export async function sqlAddEmployee(emp: Omit<Employee, 'id'>): Promise<Employee> {
  const db = await initSqlDatabase();
  const id = Date.now();
  db.run(
    `INSERT INTO employees (id, name, role, photo, pin) VALUES (?, ?, ?, ?, ?)`,
    [id, emp.name, emp.role, emp.photo, emp.pin || '123456']
  );
  persistDb();
  return { ...emp, id };
}

export async function sqlDeleteEmployee(id: number): Promise<void> {
  const db = await initSqlDatabase();
  db.run(`DELETE FROM employees WHERE id = ?`, [id]);
  persistDb();
}

export async function sqlGetTeachers(): Promise<Teacher[]> {
  const db = await initSqlDatabase();
  const res = db.exec(`SELECT * FROM teachers ORDER BY id ASC`);
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return {
      id: obj.id,
      name: obj.name,
      classroom: obj.classroom,
      photo: obj.photo,
      phone: obj.phone,
      specialty: obj.specialty,
    };
  });
}

export async function sqlAddTeacher(t: Omit<Teacher, 'id'>): Promise<Teacher> {
  const db = await initSqlDatabase();
  const id = Date.now();
  db.run(
    `INSERT INTO teachers (id, name, classroom, photo, phone, specialty) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, t.name, t.classroom, t.photo, t.phone, t.specialty]
  );
  persistDb();
  return { ...t, id };
}

export async function sqlUpdateTeacher(t: Teacher): Promise<void> {
  const db = await initSqlDatabase();
  db.run(
    `UPDATE teachers SET name = ?, classroom = ?, photo = ?, phone = ?, specialty = ? WHERE id = ?`,
    [t.name, t.classroom, t.photo, t.phone, t.specialty, t.id]
  );
  persistDb();
}

export async function sqlDeleteTeacher(id: number): Promise<void> {
  const db = await initSqlDatabase();
  db.run(`DELETE FROM teachers WHERE id = ?`, [id]);
  persistDb();
}

export async function sqlGetDocuments(): Promise<DocumentItem[]> {
  const db = await initSqlDatabase();
  const res = db.exec(`SELECT * FROM documents ORDER BY id ASC`);
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return {
      id: obj.id,
      studentId: obj.student_id,
      name: obj.name,
      size: obj.size,
      type: obj.type as 'pdf' | 'img',
      date: obj.date,
    };
  });
}

export async function sqlAddDocument(doc: Omit<DocumentItem, 'id'>): Promise<DocumentItem> {
  const db = await initSqlDatabase();
  const id = Date.now();
  db.run(
    `INSERT INTO documents (id, student_id, name, size, type, date) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, doc.studentId, doc.name, doc.size, doc.type, doc.date]
  );
  persistDb();
  return { ...doc, id };
}

export async function sqlGetAttendanceLogs(): Promise<AttendanceLog[]> {
  const db = await initSqlDatabase();
  const res = db.exec(`SELECT * FROM attendance_logs ORDER BY id DESC LIMIT 50`);
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row) => {
    const obj: any = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return {
      id: obj.id,
      studentId: obj.student_id,
      studentName: obj.student_name,
      authorizedPerson: obj.authorized_person || obj.tutor_pin || 'Tutor Autorizado',
      qrKey: obj.qr_key,
      tutorPin: obj.tutor_pin,
      actionType: obj.action_type as 'recepcion' | 'entrega',
      timestamp: obj.timestamp,
      date: obj.date,
    };
  });
}

export async function sqlGetSettings(): Promise<InstitutionSettings> {
  const db = await initSqlDatabase();
  const res = db.exec(`SELECT value FROM settings WHERE key = 'institution'`);
  if (res.length && res[0].values.length) {
    try {
      return JSON.parse(res[0].values[0][0] as string);
    } catch (e) {
      console.error(e);
    }
  }
  return INITIAL_SETTINGS;
}

export async function sqlSaveSettings(settings: InstitutionSettings): Promise<void> {
  const db = await initSqlDatabase();
  db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES ('institution', ?)`, [
    JSON.stringify(settings),
  ]);
  persistDb();
}

export async function sqlRunRawQuery(sql: string): Promise<QueryExecResult[]> {
  const db = await initSqlDatabase();
  const res = db.exec(sql);
  persistDb();
  return res;
}

export async function sqlResetDatabase(): Promise<void> {
  localStorage.removeItem(DB_STORAGE_KEY);
  dbInstance = null;
  isInitialized = false;
  await initSqlDatabase();
}

export const sqlUpdateSettings = sqlSaveSettings;
export const sqlRawQuery = sqlRunRawQuery;
