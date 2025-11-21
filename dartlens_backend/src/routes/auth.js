import { Router } from 'express';
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// 서버측 검증 함수
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const pwRe = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W_]{8,}$/;
const nameBadChar = /[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s]/;

function makeToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
}

// 회원가입
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, agreeMarketing } = req.body || {};

    // 서버측 유효성 검사
    if (!name || !name.trim() || name.length > 40 || nameBadChar.test(name))
      return res.status(400).json({ message: '이름 형식을 확인하세요.' });
    if (!email || !emailRe.test(email))
      return res.status(400).json({ message: '이메일 형식을 확인하세요.' });
    if (!password || !pwRe.test(password))
      return res.status(400).json({ message: '비밀번호 규칙을 확인하세요.' });

    // 이메일 중복 확인
    const [dup] = await pool.query('SELECT id FROM users WHERE email = ?', [email?.toLowerCase()]);
    if (dup.length) return res.status(409).json({ message: '이미 가입된 이메일입니다.' });

    const hash = await bcrypt.hash(password, 12);

    await pool.query(
      'INSERT INTO users (name, email, password_hash, marketing) VALUES (?, ?, ?, ?)',
      [name.trim(), email.toLowerCase(), hash, agreeMarketing ? 1 : 0]
    );

    return res.status(201).json({ ok: true, message: '회원가입이 완료되었습니다.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '서버 오류' });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body || {};

    if (!email || !emailRe.test(email))
      return res.status(400).json({ message: '이메일 형식을 확인하세요.' });
    if (!password) return res.status(400).json({ message: '비밀번호를 입력하세요.' });

    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    if (!rows.length) return res.status(401).json({ ok: false,  message: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ ok: false,  message: '이메일 또는 비밀번호가 올바르지 않습니다.' });

    const token = makeToken({ uid: user.id });

    // remember에 따라 쿠키 만료 조정
    const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 2; // 30일 vs 2시간
    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('dl_auth', token, {
      httpOnly: true,
      secure: isProd,           // 배포 시 true, 로컬 http 개발 시 false 가능
      sameSite: 'lax',
      maxAge: maxAge * 1000,
      path: '/',
    });

    return res.json({
      ok: true,
      message: '로그인 성공',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: '서버 오류' });
  }
});

// 토큰 검증 예시
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.dl_auth;
    if (!token) return res.status(401).json({ message: '인증 필요' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [decoded.uid]);
    if (!rows.length) return res.status(401).json({ message: '인증 정보가 유효하지 않습니다.' });

    return res.json({ ok: true, user: rows[0] });
  } catch (e) {
    return res.status(401).json({ message: '인증 필요' });
  }
});

// 로그아웃
router.post('/logout', (req, res) => {
  res.clearCookie('dl_auth', { path: '/' });
  return res.json({ ok: true });
});

export default router;
