import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Signup.css";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    agreeTerms: false,
    agreeMarketing: false,
  });

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const pwRe = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W_]{8,}$/;

  const validateField = (name, value) => {
    switch (name) {
      case "name":
        if (!value.trim()) return "이름을 입력하세요.";
        if (value.length > 40) return "이름은 40자 이내로 입력하세요.";
        if (/[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z\s]/.test(value))
          return "이름에는 특수문자나 숫자를 포함할 수 없습니다.";
        return "";
      case "email":
        if (!value.trim()) return "이메일을 입력하세요.";
        if (!emailRe.test(value)) return "이메일 형식을 확인하세요.";
        return "";
      case "password":
        if (!value) return "비밀번호를 입력하세요.";
        if (!pwRe.test(value))
          return "비밀번호는 8자 이상이며 영문과 숫자를 포함해야 합니다.";
        return "";
      case "confirm":
        if (!value) return "비밀번호 확인을 입력하세요.";
        if (value !== form.password) return "비밀번호가 일치하지 않습니다.";
        return "";
      case "agreeTerms":
        if (!value) return "약관에 동의해야 가입할 수 있습니다.";
        return "";
      default:
        return "";
    }
  };

  const validateAll = (data) => {
    const nextErrors = {};
    for (const key of ["name", "email", "password", "confirm", "agreeTerms"]) {
      const msg = validateField(key, data[key]);
      if (msg) nextErrors[key] = msg;
    }
    if (!nextErrors.name && /[^가-힣a-zA-Z\s]/.test(data.name)) {
      nextErrors.name = "이름에 허용되지 않는 문자가 남아 있습니다.";
    }
    return nextErrors;
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

      if (name === "password" && form.confirm) {
        const msg2 = validateField("confirm", form.confirm);
        if (msg2) copy.confirm = msg2;
        else delete copy.confirm;
      }
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

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          agreeMarketing: form.agreeMarketing,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.message || "회원가입 실패");
      }
      alert(data.message);
      navigate("/login", { replace: true });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        submit: err?.message || "일시적인 오류가 발생했습니다. 다시 시도하세요.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const PwToggle = ({ on, setOn, labelId }) => (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className="pw-toggle"
      aria-controls={labelId}
      aria-pressed={on}
      title={on ? "비밀번호 숨기기" : "비밀번호 표시"}
    >
      {on ? "숨기기" : "표시"}
    </button>
  );

  const isValid =
    form.name &&
    emailRe.test(form.email) &&
    pwRe.test(form.password) &&
    form.password === form.confirm &&
    form.agreeTerms;

  return (
    <div className="signup-root">
      <div className="signup-card">
        <div className="signup-head">
          <div>
            <h1 className="signup-title">회원가입</h1>
            <p className="signup-sub">아래 정보를 입력하고 약관에 동의하세요.</p>
          </div>
          <Link to="/" aria-label="Go home" title="Home" className="logo-link">
            <img src="/DL_logo.png" alt="DART : Lens" className="logo-img" />
          </Link>
        </div>

        {errors.submit && (
          <div className="submit-error" role="alert">
            {errors.submit}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <label htmlFor="name" className="label">이름</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className={`input ${errors.name ? "input-error" : ""}`}
            value={form.name}
            onChange={onChange}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            placeholder="홍길동"
          />
          {errors.name && (
            <p id="name-error" className="error-text" role="alert">{errors.name}</p>
          )}

          <label htmlFor="email" className="label label-mt">이메일</label>
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
            <p id="email-error" className="error-text" role="alert">{errors.email}</p>
          )}

          <div className="label-row">
            <label htmlFor="password" className="label">비밀번호</label>
            <PwToggle on={showPw} setOn={setShowPw} labelId="password" />
          </div>
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            className={`input ${errors.password ? "input-error" : ""}`}
            value={form.password}
            onChange={onChange}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            placeholder="8자 이상, 영문+숫자 포함"
          />
          {errors.password && (
            <p id="password-error" className="error-text" role="alert">
              {errors.password}
            </p>
          )}

          <div className="label-row">
            <label htmlFor="confirm" className="label">비밀번호 확인</label>
            <PwToggle on={showPw2} setOn={setShowPw2} labelId="confirm" />
          </div>
          <input
            id="confirm"
            name="confirm"
            type={showPw2 ? "text" : "password"}
            autoComplete="new-password"
            className={`input ${errors.confirm ? "input-error" : ""}`}
            value={form.confirm}
            onChange={onChange}
            aria-invalid={Boolean(errors.confirm)}
            aria-describedby={errors.confirm ? "confirm-error" : undefined}
            placeholder="비밀번호를 다시 입력"
          />
          {errors.confirm && (
            <p id="confirm-error" className="error-text" role="alert">
              {errors.confirm}
            </p>
          )}

          <div className="terms-box">
            <label className="terms-row">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={form.agreeTerms}
                onChange={onChange}
                aria-invalid={Boolean(errors.agreeTerms)}
                aria-describedby={errors.agreeTerms ? "terms-error" : undefined}
              />
              <span>
                서비스 이용약관 및 개인정보 처리방침에 동의합니다
                <span className="gray"> (필수)</span>
              </span>
            </label>
            {errors.agreeTerms && (
              <p id="terms-error" className="error-text" role="alert">
                {errors.agreeTerms}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || submitting}
            className={`submit-btn ${!isValid || submitting ? "submit-disabled" : ""}`}
            aria-disabled={!isValid || submitting}
          >
            {submitting ? "가입 처리 중..." : "가입하기"}
          </button>
        </form>

        <p className="bottom-link">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="link-blue">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
