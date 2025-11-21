import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Login.css"; // 추가

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

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

  const validateAll = (data) => {
    const next = {};
    for (const k of ["email", "password"]) {
      const m = validateField(k, data[k]);
      if (m) next[k] = m;
    }
    return next;
  };

  const onChange = (e) => {
    const { name, type } = e.target;
    const value = type === "checkbox" ? e.target.checked : e.target.value;

    setForm((prev) => ({ ...prev, [name]: value }));

    const msg = validateField(name, value);
    setErrors((prev) => {
      const copy = { ...prev };
      if (msg) copy[name] = msg;
      else delete copy[name];
      return copy;
    });
  };

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

      alert(data.message);
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

  const PwToggle = ({ on, setOn }) => (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className="pw-toggle"
      aria-pressed={on}
      title={on ? "비밀번호 숨기기" : "비밀번호 표시"}
    >
      {on ? "숨기기" : "표시"}
    </button>
  );

  const isValid = emailRe.test(form.email) && !!form.password;

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div>
            <h1 className="login-title">로그인</h1>
            <p className="login-desc">이메일과 비밀번호를 입력하세요.</p>
          </div>
          <Link to="/" aria-label="Go home" title="Home" className="home-link">
            <img src="/DL_logo.png" alt="DART : Lens" className="home-logo" />
          </Link>
        </div>

        {errors.submit && (
          <div className="error-box" role="alert">
            {errors.submit}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="email" className="label">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={`input ${errors.email ? "input-error" : ""}`}
            value={form.email}
            onChange={onChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            placeholder="user@example.com"
          />
          {errors.email && (
            <p id="email-error" className="error-text" role="alert">
              {errors.email}
            </p>
          )}

          <div className="pw-row">
            <label htmlFor="password" className="label">
              비밀번호
            </label>
            <PwToggle on={showPw} setOn={setShowPw} />
          </div>

          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            className={`input ${errors.password ? "input-error" : ""}`}
            value={form.password}
            onChange={onChange}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            placeholder="비밀번호"
          />
          {errors.password && (
            <p id="password-error" className="error-text" role="alert">
              {errors.password}
            </p>
          )}

          <button
            type="submit"
            disabled={!isValid || submitting}
            className={`submit-btn ${
              !isValid || submitting ? "submit-disable" : ""
            }`}
            aria-disabled={!isValid || submitting}
          >
            {submitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="signup-text">
          계정이 없으신가요?{" "}
          <Link to="/signup" className="signup-link">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
