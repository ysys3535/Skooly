// src/pages/ClubsPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { findSchoolClubs } from "../api/schoolClubs";

export default function ClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filters, setFilters] = useState({
    schoolName: "",
    sportName: "",
  });

  const fetchClubs = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const result = await findSchoolClubs(filters, 1); // page=1
      const list =
        result?.schoolClubs ||
        result?.content ||
        result?.clubs ||
        (Array.isArray(result) ? result : []) ||
        [];
      setClubs(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("동호회 목록 불러오기 실패:", error);
      setLoadError(error);

      if (error.code === "ERR_NETWORK") {
        alert("서버가 아직 준비되지 않았어요. 서버가 켜지면 다시 시도해 주세요!");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchClubs();
  };

  return (
    <div className="bg-[#EFF6FF] min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold md:text-xl">동호회 둘러보기</h1>
              <p className="mt-1 text-xs text-gray-500 md:text-sm">
                학교 / 종목 / 키워드로 필터링해 원하는 동호회를 찾아보세요.
              </p>
            </div>

            <Link
              to="/clubs/new"
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 md:text-sm"
            >
              동호회 등록하기
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-4 md:py-6">
        {/* 검색/필터 */}
        <form
          onSubmit={handleSearch}
          className="mb-4 grid gap-2 md:grid-cols-[2fr_1fr_auto]"
        >
          <input
            name="schoolName"
            value={filters.schoolName}
            onChange={handleFilterChange}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-100 focus:border-blue-500 focus:ring-2"
            placeholder="학교 이름 또는 지역을 입력해 검색해 주세요"
          />
          <select
            name="sportName"
            value={filters.sportName}
            onChange={handleFilterChange}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-100 focus:border-blue-500 focus:ring-2"
          >
            <option value="">종목 전체</option>
            <option value="농구">농구</option>
            <option value="축구">축구</option>
            <option value="풋살">풋살</option>
            <option value="배드민턴">배드민턴</option>
            <option value="탁구">탁구</option>
            <option value="배구">배구</option>
            <option value="기타">기타</option>
          </select>
          <button
            type="submit"
            className="self-stretch rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 md:px-3 md:py-2 md:self-center"
          >
            검색
          </button>
        </form>

        {/* 로딩 상태 */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-white/70 p-4 shadow-sm"
              >
                <div className="mb-2 h-4 w-1/3 rounded bg-slate-200" />
                <div className="h-3 w-2/3 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* 에러 */}
        {!isLoading && loadError && (
          <p className="text-center text-sm text-red-500 mt-4">
            동호회 목록을 불러오는 중 문제가 발생했습니다.
          </p>
        )}

        {/* 결과 리스트 */}
        {!isLoading && !loadError && (
          <div className="space-y-3">
            {clubs.length === 0 ? (
              <p className="text-center text-sm text-gray-500 mt-4">
                아직 등록된 동호회가 없습니다.
              </p>
            ) : (
              clubs.map((club, idx) => {
                const id =
                  club.schoolClubId ||
                  club.id ||
                  club.clubId ||
                  club.schoolClubID ||
                  idx;
                const name =
                  club.clubName || club.name || "이름 미정 동호회";
                const school =
                  club.schoolName || club.school || "학교 정보 없음";
                const sport = Array.isArray(club.sportNames)
                  ? club.sportNames.join(", ")
                  : club.sportName || club.sport || "종목 미정";
                const region =
                  club.region ||
                  club.cityName ||
                  club.districtName ||
                  club.sido ||
                  "";
                const time =
                  club.activeTime ||
                  club.time ||
                  club.activeDays ||
                  club.activityTime ||
                  "";

                return (
                  <Link
                    key={id}
                    to={`/clubs/${id}`}
                    className="flex flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900 md:text-base">
                        {name}
                      </p>
                      <p className="text-xs text-gray-600 md:text-sm">
                        {school}
                        {time && ` · ${time}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
                      <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-700">
                        {sport}
                      </span>
                      {region && (
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                          {region}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </main>
    </div>
  );
}
