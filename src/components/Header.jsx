// src/components/Header.jsx
import { Link, useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  // 🔹 렌더될 때마다 현재 로그인 상태를 바로 localStorage에서 읽음
  const memberId = localStorage.getItem("memberId");
  const username = localStorage.getItem("username");
  const name = localStorage.getItem("name");

  const isLoggedIn = !!(memberId || username || name);
  const userName = name || username || "";

  const handleLogout = () => {
    // 토큰/유저 정보 정리
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("memberId");
    localStorage.removeItem("username");
    localStorage.removeItem("name");

    alert("로그아웃 되었습니다.");
    navigate("/login");
    // 필요하면 완전 초기화용
    // window.location.reload();
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        {/* 로고 */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
            S
          </div>
          <span className="text-2xl font-bold md:text-2xl">
            Skooly
          </span>
        </Link>

        {/* 메뉴 */}
        <nav className="flex items-center gap-5 text-s text-gray md:text-sm">
          <Link to="/" className="hover:text-blue-600">
            홈
          </Link>
          <Link to="/clubs" className="hover:text-blue-600">
            동호회
          </Link>
          <Link to="/chatbot" className="hover:text-blue-600">
            챗봇
          </Link>
          <Link to="/mypage" className="hover:text-blue-600">
            마이페이지
          </Link>

          {isLoggedIn ? (
            <>
              <span className="ml-4 font-semibold text-blue-700">
                {userName ? `${userName}님, 환영합니다!` : "환영합니다!"}
              </span>
              <button
                onClick={handleLogout}
                className="ml-2 rounded-full border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-blue-500 hover:text-blue-600"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-full border border-gray-300 px-3 py-1 font-medium hover:border-blue-500 hover:text-blue-600 md:block"
              >
                로그인
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 md:px-4 md:text-sm"
              >
                회원가입
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
