import { Student } from '../types.ts';

interface PrintCredentialOptions {
  student: Student;
  qrDataUrl: string;
  activeName: string;
  activeRole: string;
  activeKey: string;
  institutionName?: string;
}

/**
 * Builds the standalone HTML string for printing the credential badge.
 */
export function buildCredentialHtml(options: PrintCredentialOptions): string {
  const { student, qrDataUrl, activeName, activeRole, activeKey, institutionName = 'Kínder Creativo' } = options;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Credencial Oficial - ${escapeHtml(student.name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Outfit:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    @page {
      size: portrait;
      margin: 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .print-instructions {
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 12px;
      text-align: center;
    }
    @media print {
      body {
        min-height: auto;
        padding: 0;
      }
      .print-instructions {
        display: none;
      }
    }
    .badge-card {
      width: 400px;
      max-width: 100%;
      border: 2.5px dashed #f472b6;
      border-radius: 28px;
      padding: 24px;
      background: linear-gradient(180deg, #fdf2f8 0%, #ffffff 45%, #fdf2f8 100%);
      text-align: center;
      box-shadow: 0 10px 30px rgba(244, 114, 182, 0.12);
      page-break-inside: avoid;
      break-inside: avoid;
      margin: 0 auto;
    }
    .badge-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1.5px solid #fbcfe8;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .badge-title {
      font-size: 10px;
      font-weight: 800;
      color: #db2777;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .classroom-pill {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      background: #ffffff;
      padding: 3px 10px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .student-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 16px;
      background: #ffffff;
      padding: 12px;
      border-radius: 20px;
      border: 1px solid #f1f5f9;
    }
    .student-photo {
      width: 68px;
      height: 68px;
      border-radius: 18px;
      object-fit: cover;
      border: 3px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.08);
      background-color: #f1f5f9;
    }
    .student-details {
      text-align: left;
      flex: 1;
    }
    .student-name {
      font-family: 'Outfit', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 2px 0;
      line-height: 1.2;
    }
    .student-meta {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
      margin: 0 0 6px 0;
    }
    .blood-badge {
      display: inline-block;
      font-size: 9.5px;
      font-weight: 700;
      color: #047857;
      background-color: #ecfdf5;
      border: 1px solid #a7f3d0;
      padding: 2px 8px;
      border-radius: 20px;
    }
    .qr-container {
      background: #ffffff;
      border-radius: 22px;
      padding: 14px;
      display: inline-block;
      border: 1.5px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      margin-bottom: 16px;
    }
    .qr-image {
      width: 180px;
      height: 180px;
      display: block;
      margin: 0 auto;
    }
    .guardian-card {
      background: #ffffff;
      border-radius: 18px;
      padding: 12px 16px;
      border: 1.5px solid #e2e8f0;
      text-align: left;
      margin-bottom: 14px;
    }
    .guardian-label {
      font-size: 9px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      display: block;
      margin-bottom: 2px;
    }
    .guardian-name {
      font-size: 13px;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 2px 0;
    }
    .guardian-role {
      font-size: 11px;
      font-weight: 600;
      color: #db2777;
      margin: 0 0 8px 0;
    }
    .key-info {
      border-top: 1px solid #f1f5f9;
      padding-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9.5px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #64748b;
    }
    .key-code {
      font-weight: 700;
      color: #334155;
    }
    .badge-footer-text {
      font-size: 10px;
      color: #64748b;
      line-height: 1.35;
      margin: 0 0 10px 0;
    }
    .badge-seal {
      border-top: 1px dashed #fbcfe8;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 9px;
      color: #94a3b8;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="print-instructions">✂️ Recorte por la línea punteada para credencial plastificada o portagafete oficial</div>
  <div class="badge-card">
    <div class="badge-header">
      <span class="badge-title">
        🛡️ Credencial Oficial de Recolección
      </span>
      <span class="classroom-pill">${escapeHtml(student.classroom)}</span>
    </div>

    <div class="student-section">
      <img src="${escapeHtml(student.photo)}" alt="${escapeHtml(student.name)}" class="student-photo" crossorigin="anonymous" />
      <div class="student-details">
        <h4 class="student-name">${escapeHtml(student.name)}</h4>
        <p class="student-meta">Matrícula: #${student.id.toString().padStart(4, '0')}</p>
        <span class="blood-badge">${escapeHtml(student.bloodType || 'O+')} • Seguro Activo</span>
      </div>
    </div>

    <div class="qr-container">
      <img src="${qrDataUrl}" alt="Código QR de Acceso" class="qr-image" />
    </div>

    <div class="guardian-card">
      <span class="guardian-label">Titular Autorizado</span>
      <p class="guardian-name">${escapeHtml(activeName)}</p>
      <p class="guardian-role">${escapeHtml(activeRole)}</p>
      <div class="key-info">
        <span>Llave Criptográfica:</span>
        <span class="key-code">${escapeHtml(activeKey)}</span>
      </div>
    </div>

    <p class="badge-footer-text">
      Presenta este Código QR al personal del colegio durante la recepción y salida de tu pequeño.
    </p>

    <div class="badge-seal">
      <span>${escapeHtml(institutionName).toUpperCase()}</span>
      <span>EMISIÓN: ${new Date().toLocaleDateString('es-MX')}</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Escapes characters for safe HTML inclusion.
 */
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Main print executor. Tries printing via dedicated hidden iframe.
 * If blocked by iframe sandbox, falls back to direct print with class-based styles.
 */
export async function printCredentialCard(options: PrintCredentialOptions): Promise<void> {
  const html = buildCredentialHtml(options);

  return new Promise((resolve) => {
    try {
      const existing = document.getElementById('credential-print-frame');
      if (existing) {
        existing.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'credential-print-frame';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '10px';
      iframe.style.height = '10px';
      iframe.style.border = 'none';
      iframe.style.opacity = '0.01';
      iframe.style.pointerEvents = 'none';
      iframe.style.zIndex = '-999';

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('No se pudo acceder al documento del frame de impresión');
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Give browser time to parse CSS, fonts, and render the base64 QR image
      setTimeout(() => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            resolve();
            // Clean up after print dialog finishes or dismisses
            setTimeout(() => {
              if (document.getElementById('credential-print-frame')) {
                iframe.remove();
              }
            }, 60000);
            return;
          }
        } catch (subErr) {
          console.warn('Iframe print failed or was restricted, executing main window fallback:', subErr);
        }

        // Fallback: print from main window with class
        fallbackMainWindowPrint(resolve);
      }, 500);
    } catch (err) {
      console.warn('Iframe creation error, falling back to direct window.print:', err);
      fallbackMainWindowPrint(resolve);
    }
  });
}

function fallbackMainWindowPrint(onComplete?: () => void) {
  document.body.classList.add('printing-credential');
  window.focus();
  
  const handleAfterPrint = () => {
    document.body.classList.remove('printing-credential');
    window.removeEventListener('afterprint', handleAfterPrint);
    if (onComplete) onComplete();
  };

  window.addEventListener('afterprint', handleAfterPrint);
  
  try {
    window.print();
  } catch (printErr) {
    console.error('window.print error:', printErr);
  }

  // Backup cleanup
  setTimeout(() => {
    document.body.classList.remove('printing-credential');
    if (onComplete) onComplete();
  }, 2000);
}

/**
 * Generates and downloads the credential card as a PNG image using HTML5 Canvas.
 */
export async function downloadCredentialBadgeImage(options: PrintCredentialOptions): Promise<void> {
  const { student, qrDataUrl, activeName, activeRole, activeKey, institutionName = 'Kínder Creativo' } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 800;
  const height = 1100;
  canvas.width = width;
  canvas.height = height;

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#fdf2f8');
  gradient.addColorStop(0.45, '#ffffff');
  gradient.addColorStop(1, '#fdf2f8');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Card Outer Dashed Border
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 5;
  ctx.setLineDash([16, 10]);
  roundRect(ctx, 30, 30, width - 60, height - 60, 40);
  ctx.stroke();
  ctx.setLineDash([]);

  // Top header text
  ctx.fillStyle = '#db2777';
  ctx.font = 'bold 22px "Outfit", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🛡️ CREDENCIAL OFICIAL DE RECOLECCIÓN', 60, 95);

  // Classroom tag
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(student.classroom, width - 60, 95);

  // Header Divider
  ctx.strokeStyle = '#fbcfe8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 120);
  ctx.lineTo(width - 60, 120);
  ctx.stroke();

  // Student Section Box
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 2;
  roundRect(ctx, 60, 145, width - 120, 140, 24);
  ctx.fill();
  ctx.stroke();

  // Load and draw student photo
  const photoImg = new Image();
  photoImg.crossOrigin = 'anonymous';
  photoImg.src = student.photo;

  await new Promise<void>((res) => {
    photoImg.onload = () => res();
    photoImg.onerror = () => res();
  });

  try {
    ctx.save();
    roundRect(ctx, 80, 160, 110, 110, 20);
    ctx.clip();
    ctx.drawImage(photoImg, 80, 160, 110, 110);
    ctx.restore();
  } catch {
    // Photo fallback
    ctx.fillStyle = '#e2e8f0';
    roundRect(ctx, 80, 160, 110, 110, 20);
    ctx.fill();
  }

  // Student Name & Details
  ctx.textAlign = 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = '800 28px "Outfit", sans-serif';
  ctx.fillText(student.name, 210, 195);

  ctx.fillStyle = '#64748b';
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`Matrícula: #${student.id.toString().padStart(4, '0')}`, 210, 228);

  ctx.fillStyle = '#047857';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${student.bloodType || 'O+'} • Seguro Médico Vigente`, 210, 260);

  // QR Code Box
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 3;
  roundRect(ctx, (width - 340) / 2, 315, 340, 340, 30);
  ctx.fill();
  ctx.stroke();

  // Load and draw QR Code
  const qrImg = new Image();
  qrImg.src = qrDataUrl;
  await new Promise<void>((res) => {
    qrImg.onload = () => res();
    qrImg.onerror = () => res();
  });
  ctx.drawImage(qrImg, (width - 300) / 2, 335, 300, 300);

  // Guardian Box
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  roundRect(ctx, 60, 680, width - 120, 190, 24);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TITULAR AUTORIZADO', 85, 715);

  ctx.fillStyle = '#1e293b';
  ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(activeName, 85, 750);

  ctx.fillStyle = '#db2777';
  ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(activeRole, 85, 782);

  // Divider inside guardian box
  ctx.strokeStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.moveTo(85, 805);
  ctx.lineTo(width - 85, 805);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '16px monospace';
  ctx.fillText('Llave Criptográfica:', 85, 840);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(activeKey, width - 85, 840);

  // Instructions
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Presenta este Código QR al personal del colegio durante la recepción y salida.', width / 2, 915);

  // Bottom Seal
  ctx.strokeStyle = '#fbcfe8';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(60, 960);
  ctx.lineTo(width - 60, 960);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(institutionName.toUpperCase(), 60, 995);

  ctx.textAlign = 'right';
  ctx.fillText(`EMISIÓN: ${new Date().toLocaleDateString('es-MX')}`, width - 60, 995);

  // Trigger download
  const link = document.createElement('a');
  link.download = `Credencial_${student.name.replace(/\s+/g, '_')}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

/**
 * Helper to draw rounded rectangle on canvas.
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
