export type ModuleKey =
  | 'home'
  | 'alumnos'
  | 'entregas'
  | 'colegiaturas'
  | 'aulas'
  | 'contabilidad'
  | 'documentos'
  | 'profesores'
  | 'ajustes';

export interface TrustedContactItem {
  name: string;
  relation: string;
  phone?: string;
  qrKey: string;
}

export interface Student {
  id: number;
  name: string;
  age: number;
  bloodType: string;
  father: string;
  mother: string;
  phone: string;
  emergencyPhone: string;
  classroom: string;
  photo: string;
  delivered: boolean;
  lastActionTime: string;
  securityPin: string;
  paymentDate: string;
  tuitionStatus: 'Pendiente' | 'Pagado' | 'Vencido';
  tuitionAmount: number;
  hasScholarship: boolean;
  scholarshipPercent: number;
  trustedContacts: string[];
  parentQrKey: string;
  trustedFamilyList: TrustedContactItem[];
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

export interface Classroom {
  id: number;
  name: string;
  capacity: number;
  color: string;
  ageRange: string;
  teacherName?: string;
}

export interface Employee {
  id: number;
  name: string;
  role: string;
  pin: string;
  photo: string;
  shift: string;
}

export interface Teacher {
  id: number;
  name: string;
  specialty: string;
  classroom: string;
  phone: string;
  photo: string;
}

export interface DocumentItem {
  id: number;
  studentId: number;
  studentName: string;
  name: string;
  type: 'pdf' | 'img';
  uploadDate: string;
  status: 'Completo' | 'Pendiente';
  fileUrl?: string;
}

export interface AttendanceLog {
  id: number;
  studentId: number;
  studentName: string;
  actionType: 'recepcion' | 'entrega';
  timestamp: string;
  date: string;
  tutorPin?: string;
  authorizedPerson?: string;
  qrKey?: string;
}

export interface InstitutionSettings {
  name: string;
  directorName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  loginBgUrl?: string;
  monthlyTuition: number;
  bankName: string;
  accountHolder: string;
  clabe: string;
  accountNumber: string;
}
