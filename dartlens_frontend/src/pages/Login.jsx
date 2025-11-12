// src/pages/Login.jsx
// 로그인 페이지 완성본
// - 입력: 이메일, 비밀번호, 자동 로그인(선택)
// - 유효성 검증: 이메일 형식, 비밀번호 공란 금지
// - 접근성: aria-invalid, aria-describedby, role="alert" 사용
// - UX: 비밀번호 표시/숨김 토글, 제출 중 중복 클릭 방지
// - 라우팅: 성공 시 /dashboard 로 이동(모의 지연). 서버 연동 시 fetch/axios로 교체

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { afterLogin } = useAuth();
  // 폼 상태
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });

  // UI 상태
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const loc = useLocation();

  // 간단한 이메일 정규식 (서버에서 최종 검증 필요)
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // 단일 필드 검증
  const validateField = (name, value) => {
    switch (name) {
      case "email":
        if (!value.trim()) return "이메일을 입력하세요.";
        if (!emailRe.test(value)) return "이메일 형식을 확인하세요.";
        return "";
      case "password":
        if (!value) return "비밀번호를 입력하세요.";
        return "";
      default:
        return "";
    }
  };

  // 전체 검증
  const validateAll = (data) => {
    const next = {};
    for (const k of ["email", "password"]) {
      const m = validateField(k, data[k]);
      if (m) next[k] = m;
    }
    return next;
  };

  // 입력 변경
  const onChange = (e) => {
    const { name, type } = e.target;
    const value = type === "checkbox" ? e.target.checked : e.target.value;

    setForm((prev) => ({ ...prev, [name]: value }));

    // 즉시 에러 갱신
    const msg = validateField(name, value);
    setErrors((prev) => {
      const copy = { ...prev };
      if (msg) copy[name] = msg;
      else delete copy[name];
      return copy;
    });
  };

  // 제출
  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const nextErrors = validateAll(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSubmitting(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          remember: form.remember,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data?.message || "로그인 실패");
        setSubmitting(false);
        return;
      }
      alert(data.message); // 로그인 성공 알림
      await afterLogin();
      navigate("/", { replace: true });

    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        submit: err?.message || "일시적인 오류가 발생했습니다. 다시 시도하세요.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  // 비밀번호 표시/숨김 토글
  const PwToggle = ({ on, setOn }) => (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
      aria-pressed={on}
      title={on ? "비밀번호 숨기기" : "비밀번호 표시"}
    >
      {on ? "숨기기" : "표시"}
    </button>
  );

  const isValid = emailRe.test(form.email) && !!form.password;

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl mb-1">로그인</h1>
            <p className="text-sm text-gray-500 mb-5">
              이메일과 비밀번호를 입력하세요.
            </p>
          </div>
          <Link to="/" aria-label="Go home" title="Home" className="shrink-0">
            <img
              src="/DL_logo.png"
              alt="DART : Lens"
              className="h-12 w-auto transition-transform duration-150 hover:scale-95 mb-6"
            />
          </Link>
        </div>

        {/* 서버/제출 에러 */}
        {errors.submit && (
          <div
            className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {errors.submit}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          {/* 이메일 */}
          <label htmlFor="email" className="block text-sm mb-1">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={`input-base ${
              errors.email
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-200"
            }`}
            value={form.email}
            onChange={onChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="user@example.com"
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.email}
            </p>
          )}

          {/* 비밀번호 */}
          <div className="flex items-center justify-between mt-4">
            <label htmlFor="password" className="block text-sm">
              비밀번호
            </label>
            <PwToggle on={showPw} setOn={setShowPw} />
          </div>
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            className={`input-base ${
              errors.password
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-200"
            }`}
            value={form.password}
            onChange={onChange}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            placeholder="비밀번호"
          />
          {errors.password && (
            <p
              id="password-error"
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              {errors.password}
            </p>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={!isValid || submitting}
            className={`mt-6 w-full rounded-md px-4 py-2 text-sm text-white ${
              !isValid || submitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            aria-disabled={!isValid || submitting}
          >
            {submitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        {/* 보조 링크 */}
        <p className="mt-4 text-xs text-gray-600">
          계정이 없으신가요?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
