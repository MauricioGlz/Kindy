export interface TrustedContactItem {
  id?: string;
  name: string;
  relation: string; // "Abuela", "Tío", "Tutor", "Hermana", etc.
  phone?: string;
  qrKey: string; // Llave criptográfica única
}

export interface GuardianQrPayload {
  version: '2.0';
  type: 'KINDER_SECURE_PASS';
  studentId: number;
  studentName: string;
  authorizedPerson: string;
  role: 'Padres' | 'Familiar';
  relation: string;
  qrKey: string;
  issuedAt: string;
  checksum: string;
}

export interface Student {
  id: number;
  name: string;
  father: string;
  mother: string;
  age?: number;
  bloodType?: string;
  phone?: string;
  emergencyPhone?: string;
  trustedContacts: string[];
  trustedFamilyList?: TrustedContactItem[];
  photo: string;
  parentQrKey: string; // Llave única de cifrado para los padres
  securityPin?: string; // Legado opcional
  email?: string;
  birthdate?: string;
  enrollmentDate?: string;
  paymentDate: string;
  hasScholarship: boolean;
  scholarshipPercent: number;
  classroom: string;
  delivered: boolean; // true = en plantel, false = fuera
  lastActionTime: string | null;
  tuitionAmount: number;
  tuitionStatus: 'Pagado' | 'Pendiente' | 'Vencido';
}

export interface Classroom {
  id: number;
  name: string;
  capacity: number;
  description?: string;
  color?: string;
  ageRange?: string;
  teacherName?: string;
}

export interface Employee {
  id: number;
  name: string;
  role: string;
  photo: string;
  pin: string;
}

export interface Teacher {
  id: number;
  name: string;
  classroom: string;
  photo: string;
  phone: string;
  specialty: string;
}

export interface DocumentItem {
  id: number;
  studentId: number;
  studentName?: string;
  name: string;
  size?: string;
  type: 'pdf' | 'img';
  date?: string;
  uploadDate?: string;
  status?: string;
  url?: string;
  category?: string;
  notes?: string;
}

export interface AttendanceLog {
  id: number;
  studentId: number;
  studentName: string;
  authorizedPerson: string; // Nombre del padre o familiar que presentó el QR
  tutorPin?: string; // Legado opcional
  actionType: 'recepcion' | 'entrega';
  timestamp: string;
  date: string;
  qrKey?: string; // Llave criptográfica utilizada al escanear
}

export interface EnabledModulesConfig {
  libreta: boolean;
  contabilidad: boolean;
  aulas: boolean;
  profesores?: boolean;
  documentos?: boolean;
}

export interface InstitutionSettings {
  name: string;
  logoUrl: string;
  bannerUrl: string;
  homeBgUrl?: string;
  loginBgUrl?: string;
  bankName?: string;
  accountHolder?: string;
  clabe?: string;
  accountNumber?: string;
  customActivities?: string[];
  enabledModules?: EnabledModulesConfig;
}

export type MoodType = 'feliz' | 'neutral' | 'lloroso' | 'molesto';

export interface ActivityLog {
  id?: number;
  studentId: number;
  date: string; // YYYY-MM-DD
  mood: MoodType;
  completedActivities: string[];
  notes: string;
  parentAcknowledged: boolean;
  acknowledgedBy?: string | null;
  acknowledgedAt?: string | null;
  updatedAt?: string;
}

export type ModuleKey =
  | 'home'
  | 'colegiaturas'
  | 'contabilidad'
  | 'alumnos'
  | 'profesores'
  | 'aulas'
  | 'documentos'
  | 'entregas'
  | 'libreta'
  | 'ajustes';
