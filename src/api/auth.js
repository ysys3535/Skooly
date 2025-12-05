// src/api/auth.js
import { api } from "./http";
import { unwrapResult } from "./response";

// ✅ 회원가입
export const signup = async ({
  username,
  password,
  name,
  gender,
  birthDate,
  email,
  phone,
}) => {
  const res = await api.post("/auth/signup", {
    username,
    password,
    name,
    gender,
    birthDate,
    email,
    phone,
  });
  return unwrapResult(res);
};

// ✅ 로그인
export const login = async ({ username, password }) => {
  const res = await api.post("/auth/login", { username, password });
  return unwrapResult(res);
};

// ✅ 로그아웃
export const logout = async () => {
  const res = await api.post("/auth/logout");
  return unwrapResult(res);
};

// ✅ 내 프로필 조회 (GET /members/me)
export const getMyProfile = async () => {
  const res = await api.get("/members/me");
  return unwrapResult(res); // { memberId, name, email, ... } 이런 형태라고 가정
};

// ✅ 내 프로필 수정 (PATCH /members/{memberId})
export const updateMyProfile = async (memberId, payload) => {
  const res = await api.patch(`/members/${memberId}`, payload);
  return unwrapResult(res);
};
