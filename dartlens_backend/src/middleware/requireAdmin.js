// 관리자 인증 미들웨어
export default function requireAdmin(req, res, next) {
  try {
    const header = req.get("X-Admin-Token") || req.get("x-admin-token") || "";
    const expected = (process.env.ADMIN_TOKEN || "dartlens_admin_2025_secret_key").trim();
    if (!header || header !== expected) {
      return res.status(401).json({ ok: false, message: "admin token required" });
    }
    return next();
  } catch (e) {
    console.error("requireAdmin error:", e);
    return res.status(500).json({ ok: false, message: "admin middleware error" });
  }
}

