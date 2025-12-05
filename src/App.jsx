// src/App.jsx
import { Routes, Route, Outlet, Navigate, Link } from "react-router-dom";
import Header from "./components/Header.jsx";

import HomePage from "./pages/HomePage.jsx";
import SchoolDetailPage from "./pages/SchoolDetailPage.jsx";
import ClubsPage from "./pages/ClubsPage.jsx";
import ClubDetailPage from "./pages/ClubDetailPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import ResultsPage from "./pages/ResultsPage.jsx";
import ChatbotPage from "./pages/ChatbotPage.jsx";
import MyPage from "./pages/Mypage.jsx";
import ClubRegisterPage from "./pages/ClubRegisterPage.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="pt-[72px]">
        <Outlet />
      </div>

      {/* 우측 하단 고정 챗봇 버튼 */}
      <Link
        to="/chatbot"
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 md:h-14 md:w-14"
        aria-label="체육시설 예약 챗봇으로 이동"
      >
        <span className="text-xl md:text-2xl">🤖</span>
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<ResultsPage />} />
        <Route path="/school/:schoolId" element={<SchoolDetailPage />} />
        <Route path="/clubs" element={<ClubsPage />} />
        <Route path="/clubs/new" element={<ClubRegisterPage />} />
        <Route path="/clubs/:clubId" element={<ClubDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />

        {/* 🔐 마이페이지 보호 라우트 */}
        <Route
          path="/mypage"
          element={
            <ProtectedRoute>
              <MyPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
