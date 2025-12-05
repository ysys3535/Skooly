// src/pages/ClubRegisterPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { enrollClubToSchool, fetchClubs } from "../api/clubs";
import { searchSchools } from "../api/schools";

export default function ClubRegisterPage() {
  const navigate = useNavigate();
  const memberId = localStorage.getItem("memberId") || "";

  const [form, setForm] = useState({
    clubName: "",
    school: "",
    schoolId: "",
    clubId: "",
    sport: "",
    day: "",
    time: "",
    ageRange: "",
    level: "",
    fee: "",
    description: "",
    representativeName: "",
    phone: "",
    email: "",
  });

  const [isLoadingBasicInfo, setIsLoadingBasicInfo] = useState(true);
  const [hasClubBasicInfo, setHasClubBasicInfo] = useState(false);
  const [basicInfoError, setBasicInfoError] = useState(null);
  const [clubOptions, setClubOptions] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [schools, setSchools] = useState([]);
  const [schoolKeyword, setSchoolKeyword] = useState("");
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [schoolError, setSchoolError] = useState(null);

  // 화면에서 선택한 난이도를 ENUM 값으로 변환
  const mapLevelToEnum = (level) => {
    switch (level) {
      case "입문":
        return "BASIC";
      case "초급":
        return "BEGINNER";
      case "중급":
        return "INTERMEDIATE";
      case "고급":
        return "ADVANCED";
      default:
        return "BEGINNER";
    }
  };

  const mapClubToForm = (club) => ({
    clubName: club?.clubName || club?.name || "",
    school: club?.school || club?.schoolName || "",
    schoolId: club?.schoolId || "",
    clubId: club?.clubId || club?.id || "",
    sport:
      club?.sport ||
      (Array.isArray(club?.sportNames) && club.sportNames.length > 0
        ? club.sportNames[0]
        : ""),
    day: club?.day || club?.activityDay || club?.activeDays || "",
    time: club?.time || club?.activityTime || club?.activeTime || "",
    ageRange: club?.ageRange || club?.age || "",
    level:
      club?.level ||
      club?.activityLevel ||
      club?.intensity ||
      club?.activity_level ||
      "",
    fee: club?.fee || club?.feeInfo || "",
    description: club?.description || club?.introduction || "",
    representativeName:
      club?.representativeName ||
      club?.captinName ||
      club?.captainName ||
      club?.captin_name ||
      club?.captain_name ||
      "",
    phone: club?.phone || club?.leaderPhone || "",
    email: club?.email || club?.leaderEmail || "",
  });

  useEffect(() => {
    const loadMyClub = async () => {
      setIsLoadingBasicInfo(true);
      setBasicInfoError(null);

      const pickFirstClub = (list) => {
        if (!Array.isArray(list) || list.length === 0) return null;
        return list[0];
      };

      try {
        let list = [];
        let primaryError = null;

        // 서버 조회: /club/find
        try {
          const all = await fetchClubs();
          list = Array.isArray(all)
            ? all
            : Array.isArray(all?.clubs)
            ? all.clubs
            : Array.isArray(all?.content)
            ? all.content
            : [];
        } catch (fallbackError) {
          primaryError = fallbackError;
          console.error("club/find 호출 실패:", fallbackError);
        }

        // 옵션 저장
        const normalizedList = list.map((c, idx) => ({
          id: c?.clubId || c?.id || idx,
          name: c?.clubName || c?.name || "이름 없는 클럽",
          raw: c,
        }));
        setClubOptions(normalizedList);

        // 우선순위: ownerId 매칭 → 단일 항목 → 첫 번째
        let mine =
          list.find(
            (c) =>
              c?.ownerId != null &&
              memberId &&
              String(c.ownerId) === String(memberId)
          ) || (list.length === 1 ? list[0] : pickFirstClub(list));

        if (!mine) {
          setHasClubBasicInfo(false);
          if (primaryError) setBasicInfoError(primaryError);
          return;
        }

        const mapped = mapClubToForm(mine);
        setSelectedClubId(mapped.clubId ? String(mapped.clubId) : "");
        setForm((prev) => ({
          ...prev,
          ...mapped,
          clubId: mapped.clubId ? String(mapped.clubId) : "",
          schoolId: mapped.schoolId ? String(mapped.schoolId) : "",
        }));
        setHasClubBasicInfo(true);
      } catch (error) {
        console.error("내 동호회 기본 정보 불러오기 실패:", error);
        setBasicInfoError(error);
        setHasClubBasicInfo(false);
      } finally {
        setIsLoadingBasicInfo(false);
      }
    };

    loadMyClub();
  }, []);

  const handleSelectClub = (clubId) => {
    const selected = clubOptions.find((c) => String(c.id) === String(clubId));
    if (!selected) return;
    const mapped = mapClubToForm(selected.raw);
    setSelectedClubId(String(clubId));
    setForm((prev) => ({
      ...prev,
      ...mapped,
      clubId: mapped.clubId ? String(mapped.clubId) : "",
      schoolId: mapped.schoolId ? String(mapped.schoolId) : "",
    }));
    setHasClubBasicInfo(true);
  };

  const handleSchoolSearch = async () => {
    if (!schoolKeyword.trim()) return;

    setIsLoadingSchools(true);
    setSchoolError(null);

    try {
      const data = await searchSchools({ keyword: schoolKeyword.trim(), page: 1 });

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.schools)
        ? data.schools
        : [];

      setSchools(list);
    } catch (error) {
      console.error("학교 검색 실패:", error);
      setSchoolError(error);
    } finally {
      setIsLoadingSchools(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoadingBasicInfo) {
      alert("동호회 기본 정보를 불러오는 중입니다. 잠시만 기다려 주세요.");
      return;
    }

    if (!hasClubBasicInfo || !form.clubId) {
      alert("동호회 기본 정보가 없습니다. 마이페이지에서 먼저 등록해 주세요.");
      return;
    }

    // 필수 값 체크
    if (
      !form.clubName ||
      !form.school ||
      !form.sport ||
      !form.description ||
      !form.representativeName ||
      !form.phone
    ) {
      alert(
        "클럽명, 학교 선택, 종목, 소개, 대표자 이름, 대표 전화번호는 필수 입력입니다."
      );
      return;
    }

    const schoolIdNum = Number(form.schoolId);

    if (!schoolIdNum || Number.isNaN(schoolIdNum)) {
      alert("학교 선택이 잘못되었습니다. 다시 검색 후 선택해 주세요.");
      return;
    }

    // 전화번호 형식 검사
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(form.phone)) {
      alert("전화번호는 010-1234-5678 형식으로 입력해 주세요.");
      return;
    }

    const clubIdNum = Number(form.clubId);
    if (!clubIdNum || Number.isNaN(clubIdNum)) {
      alert("클럽 기본 정보가 올바르지 않습니다. 마이페이지에서 다시 확인해 주세요.");
      return;
    }

    // 학교-클럽 등록 payload
    const enrollPayload = {
      schoolId: schoolIdNum,
      clubId: clubIdNum,
      activeDays: form.day,
      activeTime: form.time,
      ageRange: form.ageRange,
      activityLevel: mapLevelToEnum(form.level),
      fee: form.fee ? Number(form.fee) || 0 : 0,
      description: form.description,
      sportNames: form.sport ? [form.sport] : [],
    };

    setIsSubmitting(true);

    try {
      console.log("학교-클럽 등록 payload:", enrollPayload);

      const enrolled = await enrollClubToSchool(enrollPayload);
      console.log("학교-클럽 등록 응답:", enrolled);

      const clubNameForAlert = form.clubName;
      alert(`"${clubNameForAlert}" 클럽이 학교에 등록되었습니다.`);
      navigate("/clubs");
    } catch (error) {
      console.error("클럽 등록 실패:", error);

      if (error.code === "ERR_NETWORK") {
        alert("네트워크 오류입니다. 서버가 준비된 뒤 다시 시도해 주세요.");
      } else {
        alert(error.message || "클럽 등록 중 문제가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }; // 🔹 handleSubmit 함수 여기서 끝!

  return (
    <div className="min-h-screen bg-[#EFF6FF]">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold md:text-xl">동호회 등록</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl bg-white p-5 shadow-sm md:p-6"
        >
            <span className="text-red-500">*</span> 표시는 필수 입력 항목입니다.

          {/* 1) 클럽 기본 정보 */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-800">
              1. 동호회 기본 정보
            </p>
            {isLoadingBasicInfo && (
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-gray-600">
                동호회 기본 정보를 불러오는 중입니다...
              </div>
            )}

            {basicInfoError && (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                기본 정보를 불러오는 중 문제가 발생했습니다. 새로고침 후 다시 시도해 주세요.
              </div>
            )}

            {!isLoadingBasicInfo && !hasClubBasicInfo && (
              <div className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-gray-700 md:text-sm">
                <p className="font-semibold text-gray-900">
                  아직 등록된 동호회 기본 정보가 없습니다.
                </p>
                <p className="mt-1 text-gray-600">
                  마이페이지의 [내가 만든 동호회]에서 기본 정보를 먼저 등록해주세요.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/mypage", { state: { tab: "myClubs" } })}
                  className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  마이페이지로 이동하기
                </button>
              </div>
            )}

            {/* 기본 정보 선택 */}
            {clubOptions.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  불러올 동호회 선택
                </label>
                <select
                  value={selectedClubId}
                  onChange={(e) => handleSelectClub(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {clubOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className={`space-y-3 ${!hasClubBasicInfo ? "opacity-60" : ""}`}>
              {/* 클럽 이름 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  동호회 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clubName"
                  value={form.clubName}
                  onChange={handleChange}
                  disabled
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="예) 스쿨리 농구 동호회"
                />
              </div>

              {/* 대표자 이름 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  대표자 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="representativeName"
                  value={form.representativeName}
                  onChange={handleChange}
                  disabled
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="대표자 성함을 입력해 주세요"
                />
              </div>

              {/* 대표 연락처 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  대표 연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  disabled
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="010-1234-5678"
                />
              </div>

              {/* 이메일 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="example@email.com"
                />
              </div>

              {/* 클럽 소개 */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  동호회 소개 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  disabled
                  rows={4}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none resize-none disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="클럽 활동 내용과 분위기를 소개해 주세요."
                />
              </div>
            </div>
          </div>

          <div className="my-2 h-px bg-slate-200" />

          {/* 2) 학교-클럽 등록 정보 */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-800">
              2. 학교-동호회 등록
            </p>

            {/* 숨김 필드: clubId, schoolId (화면에는 노출하지 않음) */}
            <input type="hidden" name="clubId" value={form.clubId} />
            <input type="hidden" name="schoolId" value={form.schoolId} />

            {/* 학교 검색 / 선택 */}
            <div className="space-y-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">
                학교 검색 및 선택 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col gap-2 md:flex-row">
                <input
                  type="text"
                  value={schoolKeyword}
                  onChange={(e) => setSchoolKeyword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="학교 이름을 입력해 검색해 주세요 (예: 스쿨리고)"
                />
                <button
                  type="button"
                  onClick={handleSchoolSearch}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 md:w-32"
                  disabled={isLoadingSchools}
                >
                  {isLoadingSchools ? "검색 중..." : "검색"}
                </button>
              </div>
              {schoolError && (
                <p className="text-xs text-red-500">
                  학교 목록을 불러오는 중 오류가 발생했습니다. 다시 시도해 주세요.
                </p>
              )}
              <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50">
                {schools.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500">
                    검색 결과가 없습니다. 다른 키워드로 다시 검색해 주세요.
                  </p>
                ) : (
                  schools.map((s) => (
                    <button
                      key={s.schoolId || s.id}
                      type="button"
                      onClick={() => {
                        const pickedName = s.schoolName || s.name || "";
                        setSchoolKeyword(pickedName);
                        setForm((prev) => ({
                          ...prev,
                          schoolId: s.schoolId || s.id || "",
                          school: pickedName,
                        }));
                      }}
                      className={`block w-full border-b px-3 py-2 text-left text-xs hover:bg-blue-50 ${
                        String(form.schoolId) === String(s.schoolId || s.id || "")
                          ? "bg-blue-100 text-blue-800"
                          : "text-slate-700"
                      }`}
                    >
                      <p className="font-semibold">
                        {s.schoolName || s.name || "학교 이름 미지정"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        주소지: {s.address || "정보 없음"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* 종목 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                종목 <span className="text-red-500">*</span>
              </label>
              <select
                name="sport"
                value={form.sport}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">선택해 주세요</option>
                <option value="농구">농구</option>
                <option value="축구">축구</option>
                <option value="배드민턴">배드민턴</option>
                <option value="배구">배구</option>
                <option value="탁구">탁구</option>
                <option value="기타">기타</option>
              </select>
            </div>

            {/* 3~4. 활동 요일 / 시간 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  활동 요일
                </label>
                <input
                  type="text"
                  name="day"
                  value={form.day}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="예) 월, 수, 금"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  활동 시간
                </label>
                <input
                  type="text"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="예) 18:00 ~ 21:00"
                />
              </div>
            </div>

            {/* 5~6. 연령대 / 활동 난이도 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  연령대
                </label>
                <input
                  type="text"
                  name="ageRange"
                  value={form.ageRange}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="예) 20대 ~ 30대"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  활동 난이도
                </label>
                <select
                  name="level"
                  value={form.level}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">선택해 주세요</option>
                  <option value="입문">입문</option>
                  <option value="초급">초급</option>
                  <option value="중급">중급</option>
                  <option value="고급">고급</option>
                </select>
              </div>
            </div>

            {/* 7. 참가비 안내 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                참가비 안내
              </label>
              <input
                type="text"
                name="fee"
                value={form.fee}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="예) 월 30,000원 / 연 10만 원"
              />
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? "등록 중..." : "등록하기"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
