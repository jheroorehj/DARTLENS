// src/pages/Signup.jsx
// 회원가입 페이지 완성본
// - 입력 항목: 이름, 이메일, 비밀번호, 비밀번호 확인, 약관 동의(필수), 광고 수신 동의(선택)
// - 클라이언트 유효성 검증: 이름 규칙(특수문자X,모음자음단일사용X), 이메일 형식, 비밀번호 규칙(8자 이상, 영문+숫자 포함), 일치 여부, 약관 동의
// - 접근성: aria-invalid, aria-describedby, role="alert" 등 사용
// - UX: 비밀번호 표시/숨김 토글, 실시간 에러 메시지, 제출 중 중복 클릭 방지
// - 라우팅: 성공 시 /login 으로 이동(모의 지연 후). 서버 연동 시 fetch/axios로 교체

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  // 폼 상태
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    agreeTerms: false,
    agreeMarketing: false,
  });

  // UI 상태
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  // 간단한 유효성 검사 규칙
  // - 이메일: 대략적 형식 체크(서버에서 최종 검증 필요)
  // - 비밀번호: 8자 이상 + 영문 + 숫자 포함(특수문자 선택)
  const emailRe =
    // RFC 완전 구현이 아님. 일반 사용자 입력용 가벼운 검사.
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const pwRe = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W_]{8,}$/;

  // 필드 단위 검증
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

  // 폼 전체 검증
  const validateAll = (data) => {
    const nextErrors = {};

    for (const key of ["name", "email", "password", "confirm", "agreeTerms"]) {
      const msg = validateField(key, data[key]);
      if (msg) nextErrors[key] = msg;
    }

    // 이름에 특수문자·숫자 남아 있는지 최종 점검 (회원가입 시점)
    if (!nextErrors.name && /[^가-힣a-zA-Z\s]/.test(data.name)) {
      nextErrors.name = "이름에 허용되지 않는 문자가 남아 있습니다.";
    }

    return nextErrors;
  };

  // 입력 핸들러
  const onChange = (e) => {
    const { name, type } = e.target;
    const value = type === "checkbox" ? e.target.checked : e.target.value;

    setForm((prev) => ({ ...prev, [name]: value }));

    // 입력 즉시 해당 필드 에러 갱신
    const msg = validateField(name, value);
    setErrors((prev) => {
      const copy = { ...prev };
      if (msg) copy[name] = msg;
      else delete copy[name];
      // password 변경 시 confirm 재검증
      if (name === "password" && form.confirm) {
        const msg2 = validateField("confirm", form.confirm);
        if (msg2) copy.confirm = msg2;
        else delete copy.confirm;
      }
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
        throw new Error(errJson?.message || "회원가입 실패");
      }
      alert(data.message); // 간단한 알림 (또는 toast로 변경 가능)
      navigate("/login", { replace: true });      

    } catch (err) {
      // 서버 에러 메시지 매핑 예시
      setErrors((prev) => ({
        ...prev,
        submit: err?.message || "일시적인 오류가 발생했습니다. 다시 시도하세요.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  // 비밀번호 토글 버튼 공통
  const PwToggle = ({ on, setOn, labelId }) => (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
      aria-controls={labelId}
      aria-pressed={on}
      title={on ? "비밀번호 숨기기" : "비밀번호 표시"}
    >
      {on ? "숨기기" : "표시"}
    </button>
  );

  // 폼 유효 여부(버튼 활성 조건)
  const isValid =
    form.name &&
    emailRe.test(form.email) &&
    pwRe.test(form.password) &&
    form.password === form.confirm &&
    form.agreeTerms;

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border bg-white p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl mb-1">회원가입</h1>
            <p className="text-sm text-gray-500 mb-5">
              아래 정보를 입력하고 약관에 동의하세요.
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
          {/* 이름 */}
          <label htmlFor="name" className="block text-sm mb-1">
            이름
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className={`input-base ${
              errors.name
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-200"
            }`}
            value={form.name}
            onChange={onChange}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            placeholder="홍길동"
          />
          {errors.name && (
            <p id="name-error" className="mt-1 text-xs text-red-600" role="alert">
              {errors.name}
            </p>
          )}

          {/* 이메일 */}
          <label htmlFor="email" className="block text-sm mt-4 mb-1">
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
            <PwToggle on={showPw} setOn={setShowPw} labelId="password" />
          </div>
          <input
            id="password"
            name="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            className={`input-base ${
              errors.password
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-200"
            }`}
            value={form.password}
            onChange={onChange}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            placeholder="8자 이상, 영문+숫자 포함"
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

          {/* 비밀번호 확인 */}
          <div className="flex items-center justify-between mt-4">
            <label htmlFor="confirm" className="block text-sm">
              비밀번호 확인
            </label>
            <PwToggle on={showPw2} setOn={setShowPw2} labelId="confirm" />
          </div>
          <input
            id="confirm"
            name="confirm"
            type={showPw2 ? "text" : "password"}
            autoComplete="new-password"
            className={`input-base ${
              errors.confirm
                ? "border-red-300 focus:ring-red-200"
                : "border-gray-300 focus:ring-blue-200"
            }`}
            value={form.confirm}
            onChange={onChange}
            aria-invalid={Boolean(errors.confirm)}
            aria-describedby={errors.confirm ? "confirm-error" : undefined}
            placeholder="비밀번호를 다시 입력"
          />
          {errors.confirm && (
            <p
              id="confirm-error"
              className="mt-1 text-xs text-red-600"
              role="alert"
            >
              {errors.confirm}
            </p>
          )}

          {/* 약관 및 광고 수신 동의 */}
          <div className="mt-5 space-y-2">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={form.agreeTerms}
                onChange={onChange}
                className="mt-0.5"
                aria-invalid={Boolean(errors.agreeTerms)}
                aria-describedby={errors.agreeTerms ? "terms-error" : undefined}
              />
              <span>
                서비스 이용약관 및 개인정보 처리방침에 동의합니다
                <span className="text-gray-500"> (필수)</span>
              </span>
            </label>
            {errors.agreeTerms && (
              <p id="terms-error" className="text-xs text-red-600" role="alert">
                {errors.agreeTerms}
              </p>
            )}
            {/*<label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                name="agreeMarketing"
                checked={form.agreeMarketing}
                onChange={onChange}
                className="mt-0.5"
              />
              <span>
                이메일 및 푸시를 통한 이벤트, 혜택 안내 수신에 동의합니다
                <span className="text-gray-500"> (선택)</span>
              </span>
            </label>*/}
          </div>

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
            {submitting ? "가입 처리 중..." : "가입하기"}
          </button>
        </form>

        {/* 보조 링크 */}
        <p className="mt-4 text-xs text-gray-600">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
