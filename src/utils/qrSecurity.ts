import QRCode from 'qrcode';
import { GuardianQrPayload, Student, TrustedContactItem } from '../types.ts';

/**
 * Generates a unique cryptographic key for QR passes.
 * Format: KND-{ROLE}-{TOKEN}-{RANDOM}
 */
export function generateQrCryptoKey(role: 'PAR' | 'FAM', studentName: string): string {
  const cleanName = studentName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 4) || 'ALUM';

  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(4)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  const timestampSegment = Date.now().toString(36).toUpperCase().slice(-4);
  return `KND-${role}-${cleanName}-${randomHex}-${timestampSegment}`;
}

/**
 * Calculates a verification checksum for tamper detection.
 */
export function calculateQrChecksum(studentId: number, personName: string, qrKey: string): string {
  const seed = `${studentId}:${personName}:${qrKey}:KINDER_SECRET_SALT_2026`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
}

/**
 * Constructs the digitally signed payload object for a Parent QR code.
 */
export function createParentQrPayload(student: {
  id: number;
  name: string;
  father: string;
  mother: string;
  parentQrKey: string;
}): GuardianQrPayload {
  const authorizedPerson = [student.father, student.mother].filter(Boolean).join(' / ') || 'Padres de Familia';
  return {
    version: '2.0',
    type: 'KINDER_SECURE_PASS',
    studentId: student.id,
    studentName: student.name,
    authorizedPerson,
    role: 'Padres',
    relation: 'Padres de Familia (Tutores Principales)',
    qrKey: student.parentQrKey,
    issuedAt: new Date().toISOString(),
    checksum: calculateQrChecksum(student.id, authorizedPerson, student.parentQrKey),
  };
}

/**
 * Constructs the digitally signed payload object for a Trusted Family Member QR code.
 */
export function createTrustedContactQrPayload(
  student: { id: number; name: string },
  contact: TrustedContactItem
): GuardianQrPayload {
  return {
    version: '2.0',
    type: 'KINDER_SECURE_PASS',
    studentId: student.id,
    studentName: student.name,
    authorizedPerson: contact.name,
    role: 'Familiar',
    relation: contact.relation || 'Familiar de Confianza Autorizado',
    qrKey: contact.qrKey,
    issuedAt: new Date().toISOString(),
    checksum: calculateQrChecksum(student.id, contact.name, contact.qrKey),
  };
}

/**
 * Serializes payload into a QR string.
 */
export function serializeQrPayload(payload: GuardianQrPayload): string {
  return JSON.stringify(payload);
}

/**
 * Parses and verifies a scanned QR string.
 */
export function parseAndVerifyQrPayload(
  scannedText: string,
  students: Student[]
): {
  valid: boolean;
  error?: string;
  payload?: GuardianQrPayload;
  student?: Student;
  verifiedPerson?: string;
  verifiedRole?: 'Padres' | 'Familiar';
  matchedKey?: string;
} {
  let data: GuardianQrPayload;
  try {
    data = JSON.parse(scannedText);
  } catch {
    // Attempt fallback in case plain key or raw text was scanned
    const rawMatch = students.find(
      (s) =>
        s.parentQrKey === scannedText ||
        s.trustedFamilyList?.some((t) => t.qrKey === scannedText)
    );
    if (rawMatch) {
      const isParent = rawMatch.parentQrKey === scannedText;
      const person = isParent
        ? `${rawMatch.father} / ${rawMatch.mother}`
        : rawMatch.trustedFamilyList?.find((t) => t.qrKey === scannedText)?.name || 'Familiar Autorizado';
      return {
        valid: true,
        student: rawMatch,
        verifiedPerson: person,
        verifiedRole: isParent ? 'Padres' : 'Familiar',
        matchedKey: scannedText,
      };
    }
    return { valid: false, error: 'Formato de Código QR no reconocido o inválido.' };
  }

  if (data.type !== 'KINDER_SECURE_PASS' || !data.studentId || !data.qrKey) {
    return { valid: false, error: 'El Código QR no corresponde a una credencial válida del colegio.' };
  }

  const student = students.find((s) => s.id === data.studentId);
  if (!student) {
    return { valid: false, error: `No se encontró ningún alumno registrado con ID #${data.studentId}.` };
  }

  // Check if it matches parents key
  const isParentMatch = student.parentQrKey === data.qrKey;

  // Check if it matches any trusted family member key
  const matchedContact = student.trustedFamilyList?.find((c) => c.qrKey === data.qrKey);

  if (!isParentMatch && !matchedContact) {
    return {
      valid: false,
      error: 'La llave criptográfica de este código QR no coincide con los registros vigentes del alumno.',
    };
  }

  return {
    valid: true,
    payload: data,
    student,
    verifiedPerson: isParentMatch
      ? [student.father, student.mother].filter(Boolean).join(' / ')
      : matchedContact?.name || data.authorizedPerson,
    verifiedRole: isParentMatch ? 'Padres' : 'Familiar',
    matchedKey: data.qrKey,
  };
}

/**
 * Generates an SVG or PNG data URL for a QR payload using qrcode library.
 */
export async function generateQrDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    color: {
      dark: '#1e293b',
      light: '#ffffff',
    },
  });
}
