const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── SEGURIDAD ───────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // El frontend usa scripts inline y CDN externos
}));

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.WEBSITE_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permite peticiones sin origin (apps móviles, curl, etc.) y orígenes configurados
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origen no permitido → ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limit general: 100 peticiones cada 15 min
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta más tarde.' },
}));

// Rate limit de login: 10 intentos cada 15 min
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login. Intenta en 15 minutos.' },
}));

// ─── PARSERS ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── LOGGING ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── HEALTH CHECK ────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'EN PIN CH Admin API', timestamp: new Date().toISOString() });
});

// ─── ARCHIVOS ESTÁTICOS (frontend) ───────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── RUTAS ───────────────────────────────────────────────
app.use('/api', routes);

// Cualquier ruta no-API sirve el admin (SPA fallback)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
  }
});

// ─── ERROR HANDLER ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
