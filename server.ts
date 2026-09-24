import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Server-side encrypted password configuration
// We use PBKDF2 with SHA-512 and a secure salt.
const SERVER_SALT = process.env.DEBUG_SALT || 'kinder_secure_salt_7c8d9e0f1a2b3c4d5e6f';
const ITERATIONS = 100000;
const KEY_LEN = 64;
const DIGEST = 'sha512';

// Authorized passwords (default: 'kinder2026' and 'AdminDebug2026!')
const authorizedPasswords = [
  process.env.DEBUG_PASSWORD || 'kinder2026',
  'AdminDebug2026!',
];

// Precompute secure cryptographic hashes
const storedHashes: Buffer[] = authorizedPasswords.map((pwd) =>
  crypto.pbkdf2Sync(pwd, SERVER_SALT, ITERATIONS, KEY_LEN, DIGEST)
);

// Active session tokens with 2-hour TTL
const activeSessions = new Map<string, number>();

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, expiry] of activeSessions.entries()) {
    if (expiry <= now) {
      activeSessions.delete(token);
    }
  }
}

// 1. Endpoint: POST /api/debug/verify
app.post('/api/debug/verify', (req, res) => {
  cleanExpiredSessions();
  const { password } = req.body || {};

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Por favor ingresa una contraseña válida.',
    });
  }

  // Derive hash of candidate password using server salt and PBKDF2
  const candidateHash = crypto.pbkdf2Sync(password.trim(), SERVER_SALT, ITERATIONS, KEY_LEN, DIGEST);

  // Compare against stored hashes in constant time to avoid timing attacks
  let isAuthenticated = false;
  for (const validHash of storedHashes) {
    if (crypto.timingSafeEqual(candidateHash, validHash)) {
      isAuthenticated = true;
      break;
    }
  }

  if (!isAuthenticated) {
    return res.status(401).json({
      success: false,
      error: 'Contraseña de depuración incorrecta. Acceso denegado.',
    });
  }

  // Generate a cryptographically random session token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 2 * 60 * 60 * 1000; // 2 hours
  activeSessions.set(token, expiresAt);

  return res.json({
    success: true,
    message: 'Modo de depuración desbloqueado con éxito.',
    debugMode: true,
    token,
    expiresAt,
  });
});

// 2. Endpoint: GET /api/debug/status
app.get('/api/debug/status', (req, res) => {
  cleanExpiredSessions();
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token && activeSessions.has(token)) {
    const expiresAt = activeSessions.get(token)!;
    if (expiresAt > Date.now()) {
      return res.json({
        active: true,
        debugMode: true,
        expiresAt,
      });
    }
  }

  return res.json({
    active: false,
    debugMode: false,
  });
});

// 3. Endpoint: POST /api/debug/revoke
app.post('/api/debug/revoke', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token) {
    activeSessions.delete(token);
  }
  return res.json({ success: true, message: 'Modo de depuración desactivado.' });
});

// Vite or static serving
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
