// DART:Lens V2.0 Backend Server
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// V2.0 Routes
import authRouter from './src/routes/auth.js';
import wishlistRouter from "./src/routes/wishlist.js";
import corpsRouter from './src/routes/corps.js';
import insightsRouter from './src/routes/insights.js';
import insightsV2Router from './src/routes/insightsV2.js';
import adminRouter from "./src/routes/admin.js";

// Middleware
import requireAdmin from "./src/middleware/requireAdmin.js";

const app = express();
const PORT = process.env.PORT || 5001;

// Auto-migrate on boot (if enabled)
if (process.env.MIGRATE_ON_BOOT === 'true') {
  const { runMigrations } = await import('./scripts/migrate.mjs');
  await runMigrations();
  console.log('[Server] Database migration completed');
}

// Security middleware (relaxed CSP for SPA)
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for SPA compatibility
}));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, mobile apps, etc.)
    if (!origin) return callback(null, true);
    // Allow configured origins
    if (corsOrigins.includes(origin)) return callback(null, true);
    // Allow trycloudflare.com subdomains
    if (origin.endsWith('.trycloudflare.com')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting (100 requests per minute)
app.use(rateLimit({
  windowMs: 60_000,
  max: 100,
  message: { success: false, error: '요청 제한을 초과했습니다. 잠시 후 다시 시도하세요.' }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes (V2.0)
app.use('/api/auth', authRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/corps', corpsRouter);
app.use('/api/insights/v2', insightsV2Router); // V2.0: 정규화 + KPI 통합
app.use('/api/insights', insightsRouter);      // Legacy: 하위 호환성 유지
app.use('/api/admin', requireAdmin, adminRouter);

// Serve Frontend static files (production)
const frontendPath = path.join(__dirname, '../dartlens_web/dist');
app.use(express.static(frontendPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 handler for API routes only
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 리소스를 찾을 수 없습니다.',
    code: 'NOT_FOUND'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: '유효하지 않은 토큰입니다.',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: '토큰이 만료되었습니다.',
      code: 'TOKEN_EXPIRED'
    });
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: '중복된 데이터입니다.',
      code: 'DUPLICATE_ENTRY'
    });
  }

  // Default 500 error
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? '서버 오류가 발생했습니다.'
      : err.message,
    code: err.code || 'INTERNAL_ERROR'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] DART:Lens V2.0 Backend running on port ${PORT}`);
  console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
});
