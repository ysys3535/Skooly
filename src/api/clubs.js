// src/api/clubs.js
import { api } from "./http";
import { unwrapResult } from "./response";

/**
 * ✅ 동호회 기본 생성 (POST /club/create)
 * 백엔드 스펙: captin_name 필수 (snake_case)
 */
export const createClub = async ({
  clubName,
  captainName,
  phone,
  email,
  description,
}) => {
  const res = await api.post("/club/create", {
    name: clubName,
    captin_name: captainName,
    phone,
    email,
    description,
  });
  return unwrapResult(res);
};

/**
 * ✅ 학교에 동호회 등록 (POST /school/club)
 * 요청 스펙: schoolId, clubId, activeDays, activeTime, ageRange, activityLevel, fee, description, sportNames[]
 */
export const enrollClubToSchool = async (payload) => {
  const res = await api.post("/schoolClub/create", payload);
  return unwrapResult(res);
};

// ✅ 학교 동호회 수정 (PATCH /schoolClub/update/{schoolClubId})
export const updateSchoolClub = async (schoolClubId, payload) => {
  const res = await api.patch(`/schoolClub/update/${schoolClubId}`, payload);
  return unwrapResult(res);
};

// ✅ 학교 동호회 삭제 (DELETE /schoolClub/delete/{schoolClubId})
export const deleteSchoolClub = async (schoolClubId) => {
  const res = await api.delete(`/schoolClub/delete/${schoolClubId}`);
  return unwrapResult(res);
};

/**
 * ✅ 클럽 수정 (ClubUpdateReq)
 */
export const updateClub = async (clubId, payload) => {
  const res = await api.patch(`/club/update/${clubId}`, payload);
  return unwrapResult(res); // ClubUpdateRes
};

/**
 * ✅ 클럽 삭제
 */
export const deleteClub = async (clubId) => {
  const res = await api.delete(`/club/delete/${clubId}`);
  return unwrapResult(res); // ClubDeleteRes
};

/**
 * ✅ 클럽 목록 조회 (clubs: ClubItem[])
 */
export const findSchoolClubs = async ({
  page = 1,
  schoolName = "",
  schoolId = null,
  sportName = "",
} = {}) => {
  const res = await api.post(`/schoolClub/find?page=${page}`, {
    schoolName,
    schoolId,
    sportName,
  });
  const data = unwrapResult(res);
  return {
    pageInfo: data.pageInfo || {},
    clubs: data.schoolClubs || [],
  };
};

// 기존 getClubs 호환: 동호회 둘러보기에서 사용
export const getClubs = async (params = {}) => {
  const { clubs, pageInfo } = await findSchoolClubs(params);
  return { clubs, pageInfo };
};
