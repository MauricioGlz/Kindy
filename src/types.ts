export interface Student {
  id: number;
  name: string;
  father: string;
  mother: string;
  trustedContacts: string[];
  photo: string;
  securityPin: string; // 6-digit PIN
  email: string;
  birthdate: string;
  enrollmentDate: string;
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
  description: string;
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
  name: string;
  size: string;
  type: 'pdf' | 'img';
  date: string;
}

export interface AttendanceLog {
  id: number;
  studentId: number;
  studentName: string;
  tutorPin: string;
  actionType: 'recepcion' | 'entrega';
  timestamp: string;
  date: string;
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
  | 'ajustes';
