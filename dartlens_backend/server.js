// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './src/routes/auth.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import wishlistRouter from "./src/routes/wishlist.js";
import adminRouter from "./src/routes/admin.js";
import { initSchedulers } from "./src/routes/scheduler.js";
import corpsRouter from './src/routes/corps.js';
import insightsRouter from './src/routes/insights.js';
import corpcodesRouter from "./src/routes/corpcodes.js";
import requireAdmin from "./src/middleware/requireAdmin.js";

const app = express();

if (process.env.MIGRATE_ON_BOOT === 'true') {
  const { default: run } = await import('./scripts/migrate.mjs');
}

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use("/api/wishlist", wishlistRouter);
app.use('/api/corps', corpsRouter);
app.use('/api/insights', insightsRouter);
app.use("/api/admin", requireAdmin, adminRouter);
app.use("/api/admin/corpcodes", requireAdmin, corpcodesRouter);

app.use(helmet());
app.use(rateLimit({ windowMs: 60_000, max: 300 }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`api on http://localhost:${port}`);
});

if (process.env.CORPCODE_AUTO_SYNC === "1") {
  const tick = async () => {
    try {
      const { runCorpcodesSyncDirect } = await import("./src/jobs/corpcodes.job.js");
      const r = await runCorpcodesSyncDirect();
      console.log("CORPCODE sync:", r);
    } catch (e) {
      console.error("CORPCODE sync failed:", e.message || e);
    }
  };
  // 간단 스케줄: 매 시간 15분에 검사하여 03:15이면 실행
  setInterval(() => {
    const now = new Date();
    if (now.getHours() === 3 && now.getMinutes() === 15) tick();
  }, 60 * 1000);
}

initSchedulers();