// src/pages/ClubRegisterPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClub, enrollClubToSchool } from "../api/clubs"; // ✅ 동호회 생성 + 학교 등록 API
import { searchSchools } from "../api/schools";

const CLUB_TEMPLATES_KEY = "school_fitness_club_templates";

export default function ClubRegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    clubName: "",
    school: "", // 학교 이름 (지금은 API에 직접 안 보내고 화면용 정보)
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

  const [savedClubs, setSavedClubs] = useState([]);
  const [isTemplateListOpen, setIsTemplateListOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schools, setSchools] = useState([]);
  const [schoolKeyword, setSchoolKeyword] = useState("");
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [schoolError, setSchoolError] = useState(null);

  // 화면에서 선택한 한글 난이도를 백엔드 ENUM으로 변환
  const mapLevelToEnum = (level) => {
    switch (level) {
      case "입문":
        return "BASIC";
      case "초급":
        return "BEGINNER";
      case "중급":
        return "INTERMEDIATE";
      case "상급":
        return "ADVANCED";
      default:
        return "BEGINNER";
    }
  };

  const handleSchoolSearch = async () => {
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

  // 페이지 진입 시 localStorage에서 목록 불러오기
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CLUB_TEMPLATES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedClubs(parsed);
        }
      }
    } catch (e) {
      console.error("저장된 동호회 목록 불러오기 실패:", e);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 템플릿 선택해서 폼에 채우기
  const handleSelectTemplate = (club) => {
    setForm((prev) => ({
      ...prev,
      ...club,
    }));
    setIsTemplateListOpen(false);
  };

  // 🔹 폼 제출 + API 호출 + 템플릿 저장
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 필수값 검사 (스펙에 맞춰 최소 필수만 확인)
    if (
      !form.clubName ||
      !form.school ||
      !form.schoolId ||
      !form.sport ||
      !form.description ||
      !form.representativeName ||
      !form.phone
    ) {
      alert("동호회 이름, 학교 이름/ID, 운동 종목, 소개글, 대표 이름, 전화번호는 필수입니다.");
      return;
    }

    const schoolIdNum = Number(form.schoolId);

    if (!schoolIdNum || Number.isNaN(schoolIdNum)) {
      alert("학교 ID를 올바르게 입력해주세요 (숫자).");
      return;
    }

    // 전화번호 형식 검증
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(form.phone)) {
      alert("전화번호는 010-1234-5678 형식으로 입력해주세요.");
      return;
    }

    // 1) 클럽 기본 생성 (clubId 확보)
    const createPayload = {
      clubName: form.clubName,
      captainName: form.representativeName,
      phone: form.phone,
      email: form.email || null,
      description: form.description,
    };

    // 2) 학교 등록 payload (clubId는 생성 후 할당)
    const enrollPayload = {
      schoolId: schoolIdNum,
      clubId: null,
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
      console.log("동호회 생성 요청 payload:", createPayload);

      // 1) 동호회 생성 → clubId 확보
      const created = await createClub(createPayload);
      console.log("동호회 생성 응답:", created);

      const createdClubId =
        created?.clubId || created?.id || created?.schoolClubId;
      if (!createdClubId) {
        throw new Error("생성된 clubId를 확인할 수 없습니다.");
      }

      // 폼에도 표시용 저장
      setForm((prev) => ({ ...prev, clubId: String(createdClubId) }));

      // 2) 학교에 동호회 등록
      const enrollPayloadWithId = { ...enrollPayload, clubId: createdClubId };
      console.log("학교 등록 payload:", enrollPayloadWithId);

      const enrolled = await enrollClubToSchool(enrollPayloadWithId);
      console.log("학교 등록 응답:", enrolled);

      // ✅ 로컬 템플릿에도 저장
      try {
        const stored = localStorage.getItem(CLUB_TEMPLATES_KEY);
        const prevList = stored ? JSON.parse(stored) : [];
        let nextList = Array.isArray(prevList) ? prevList : [];

        const exists = nextList.some(
          (c) => c.clubName === form.clubName && c.sport === form.sport
        );

        if (!exists) {
          nextList = [...nextList, form];
        } else {
          nextList = nextList.map((c) =>
            c.clubName === form.clubName && c.sport === form.sport ? form : c
          );
        }

        localStorage.setItem(CLUB_TEMPLATES_KEY, JSON.stringify(nextList));
        setSavedClubs(nextList);
      } catch (error) {
        console.error("동호회 템플릿 저장 실패:", error);
      }

      const clubNameForAlert =
        created?.clubName || created?.name || form.clubName;
      alert(`"${clubNameForAlert}" 동호회 생성 및 학교 등록이 완료되었습니다!`);
      navigate("/clubs");
    } catch (error) {
      console.error("동호회 생성 실패:", error);

      if (error.code === "ERR_NETWORK") {
        alert("서버가 아직 준비되지 않았어요. 서버가 켜지면 다시 시도해주세요!");
      } else {
        alert(error.message || "동호회 등록 중 문제가 발생했습니다 🥲");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <p className="text-xs text-gray-500 md:text-sm">
            체육 동호회 등록을 위해 아래 정보를 모두 작성해 주세요.
            <br />
            <span className="text-red-500">*</span> 표시는 필수 입력 항목입니다.
          </p>

          {/* 🔹 저장된 동호회 목록 / 템플릿 불러오기 영역 */}
          {savedClubs.length > 0 && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3 md:px-4 md:py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-gray-900 md:text-xs">
                  <p className="font-medium">
                    이전에 등록한 동호회 정보를 불러와서 사용할 수 있어요.
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500 md:text-xs">
                    여러 개의 동호회 템플릿 중에서 하나를 선택해 폼을 자동으로 채울 수 있습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTemplateListOpen((prev) => !prev)}
                  className="whitespace-nowrap rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 md:text-sm"
                >
                  {isTemplateListOpen ? "접기" : "목록 열기"}
                </button>
              </div>

              {isTemplateListOpen && (
                <div className="mt-3 max-h-52 space-y-2 overflow-y-auto pr-1">
                  {savedClubs.map((club, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectTemplate(club)}
                      className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-left text-xs shadow-sm hover:border-blue-300 hover:bg-blue-50 md:text-sm"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {club.clubName || "이름 없는 동호회"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-500 md:text-xs">
                            {club.school || "학교 미입력"} ·{" "}
                            {club.sport || "종목 미입력"} ·{" "}
                            {club.day || "요일 미입력"}{" "}
                            {club.time ? `· ${club.time}` : ""}
                          </p>
                        </div>
                        <span className="text-[11px] text-blue-600">선택</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-800">1) 동호회 기본 정보 생성 (/club/create)</p>

            {/* 동호회 이름 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                동호회 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="clubName"
                value={form.clubName}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="예: ○○고 농구 동호회"
              />
            </div>

            {/* 대표 이름 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                대표 이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="representativeName"
                value={form.representativeName}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="예: 홍길동"
              />
            </div>

            {/* 대표 전화 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                대표 전화 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="example@email.com"
              />
            </div>

            {/* 소개글 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                소개글 <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="동호회 소개를 작성해주세요."
              />
            </div>
          </div>

          <div className="my-2 h-px bg-slate-200" />

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-800">2) 학교에 동호회 등록 (/school/club)</p>

            {/* 생성된 clubId 표시 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  생성된 clubId (읽기전용)
                </label>
                <input
                  type="text"
                  value={form.clubId}
                  readOnly
                  className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  placeholder="생성 후 자동 입력"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  학교 ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="schoolId"
                  value={form.schoolId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="예: 1"
                  min="1"
                />
              </div>
            </div>

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
                  placeholder="학교 이름을 입력하세요 (예: ○○고)"
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
                  학교 목록을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
                </p>
              )}
              <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50">
                {schools.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-500">
                    검색 결과가 없습니다. 키워드를 입력해 검색해주세요.
                  </p>
                ) : (
                  schools.map((s) => (
                    <button
                      key={s.schoolId || s.id}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          schoolId: s.schoolId || s.id || "",
                          school: s.schoolName || s.name || "",
                        }))
                      }
                      className={`block w-full border-b px-3 py-2 text-left text-xs hover:bg-blue-50 ${
                        String(form.schoolId) === String(s.schoolId || s.id || "")
                          ? "bg-blue-100 text-blue-800"
                          : "text-slate-700"
                      }`}
                    >
                      <p className="font-semibold">
                        {s.schoolName || s.name || "학교명 미상"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        ID: {s.schoolId || s.id || "?"}
                      </p>
                    </button>
                  ))
                )}
              </div>
              {form.school && form.schoolId && (
                <p className="text-xs text-blue-700">
                  선택된 학교: {form.school} (ID: {form.schoolId})
                </p>
              )}
            </div>

            {/* 운동 종목 */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                운동 종목 <span className="text-red-500">*</span>
              </label>
              <select
                name="sport"
                value={form.sport}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">선택해주세요</option>
                <option value="농구">농구</option>
                <option value="풋살">풋살</option>
                <option value="배드민턴">배드민턴</option>
                <option value="탁구">탁구</option>
                <option value="테니스">테니스</option>
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
                  placeholder="예: 화요일, 토요일"
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
                  placeholder="예: 18:00 ~ 21:00"
                />
              </div>
            </div>

          {/* 5~6. 연령대 / 활동 강도 */}
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
                placeholder="예: 20대 ~ 30대"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                활동 강도
              </label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="">선택해주세요</option>
                <option value="입문">입문</option>
                <option value="초급">초급</option>
                <option value="중급">중급</option>
                <option value="상급">상급</option>
              </select>
            </div>
          </div>

          {/* 7. 예상 회비 */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              예상 회비
            </label>
            <input
              type="text"
              name="fee"
              value={form.fee}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="예: 월 30,000원 / 연 10만원"
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
              {isSubmitting ? "등록 중..." : "등록 신청하기"}
            </button>
          </div>
        </form>

      </main>
    </div>
  );
}
