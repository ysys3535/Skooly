// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // ✅ 로그인 여부를 토큰 + 유저정보 모두로 확인
  const accessToken =
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token");

  const memberId = localStorage.getItem("memberId");
  const username = localStorage.getItem("username");

  const isLoggedIn = !!(accessToken || memberId || username);

  if (!isLoggedIn) {
    alert("로그인 화면으로 이동합니다.");
    return <Navigate to="/login" replace />;
  }

  return children || <Outlet />;
}
