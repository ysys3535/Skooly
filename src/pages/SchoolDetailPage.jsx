/* global kakao */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getSchoolClubs } from "../api/schoolClubs";

const normalizeInitialSchool = (raw, fallbackId) => {
  if (!raw) return null;

  const id = raw.schoolId || raw.id || fallbackId;
  const name = raw.schoolName || raw.name || "학교 이름 미상";

  const city =
    raw.cityName || raw.sido || raw.city || raw.region || "";
  const district =
    raw.districtName || raw.sigungu || raw.district || "";
  const region =
    city && district ? `${city} · ${district}` : city || district || "";

  const lat = raw.lat || raw.latitude || raw.y || null;
  const lng = raw.lng || raw.longitude || raw.x || null;

  return {
    id,
    name,
    region,
    lat,
    lng,
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
    eduOfficialUrl: raw.eduOfficialUrl || "",
    localPortalUrl: raw.localPortalUrl || "",
    schoolTel: raw.schoolTel || "",
    eduOfficeName: raw.eduOfficeName || "",
    facilityNames:
      Array.isArray(raw.facilityNames) && raw.facilityNames.length > 0
        ? raw.facilityNames
        : [],
  };
};

export default function SchoolDetailPage() {
  const navigate = useNavigate();
  const { schoolId } = useParams();
  const location = useLocation();
  const clubsRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const initialSchool = location.state?.school ?? null;

  const [school, setSchool] = useState(() =>
    normalizeInitialSchool(initialSchool, Number(schoolId))
  );
  const [isLoadingSchool] = useState(false);
  const [schoolError, setSchoolError] = useState(null);

  const [schoolLocation, setSchoolLocation] = useState(() => ({
    lat: school?.lat ?? 37.498095,
    lng: school?.lng ?? 127.02761,
  }));

  const [clubs, setClubs] = useState([]);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [clubsError, setClubsError] = useState(null);

  useEffect(() => {
    if (!initialSchool) {
      setSchoolError(
        new Error("학교 정보를 찾을 수 없습니다. 학교 목록에서 다시 진입해주세요.")
      );
    }
  }, [initialSchool]);

  useEffect(() => {
    if (school?.lat != null && school?.lng != null) {
      setSchoolLocation({ lat: school.lat, lng: school.lng });
    }
  }, [school?.lat, school?.lng]);

  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoadingClubs(true);
      setClubsError(null);

      try {
        const result = await getSchoolClubs(Number(schoolId)); // /schoolClub/find
        const list =
          result.content || result.clubs || result.schoolClubs || [];

        const normalized = list.map((c, idx) => ({
          id: c.schoolClubId || c.id || c.clubId || idx,
          name: c.clubName || c.name || "이름 없는 동호회",
          sport:
            Array.isArray(c.sportNames) && c.sportNames.length > 0
              ? c.sportNames.join(" / ")
              : c.sport || "종목 미정",
          time:
            c.activeTime ||
            c.activityTime ||
            c.time ||
            c.schedule ||
            "운동 시간 정보 없음",
        }));

        setClubs(normalized);
      } catch (error) {
        console.error("학교 동호회 목록 불러오기 실패:", error);
        setClubsError(error);

        if (error.code === "ERR_NETWORK") {
          alert("서버가 일시 중지되었습니다. 서버가 켜지면 동호회 목록을 불러올게요.");
        }
      } finally {
        setIsLoadingClubs(false);
      }
    };

    fetchClubs();
  }, [schoolId]);

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.warn("⚠️ kakao 객체가 없습니다. index.html 스크립트를 확인해주세요.");
      return;
    }

    window.kakao.maps.load(() => {
      if (!mapContainerRef.current) return;

      const { kakao } = window;
      const center = new kakao.maps.LatLng(
        schoolLocation.lat,
        schoolLocation.lng
      );

      const options = {
        center,
        level: 3,
      };

      const map = new kakao.maps.Map(mapContainerRef.current, options);
      mapRef.current = map;

      const marker = new kakao.maps.Marker({
        position: center,
        map,
      });

      const infoWindow = new kakao.maps.InfoWindow({
        content: `
          <div style="padding:4px 8px;font-size:12px;">
            ${school?.name || "학교"}
          </div>
        `,
      });

      infoWindow.open(map, marker);
    });
  }, [schoolLocation.lat, schoolLocation.lng, school?.name]);

  const schoolName =
    school?.name ||
    (schoolError
      ? "학교 정보를 불러오지 못했습니다."
      : "학교 정보를 불러오는 중입니다...");
  const region = school?.region || "";

  const convenience = [
    { label: "샤워실", value: school?.showerRoomCount },
    { label: "화장실", value: school?.toiletCount },
    { label: "락커룸", value: school?.lockerRoomCount },
  ];

  return (
    <div className="bg-[#EFF6FF] min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
          >
            <span className="text-xl text-gray-700">←</span>
          </button>

          <div className="flex flex-col">
            <h1 className="text-lg font-semibold md:text-xl">{schoolName}</h1>
            {region && (
              <span className="text-xs text-gray-500 md:text-sm">{region}</span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 md:py-6 lg:flex-row lg:gap-6">
        {/* 왼쪽: 시설/예약 카드 중심 레이아웃 (이전 구조와 유사하게) */}
        <section className="flex-1 space-y-4">
          {/* 운영/예약 박스 */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold md:text-lg">운영 · 예약 정보</h2>
            <div className="mt-4 grid gap-3 text-xs text-gray-800 md:grid-cols-2 md:text-sm">
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-gray-600 md:text-xs">
                  운영 항목
                </p>
                <p className="mt-1">
                  {school?.operationItems || "운영 항목 정보 없음"}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-gray-600 md:text-xs">
                  운영 시간
                </p>
                <p className="mt-1">
                  {school?.operationTimes || school?.openPeriod || "운영 시간 정보 없음"}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-gray-600 md:text-xs">
                  예약 방법
                </p>
                <p className="mt-1">
                  {school?.howToReserve || "예약 방법 정보 없음"}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-gray-600 md:text-xs">
                  비용
                </p>
                <p className="mt-1">
                  {school?.cost != null ? `${school.cost}` : "비용 정보 없음"}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2 md:col-span-2">
                <p className="text-[11px] font-semibold text-gray-600 md:text-xs">
                  코트/시설 안내
                </p>
                <p className="mt-1">
                  {school?.courtInfo || "시설 안내 정보 없음"}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {school?.schoolHomepageUrl && (
                <a
                  href={school.schoolHomepageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 md:text-xs"
                >
                  학교 홈페이지
                </a>
              )}
              {school?.localPortalUrl && (
                <a
                  href={school.localPortalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 md:text-xs"
                >
                  지역 포털
                </a>
              )}
              {school?.eduOfficialUrl && (
                <a
                  href={school.eduOfficialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 md:text-xs"
                >
                  교육청 안내
                </a>
              )}
              {!school?.schoolHomepageUrl &&
                !school?.localPortalUrl &&
                !school?.eduOfficialUrl && (
                  <span className="text-[11px] text-gray-500 md:text-xs">
                    제공된 링크가 없습니다.
                  </span>
                )}
            </div>
          </div>

          {/* 시설/편의 정보 박스 */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold md:text-lg">시설 정보</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {school?.facilityNames && school.facilityNames.length > 0 ? (
                school.facilityNames.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700"
                  >
                    {f}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500 md:text-sm">
                  시설 정보가 없습니다.
                </span>
              )}
            </div>
            <div className="mt-4 grid gap-3 text-xs text-gray-800 md:grid-cols-3 md:text-sm">
              {convenience.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-gray-50 px-3 py-2 text-center"
                >
                  <p className="text-[11px] font-semibold text-gray-600 md:text-xs">
                    {item.label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-gray-900">
                    {item.value != null ? item.value : "-"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 기본 정보 박스 */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-base font-semibold md:text-lg">학교 기본 정보</h2>
            <div className="mt-3 grid gap-3 text-xs text-gray-800 md:grid-cols-2 md:text-sm">
              <div className="rounded-xl bg-gray-50 px-3 py-2 md:col-span-2">
                <p className="text-[11px] font-semibold text-gray-600 md:text-xs">
                  주소
                </p>
                <p className="mt-1">{school?.address || "주소 정보 없음"}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-gray-600 md:text-xs">
                  학교 유형
                </p>
                <p className="mt-1">{school?.schoolType || "유형 정보 없음"}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-gray-600 md:text-xs">
                  연락처
                </p>
                <p className="mt-1">{school?.schoolTel || "연락처 정보 없음"}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-semibold text-gray-600 md:text-xs">
                  교육청
                </p>
                <p className="mt-1">
                  {school?.eduOfficeName || "교육청 정보 없음"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 오른쪽: 지도 + 동호회 리스트 */}
        <section className="flex-1 space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800 md:text-base">
              위치
            </h2>
            <div
              ref={mapContainerRef}
              className="mt-2 h-52 rounded-xl border border-dashed border-gray-300 bg-slate-100 md:h-64"
            />
          </div>

          <div ref={clubsRef} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold md:text-base">
                이 학교에서 활동 중인 동호회
              </h2>
              <button
                onClick={() => navigate("/clubs/new")}
                className="rounded-xl bg-blue-600 px-3 py-2 text-s font-bold text-white hover:bg-blue-700 md:text-sm"
              >
                동호회 등록하기
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {isLoadingClubs ? (
                <>
                  <div className="h-12 rounded-xl bg-gray-50 animate-pulse" />
                  <div className="h-12 rounded-xl bg-gray-50 animate-pulse" />
                </>
              ) : clubsError ? (
                <p className="text-xs text-gray-500 md:text-sm">
                  동호회 정보를 불러오는 데 문제가 발생했습니다.
                </p>
              ) : clubs.length === 0 ? (
                <p className="text-xs text-gray-500 md:text-sm">
                  아직 이 학교에서 등록된 동호회가 없어요.
                </p>
              ) : (
                clubs.map((club) => (
                  <Link
                    key={club.id}
                    to={`/clubs/${club.id}`}
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs hover:border-blue-300 hover:bg-blue-50 md:text-sm"
                  >
                    <div>
                      <p className="font-semibold">{club.name}</p>
                      <p className="text-[11px] text-gray-500 md:text-xs">
                        {club.time}
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[12px] font-bold text-blue-700">
                      {club.sport}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
