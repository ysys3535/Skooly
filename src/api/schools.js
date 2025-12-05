// src/api/schools.js
import { api } from "./http";
import { unwrapResult } from "./response";

// 학교 목록 검색 (/school/search, POST + page query)
export const searchSchools = async ({ keyword = "", page = 1 } = {}) => {
  const res = await api.post(`/school/search?page=${page}`, {
    keyword,
  });
  return unwrapResult(res); // 기대: schools 배열/페이지 정보
};

// 호환용 alias
export const findSchools = searchSchools;
