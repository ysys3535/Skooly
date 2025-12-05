// src/pages/ResultsPage.jsx
import { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { findSchools } from "../api/schools";

// 학교 검색 응답을 화면에서 쓰기 좋은 형태로 변환
const normalizeSchool = (raw, fallbackId) => {
  if (!raw) return null;

  const id = raw.id || raw.schoolId || fallbackId;
  const name = raw.name || raw.schoolName || "이름 없는 학교";

  const city =
    raw.cityName || raw.sido || raw.city || raw.region || "";
  const district =
    raw.districtName || raw.sigungu || raw.district || "";

  const region =
    city && district ? `${city} · ${district}` : city || district || "";

  const facilityNames =
    Array.isArray(raw.facilityNames) && raw.facilityNames.length > 0
      ? raw.facilityNames
      : [];
  const facilities =
    facilityNames.length > 0
      ? facilityNames.join(" · ")
      : raw.facilities ||
        raw.facilityTypes ||
        "예약 가능한 시설 정보가 아직 등록되지 않았어요.";

  return {
    id,
    name,
    region,
    facilities,
    facilityNames,
    schoolId: raw.schoolId ?? id,
    schoolName: raw.schoolName ?? name,
    cityName: raw.cityName ?? city,
    districtName: raw.districtName ?? district,
    schoolType: raw.schoolType || "",
    address: raw.address || "",
    openPeriod: raw.openPeriod || "",
    courtInfo: raw.courtInfo || "",
    operationItems: raw.operationItems || raw.operationItem || "",
    operationTimes: raw.operationTimes || raw.operationTime || "",
    showerRoomCount: raw.showerRoomCount ?? null,
    toiletCount: raw.toiletCount ?? null,
    lockerRoomCount: raw.lockerRoomCount ?? null,
    cost: raw.cost ?? null,
    howToReserve: raw.howToReserve || "",
    schoolHomepageUrl: raw.schoolHomepageUrl || "",
    eduOfficeUrl: raw.eduOfficeUrl || raw.eduOfficialUrl || "",
    eduOfficialUrl: raw.eduOfficialUrl || "",
    localPortalUrl: raw.localPortalUrl || "",
    schoolTel: raw.schoolTel || "",
    eduOfficeName: raw.eduOfficeName || "",
  };
};

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const filters = location.state?.filters;

  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // 🔹 필터 기반으로 /school/search 호출
  useEffect(() => {
    if (!filters) return;

    const fetch = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const body = {
          cityName: filters.sido || null,
          districtName: filters.sigungu || null,
          schoolName: filters.keyword || null,
          // TODO: 종목/요일/시간대 필터는
          // 백엔드에서 지원되면 여기에 추가
        };

        const result = await findSchools(body);
        const list = result.schools || result || [];

        const normalized = list
          .map((item, idx) => normalizeSchool(item, idx))
          .filter(Boolean);

        setResults(normalized);
      } catch (error) {
        console.error("학교 검색 결과 불러오기 실패:", error);
        setLoadError(error);

        if (error.code === "ERR_NETWORK") {
          alert("서버가 아직 준비되지 않았어요. 서버가 켜지면 검색 결과를 볼 수 있어요!");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [filters]);

  // 🔹 필터 없이 바로 들어온 경우 (새로고침 등)
  if (!filters) {
    return (
      <div className="bg-[#EFF6FF] min-h-screen bg-slate-50">
        <header className="bg-white border-b">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
            <h1 className="text-lg font-semibold md:text-2xl">검색 결과</h1>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs text-blue-600 underline-offset-2 hover:underline md:text-sm"
            >
              검색 조건 다시 선택하기
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-4 md:py-6 space-y-4">
          <section className="rounded-2xl bg-white p-4 shadow-sm text-xs text-gray-600 md:text-sm">
            <p>검색 조건 정보가 없습니다. 홈에서 다시 검색해 주세요.</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#EFF6FF] min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
          <h1 className="text-lg font-semibold md:text-2xl">검색 결과</h1>
          <Link
            to="/"
            className="text-xs text-blue-600 underline-offset-2 hover:underline md:text-sm"
          >
            검색 조건 변경하기
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4 md:py-6 space-y-4">
        {/* 선택한 필터 요약 (디자인 그대로) */}
        {filters && (
          <section className="rounded-2xl bg-white p-4 shadow-sm text-xs text-gray-600 md:text-sm">
            <p className="font-bold text-gray-900">선택한 검색 조건</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.keyword && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  키워드: {filters.keyword}
                </span>
              )}
              {filters.sido && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  지역: {filters.sido}
                </span>
              )}
              {filters.sportTypes?.length > 0 && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  종목: {filters.sportTypes.join(", ")}
                </span>
              )}
              {filters.dayType && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  요일: {filters.dayType}
                </span>
              )}
              {filters.timeSlot && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  시간대: {filters.timeSlot}
                </span>
              )}
              {filters.userType && (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  이용 주체: {filters.userType}
                </span>
              )}
            </div>
          </section>
        )}

        {/* 결과 리스트 */}
        <section className="space-y-3">
          {isLoading ? (
            <>
              <div className="h-16 rounded-2xl bg-white shadow-sm animate-pulse" />
              <div className="h-16 rounded-2xl bg-white shadow-sm animate-pulse" />
            </>
          ) : loadError ? (
            <div className="rounded-2xl bg-white p-4 shadow-sm text-xs text-gray-600 md:text-sm">
              검색 결과를 불러오는 중 문제가 발생했습니다.
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl bg-white p-4 shadow-sm text-xs text-gray-600 md:text-sm">
              검색 조건에 맞는 학교가 없습니다. 조건을 조금 넓혀서 다시 시도해 보세요.
            </div>
          ) : (
            results.map((school) => (
              <Link
                key={school.id}
                to={`/school/${school.id}`}
                state={{ school }}
                className="block rounded-2xl bg-white p-4 shadow-sm hover:border-blue-200 hover:bg-blue-50"
              >
                <p className="text-sm font-semibold text-gray-900 md:text-base">
                  {school.name}
                </p>
                {school.region && (
                  <p className="text-xs text-gray-600 md:text-sm">
                    {school.region}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 md:text-sm">
                  {school.facilities} 예약 가능
                </p>
              </Link>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
