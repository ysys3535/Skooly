// src/api/schoolClubs.js
import { api } from "./http";
import { unwrapResult } from "./response";

/**
 * ✅ 학교 클럽 검색 조건 (GetSchoolClubReq + page)
 * 요청: { schoolName?, schoolId?, sportName? } + page
 * 응답(result 예시):
 * {
 *   content: [ { schoolClubId, schoolName, clubName, ... } ],
 *   page: 1,
 *   totalPages: 3,
 *   ...
 * }
 */
export const findSchoolClubs = async (
  { schoolName, schoolId, sportName },
  page = 1
) => {
  const res = await api.post(
    "/schoolClub/find", // 🔹 스펙에 맞게 경로 수정 (C 대문자)
    { schoolName, schoolId, sportName },
    { params: { page } } // page는 query
  );
  return unwrapResult(res); // GetSchoolClubListRes
};

/**
 * ✅ 학교에 클럽 연동 생성 (PostSchoolClubReq)
 *
 * 백엔드 응답(result 예시):
 * {
 *   schoolClubId: 0,
 *   schoolId: 0,
 *   schoolName: "string",
 *   clubId: 0,
 *   clubName: "string",
 *   captainName: "string",
 *   activeDays: "string",
 *   activeTime: "string",
 *   ageRange: "string",
 *   activityLevel: "BEGINNER",
 *   fee: 0,
 *   description: "string",
 *   sportNames: ["string"],
 *   success: true
 * }
 */
export const createSchoolClub = async (payload) => {
  const res = await api.post("/schoolclub/create", payload);
  return unwrapResult(res);
};

/**
 * ✅ 학교 클럽 수정 (UpdateSchoolClubReq)
 */
export const updateSchoolClub = async (schoolClubId, payload) => {
  const res = await api.patch(`/schoolclub/update/${schoolClubId}`, payload);
  return unwrapResult(res);
};

/**
 * ✅ 학교 클럽 삭제
 */
export const deleteSchoolClub = async (schoolClubId) => {
  const res = await api.delete(`/schoolclub/delete/${schoolClubId}`);
  return unwrapResult(res);
};

/**
 * ✅ 특정 학교의 클럽 목록 조회 (📌 SchoolDetailPage용)
 * -> /schoolClub/find 를 schoolId 기준으로 호출
 */
export const getSchoolClubs = async (schoolId, page = 1) => {
  const res = await api.post(
    "/schoolClub/find", // 🔹 list API 대신 find 사용
    { schoolId },       // 조건은 schoolId만 넘겨도 됨
    { params: { page } }
  );
  return unwrapResult(res); // GetSchoolClubListRes
};
