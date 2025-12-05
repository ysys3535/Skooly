// src/pages/SignupPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/auth";

export default function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    username: "",      // 로그인 아이디로 사용할 이메일
    password: "",
    passwordConfirm: "",
    gender: "None",    // "MALE" | "FEMALE" | "None"
    birthDate: "",     // YYYY-MM-DD
    phone: "",         // "010-1234-5678"
    agree: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.passwordConfirm) {
      alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (!form.agree) {
      alert("이용약관 및 개인정보 처리방침에 동의해주세요.");
      return;
    }

    if (!form.birthDate) {
      alert("생년월일을 입력해주세요.");
      return;
    }

    if (!form.phone) {
      alert("휴대폰 번호를 입력해주세요.");
      return;
    }

    // 휴대폰 번호 형식: 010-####-####
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(form.phone)) {
      alert("휴대폰 번호는 010-1234-5678 형식으로 입력해주세요.");
      return;
    }

    // gender 값 정리: "None"이면 서버에는 null로 보냄
    const genderForApi =
      form.gender === "None" ? null : form.gender;

    setIsLoading(true);

    try {
      await signup({
        username: form.username.trim(),  // 로그인 아이디
        password: form.password,
        name: form.name.trim(),
        gender: genderForApi,
        birthDate: form.birthDate,
        email: form.username.trim(),     // 백엔드 email 필드에는 같은 값 사용
        phone: form.phone.trim(),        // 010-####-####
      });

      alert("회원가입이 완료되었습니다!");
      navigate("/login");
    } catch (error) {
      console.error(error);
      alert(error.message || "회원가입에 실패했습니다 🥲");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">
          회원가입
        </h1>
        <p className="mt-1 text-xs text-gray-500 md:text-sm">
          관리자 또는 동호회 대표 정보를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* 이름 */}
          <div>
            <div className="mb-1 block text-xs font-medium text-gray-700 md:text-sm">
              이름
            </div>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-100 focus:border-blue-500 focus:ring-2"
              placeholder="홍길동"
            />
          </div>

          {/* 이메일(→ username) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 md:text-sm">
              이메일 (로그인 아이디)
            </label>
            <input
              type="email"
              name="username"
              required
              value={form.username}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-100 focus:border-blue-500 focus:ring-2"
              placeholder="example@school.or.kr"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 md:text-sm">
              비밀번호
            </label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-100 focus:border-blue-500 focus:ring-2"
              placeholder="8자 이상, 영문/숫자 조합"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 md:text-sm">
              비밀번호 확인
            </label>
            <input
              type="password"
              name="passwordConfirm"
              required
              value={form.passwordConfirm}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-100 focus:border-blue-500 focus:ring-2"
              placeholder="다시 한 번 입력하세요"
            />
          </div>

          {/* 성별 */}
          <div>
            <p className="mb-1 block text-xs font-medium text-gray-700 md:text-sm">
              성별
            </p>
            <div className="flex gap-3 text-[11px] md:text-xs">
              {[
                { label: "선택 안함", value: "None" },
                { label: "여성", value: "FEMALE" },
                { label: "남성", value: "MALE" },
              ].map((g) => (
                <label
                  key={g.value}
                  className="inline-flex items-center gap-1 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g.value}
                    checked={form.gender === g.value}
                    onChange={handleChange}
                    className="h-3 w-3"
                  />
                  {g.label}
                </label>
              ))}
            </div>
          </div>

          {/* 생년월일 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 md:text-sm">
              생년월일
            </label>
            <input
              type="date"
              name="birthDate"
              required
              value={form.birthDate}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-100 focus:border-blue-500 focus:ring-2"
            />
          </div>

          {/* 휴대폰 번호 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 md:text-sm">
              휴대폰 번호
            </label>
            <input
              type="text"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-100 focus:border-blue-500 focus:ring-2"
              placeholder="010-1234-5678"
            />
            <p className="mt-1 text-[11px] text-gray-400 md:text-xs">
              형식: 010-1234-5678
            </p>
          </div>

          {/* 약관 동의 */}
          <label className="flex items-start gap-2 text-[11px] text-gray-500 md:text-xs">
            <input
              type="checkbox"
              name="agree"
              checked={form.agree}
              onChange={handleChange}
              className="mt-0.5 h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>서비스 이용약관 및 개인정보 처리방침에 동의합니다.</span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? "회원가입 중..." : "회원가입"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500 md:text-sm">
          이미 계정이 있다면{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:underline"
          >
            로그인
          </Link>
          으로 이동하세요.
        </p>
      </div>
    </div>
  );
}
