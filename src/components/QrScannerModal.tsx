import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  X,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Student } from '../types.ts';
import {
  parseAndVerifyQrPayload,
  createParentQrPayload,
  createTrustedContactQrPayload,
  serializeQrPayload,
} from '../utils/qrSecurity.ts';
import { useDebugMode } from '../context/DebugContext.tsx';

interface QrScannerModalProps {
  students: Student[];
  actionType?: 'recepcion' | 'entrega';
  isOpen?: boolean;
  onScanSuccess?: (student: Student, personName: string, qrKey: string) => void;
  onVerified?: (student: Student, personName: string, qrKey: string) => void;
  onClose: () => void;
}

export default function QrScannerModal({
  students,
  actionType = 'recepcion',
  isOpen = true,
  onScanSuccess,
  onVerified,
  onClose,
}: QrScannerModalProps) {
  if (isOpen === false) return null;

  const { isDebugMode } = useDebugMode();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stream & Animation frame refs
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastScanTimestamp = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // References to avoid re-triggering effects and recreation of startCamera/scanVideoFrame
  const studentsRef = useRef<Student[]>(students);
  const onVerifiedRef = useRef(onVerified);
  const onScanSuccessRef = useRef(onScanSuccess);
  const isScanningRef = useRef<boolean>(true);

  useEffect(() => {
    studentsRef.current = students;
    onVerifiedRef.current = onVerified;
    onScanSuccessRef.current = onScanSuccess;
  });

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    studentName?: string;
    personName?: string;
    role?: string;
    error?: string;
  } | null>(null);

  const [manualKeyInput, setManualKeyInput] = useState('');

  // Stop camera tracks cleanly without triggering component re-renders that recreate loops
  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (isMountedRef.current) {
      setCameraActive(false);
      setCameraLoading(false);
    }
  }, []);

  // Process decoded QR text safely
  const handleDecodedString = useCallback((rawText: string) => {
    if (!isScanningRef.current) return;
    const verification = parseAndVerifyQrPayload(rawText, studentsRef.current);

    if (verification.valid && verification.student) {
      isScanningRef.current = false;
      stopCamera();

      const student = verification.student;
      const person = verification.verifiedPerson || 'Tutor Autorizado';
      const key = verification.matchedKey || student.parentQrKey || 'KEY-VERIFIED';

      if (isMountedRef.current) {
        setScanResult({
          success: true,
          studentName: student.name,
          personName: person,
          role: verification.verifiedRole || 'Tutor',
        });
      }

      // Trigger verified callback after showing brief visual confirmation
      setTimeout(() => {
        if (!isMountedRef.current) return;
        if (onVerifiedRef.current) {
          onVerifiedRef.current(student, person, key);
        } else if (onScanSuccessRef.current) {
          onScanSuccessRef.current(student, person, key);
        }
      }, 900);
    } else {
      if (isMountedRef.current) {
        setScanResult({
          success: false,
          error: verification.error || 'Código QR no reconocido o sin autorización.',
        });
      }
      // Reset error after 3 seconds to keep scanning
      setTimeout(() => {
        if (isMountedRef.current) {
          setScanResult((prev) => (prev?.success ? prev : null));
        }
      }, 3000);
    }
  }, [stopCamera]);

  // Scan frame from video element using jsQR - throttled to ~10-12 FPS to avoid CPU stutter & flickering
  const scanVideoFrame = useCallback(() => {
    if (!isScanningRef.current || !isMountedRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const now = performance.now();
    // Only scan every 90ms to keep video playback smooth and avoid CPU choke
    if (now - lastScanTimestamp.current > 90) {
      lastScanTimestamp.current = now;

      if (
        video &&
        canvas &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            // Keep scan resolution bounded to avoid processing massive 4K frames
            const maxDimension = 640;
            let targetWidth = video.videoWidth;
            let targetHeight = video.videoHeight;
            if (targetWidth > maxDimension) {
              const scale = maxDimension / targetWidth;
              targetWidth = maxDimension;
              targetHeight = Math.round(targetHeight * scale);
            }

            if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
              canvas.width = targetWidth;
              canvas.height = targetHeight;
            }

            ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code && code.data && code.data.trim().length > 0) {
              handleDecodedString(code.data);
              return; // Decoded, stop animation loop here
            }
          }
        } catch (e) {
          console.warn('Scan frame processing error:', e);
        }
      }
    }

    // Continue scanning next frame
    if (isScanningRef.current && isMountedRef.current) {
      animationFrameId.current = requestAnimationFrame(scanVideoFrame);
    }
  }, [handleDecodedString]);

  // Start webcam with stable dependencies to avoid repeated recreation and loops
  const startCamera = useCallback(async () => {
    // If a stream is already active and playing, do not recreate it
    if (
      streamRef.current &&
      streamRef.current.active &&
      videoRef.current &&
      videoRef.current.srcObject === streamRef.current
    ) {
      setCameraActive(true);
      setCameraLoading(false);
      isScanningRef.current = true;
      if (!animationFrameId.current) {
        animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      }
      return;
    }

    setCameraLoading(true);
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La API de cámara no está disponible en este navegador o entorno.');
      }

      // Stop any stale tracks before requesting new ones
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Make sure play is called cleanly
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play interrupted or waiting for user interaction:', playErr);
        }
      }

      if (isMountedRef.current) {
        setCameraActive(true);
        setCameraLoading(false);
        isScanningRef.current = true;
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        animationFrameId.current = requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: any) {
      console.warn('Webcam start error:', err);
      if (isMountedRef.current) {
        setCameraError(
          'No se pudo acceder a la cámara en vivo (puede estar bloqueada o sin permisos). Puedes subir una imagen del QR o utilizar las credenciales rápidas de prueba.'
        );
        setCameraActive(false);
        setCameraLoading(false);
      }
    }
  }, [scanVideoFrame]);

  // MOUNT/UNMOUNT: only runs on modal mounting or closing
  useEffect(() => {
    isMountedRef.current = true;
    isScanningRef.current = true;
    startCamera();

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Handle uploaded image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          handleDecodedString(code.data);
        } else {
          setScanResult({
            success: false,
            error: 'No se detectó un código QR legible en la imagen seleccionada.',
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Test simulation shortcut for fast testing
  const handleSimulateScan = (serialized: string) => {
    handleDecodedString(serialized);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-6 animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                actionType === 'recepcion'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-pink-100 text-pink-700'
              }`}
            >
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Escanear QR de {actionType === 'recepcion' ? 'Recepción (Entrada)' : 'Entrega (Salida)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Apunta la credencial digital o física al lector para verificar la identidad
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="mt-4 relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 aspect-4/3 flex items-center justify-center">
          {/* Video element is permanently mounted to prevent stream restarts/flickering */}
          <video
            ref={videoRef}
            playsInline
            autoPlay
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              cameraActive ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner Optical Reticle */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-56 h-56 border-2 border-dashed border-pink-400/90 rounded-2xl relative shadow-2xl">
                {/* Smooth laser scanline */}
                <div className="absolute inset-x-0 h-0.5 bg-pink-500 shadow-[0_0_12px_#EC4899] animate-pulse" />
                <span className="absolute -bottom-6 inset-x-0 text-center text-[10px] font-bold tracking-wider text-pink-300 drop-shadow">
                  ENFOCAR CÓDIGO QR AQUÍ
                </span>
              </div>
            </div>
          )}

          {/* Loading state indicator */}
          {cameraLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 text-white gap-2">
              <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-slate-300">Conectando con la cámara...</span>
            </div>
          )}

          {/* Camera Error / Fallback State */}
          {!cameraActive && !cameraLoading && (
            <div className="p-6 text-center text-slate-300 text-xs space-y-3 max-w-xs relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {cameraError || 'Cámara no disponible en este momento.'}
              </p>
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reintentar Cámara
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" /> Cargar Foto / Archivo QR
                </button>
              </div>
            </div>
          )}

          {/* Success Overlay */}
          {scanResult?.success && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 text-center animate-scaleIn z-20">
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center mb-3 shadow-lg">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-base font-bold">¡Credencial Verificada con Éxito!</h4>
              <p className="text-xs text-emerald-200 mt-1">
                Alumno: <strong className="text-white">{scanResult.studentName}</strong>
              </p>
              <p className="text-xs text-emerald-300">
                Tutor Autorizado: <strong className="text-white">{scanResult.personName}</strong> (
                {scanResult.role})
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" /> Cifrado Autenticado
              </span>
            </div>
          )}

          {/* Error Banner inside scanner */}
          {scanResult && !scanResult.success && (
            <div className="absolute bottom-3 inset-x-3 bg-rose-900/90 text-white p-2.5 rounded-xl text-xs flex items-center gap-2 border border-rose-700 shadow-lg z-20">
              <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
              <span className="text-[11px] leading-tight">{scanResult.error}</span>
            </div>
          )}
        </div>

        {/* Alternate Options / File Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />

        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" /> Cargar Imagen QR
          </button>
          {cameraActive && (
            <button
              type="button"
              onClick={stopCamera}
              className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer"
            >
              Pausar Cámara
            </button>
          )}
        </div>

        {/* Manual Key Verification Fallback */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            ¿No tienes cámara? Introduce la llave criptográfica del pase:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej. KND-PAR-LUCA-98F2-2026"
              value={manualKeyInput}
              onChange={(e) => setManualKeyInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-pink-300"
            />
            <button
              type="button"
              onClick={() => {
                if (manualKeyInput.trim()) {
                  handleDecodedString(manualKeyInput.trim());
                }
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Validar
            </button>
          </div>
        </div>

        {/* Quick Test Credential Bar (for instant review - ONLY IN DEBUG MODE) */}
        {isDebugMode && (
          <div className="mt-3 pt-3 border-t border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" /> Simular Escaneo Rápido (Modo Depuración):
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
              {students.slice(0, 6).map((std) => {
                const parentPayload = createParentQrPayload({
                  id: std.id,
                  name: std.name,
                  father: std.father,
                  mother: std.mother,
                  parentQrKey: std.parentQrKey || 'KND-PAR-TEST',
                });
                const serializedParent = serializeQrPayload(parentPayload);

                return (
                  <div key={std.id} className="flex gap-1 items-center">
                    <button
                      type="button"
                      onClick={() => handleSimulateScan(serializedParent)}
                      className="px-2 py-1 bg-pink-50 hover:bg-pink-100 text-pink-900 rounded-lg text-[10px] font-medium border border-pink-200 transition cursor-pointer truncate max-w-[170px]"
                      title={`Escanear pase de padres para ${std.name}`}
                    >
                      Padres de {std.name.split(' ')[0]}
                    </button>
                    {std.trustedFamilyList && std.trustedFamilyList.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const fam = std.trustedFamilyList![0];
                          const famPayload = createTrustedContactQrPayload(
                            { id: std.id, name: std.name },
                            fam
                          );
                          handleSimulateScan(serializeQrPayload(famPayload));
                        }}
                        className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-900 rounded-lg text-[10px] font-medium border border-sky-200 transition cursor-pointer truncate max-w-[150px]"
                        title={`Escanear pase familiar: ${std.trustedFamilyList[0].name}`}
                      >
                        {std.trustedFamilyList[0].name.split(' ')[0]} ({std.trustedFamilyList[0].relation})
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
