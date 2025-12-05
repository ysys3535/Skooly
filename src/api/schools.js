// src/api/schools.js
import { api } from "./http";
import { unwrapResult } from "./response";

// 학교 목록 검색 (/school/search, POST + page query)
// Body: { cityName, districtName, schoolName }, Query: ?page=1
export const searchSchools = async ({
  cityName = null,
  districtName = null,
  schoolName = null,
  keyword = "",
  page = 1,
} = {}) => {
  // 기존 keyword 파라미터와 백엔드 스펙을 모두 맞추기 위해 schoolName 우선, 없으면 keyword 사용
  const nameForSearch = schoolName ?? (keyword ? keyword : null);

  const res = await api.post(`/school/search?page=${page}`, {
    cityName,
    districtName,
    schoolName: nameForSearch,
  });

  return unwrapResult(res); // 기본: { schools: [...] } 형태 응답
};

// 재활용용 alias
export const findSchools = searchSchools;
