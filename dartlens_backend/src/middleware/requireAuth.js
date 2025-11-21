import jwt from "jsonwebtoken";

export default function requireAuth(req, res, next) {
  // cookie-parser가 server.js에 등록되어 있어야 합니다.
  const token = req.cookies?.dl_auth;
  if (!token) return res.status(401).json({ ok: false, message: "인증 필요" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 라우트에서 사용할 사용자 id 주입
    req.user = { id: decoded.uid };
    next();
  } catch {
    return res.status(401).json({ ok: false, message: "인증 필요" });
  }
}