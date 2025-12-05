// src/pages/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ✅ 로그인 요청 (username, password)
      const result = await login({
        username: form.username.trim(),
        password: form.password,
      });

      console.log("로그인 성공 result:", result);

      // ※ unwrapResult를 쓰니까 여기까지 왔다는 건 이미 isSuccess=true 라는 뜻이라
      // result.success 체크는 사실 필요 없지만, 혹시 몰라서 false인 경우만 막아둠.
      if (result && result.success === false) {
        throw new Error("로그인 실패: 아이디 또는 비밀번호를 확인해주세요.");
      }

      // 🔥 여기 핵심: 더 이상 demo 절대 안 씀

      // 이전에 남아있던 accessToken 삭제
      localStorage.removeItem("accessToken");

      // 서버에서 accessToken을 내려줄 때만 저장
      if (result && result.accessToken) {
        localStorage.setItem("accessToken", result.accessToken);
      }
      // storage 이벤트 트리거 (Header 리렌더링 등)
      window.dispatchEvent(new Event("storage"));

      // ✅ 기타 사용자 정보 저장
      if (result?.memberId !== undefined && result.memberId !== null) {
        localStorage.setItem("memberId", String(result.memberId));
      }
      if (result?.username) {
        localStorage.setItem("username", result.username);
      }
      if (result?.name) {
        localStorage.setItem("name", result.name);
      }

      alert(`${result?.name || "사용자"}님, 로그인에 성공했습니다!`);
      navigate("/");
    } catch (error) {
      console.error("로그인 실패:", error);
      alert(error.message || "로그인에 실패했습니다 🥲");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">로그인</h1>
        <p className="mt-1 text-xs text-gray-500 md:text-sm">
          School Sports 계정으로 로그인해주세요.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* 이메일 → username */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 md:text-sm">
              이메일
            </label>
            <input
              type="email"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
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
              value={form.password}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-100 focus:border-blue-500 focus:ring-2"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-gray-500 md:text-sm">
          아직 계정이 없다면{" "}
          <Link
            to="/signup"
            className="font-semibold text-blue-600 hover:underline"
          >
            회원가입
          </Link>
          을 진행해주세요.
        </p>
      </div>
    </div>
  );
}
