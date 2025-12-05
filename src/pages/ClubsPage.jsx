// src/pages/ClubsPage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getClubs } from "../api/clubs";

export default function ClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // ✅ 최초 1번: 동호회 목록 불러오기
  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // /schoolClub/find 호출 → { pageInfo, clubs }
        const result = await getClubs();
        setClubs(result.clubs || []);
      } catch (error) {
        console.error("클럽 목록 불러오기 실패:", error);
        setLoadError(error);

        // 서버 아직 없을 때 친절 메시지
        if (error.code === "ERR_NETWORK") {
          alert("서버가 아직 준비되지 않았어요. 서버가 켜지면 다시 시도해주세요!");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchClubs();
  }, []);

  return (
    <div className="bg-[#EFF6FF] min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold md:text-xl">동호회 둘러보기</h1>
              <p className="mt-1 text-xs text-gray-500 md:text-sm">
                학교 / 종목 / 지역 기준으로 필터링해 원하는 팀을 찾을 수 있어요.
              </p>
            </div>

            {/* 🔹 동호회 등록 버튼 */}
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
        {/* 필터 영역 (지금은 UI만 있고 실제 필터 로직은 나중에 붙여도 됨) */}
        <div className="mb-4 grid gap-2 md:grid-cols-3">
          <input
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-100 focus:border-blue-500 focus:ring-2"
            placeholder="학교 또는 동호회 이름 검색"
          />
          <select className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-100 focus:border-blue-500 focus:ring-2">
            <option>종목 전체</option>
            <option>농구</option>
            <option>풋살</option>
            <option>배드민턴</option>
          </select>
          <select className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-blue-100 focus:border-blue-500 focus:ring-2">
            <option>지역 전체</option>
            <option>서울</option>
            <option>경기</option>
            <option>부산</option>
          </select>
        </div>

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

        {/* 에러 상태 (서버 준비 전에는 위에서 alert로도 알려줌) */}
        {!isLoading && loadError && (
          <p className="text-center text-sm text-red-500 mt-4">
            동호회 목록을 불러오는 중 문제가 발생했습니다.
          </p>
        )}

        {/* 리스트 */}
        {!isLoading && !loadError && (
          <div className="space-y-3">
            {clubs.length === 0 ? (
              <p className="text-center text-sm text-gray-500 mt-4">
                아직 등록된 동호회가 없습니다.
              </p>
            ) : (
              clubs.map((club, idx) => {
                // 백엔드 구조에 최대한 유연하게 대응
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
                const region = club.region || club.cityName || "";
                const time = club.activeTime || club.time || "";

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
