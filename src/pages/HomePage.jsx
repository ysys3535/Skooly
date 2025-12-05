// src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { REGION_DATA } from "../constants/regiondata.js";
import { findSchools } from "../api/schools"; // ✅ 학교 검색 API

const SPORT_LIST = ["농구", "풋살", "배드민턴", "탁구", "배구", "기타"];

// 백엔드 응답을 화면에서 쓰기 편한 형태로 변환
const normalizeSchool = (raw, fallbackId) => {
  if (!raw) return null;

  const id = raw.id || raw.schoolId || fallbackId;
  const name = raw.name || raw.schoolName || "이름 없는 학교";

  const sido =
    raw.sido ||
    raw.cityName ||
    raw.city ||
    (raw.address && raw.address.split(" ")[0]) ||
    "";
  const sigungu =
    raw.sigungu ||
    raw.districtName ||
    raw.district ||
    (raw.address && raw.address.split(" ")[1]) ||
    "";
  const dong =
    raw.dong ||
    raw.town ||
    (raw.address && raw.address.split(" ")[2]) ||
    "";

  const lat = raw.lat || raw.latitude || raw.y || null;
  const lng = raw.lng || raw.longitude || raw.x || null;

  return {
    id,
    name,
    sido,
    sigungu,
    dong,
    lat,
    lng,
    schoolId: raw.schoolId ?? id,
    schoolName: raw.schoolName ?? name,
    cityName: raw.cityName ?? sido,
    districtName: raw.districtName ?? sigungu,
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
    facilityNames:
      Array.isArray(raw.facilityNames) && raw.facilityNames.length > 0
        ? raw.facilityNames
        : [],
  };
};

export default function HomePage() {
  const navigate = useNavigate();

  // 검색 상태
  const [keyword, setKeyword] = useState("");

  // 지역 3단계
  const [sido, setSido] = useState(""); // 시/도
  const [sigungu, setSigungu] = useState(""); // 시/군/구
  const [dong, setDong] = useState(""); // 읍/면/동

  const [sportTypes, setSportTypes] = useState([]);

  // 🔹 API에서 가져온 학교 목록
  const [schools, setSchools] = useState([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [schoolError, setSchoolError] = useState(null);

  // 지역 옵션들
  const sidoOptions = Object.keys(REGION_DATA);
  const sigunguOptions =
    sido && REGION_DATA[sido] ? Object.keys(REGION_DATA[sido]) : [];
  const dongOptions =
    sido && sigungu && REGION_DATA[sido]?.[sigungu]
      ? REGION_DATA[sido][sigungu]
      : [];

  const toggleSport = (sport) => {
    setSportTypes((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleChangeSido = (e) => {
    const value = e.target.value;
    setSido(value);
    setSigungu("");
    setDong("");
  };

  const handleChangeSigungu = (e) => {
    const value = e.target.value;
    setSigungu(value);
    setDong("");
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const filters = {
      keyword,
      sido,
      sigungu,
      dong,
      sportTypes,
    };

    navigate("/search", { state: { filters } });
  };

  // 🔹 Kakao Map 연결용 ref
  const mapContainerRef = useRef(null); // DOM
  const mapRef = useRef(null); // kakao.maps.Map 인스턴스
  const markersRef = useRef([]); // 현재 지도 위의 마커들

  // ✅ 최초 1번: 지도 초기화
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.warn("⚠ kakao 객체가 없습니다. index.html 스크립트를 확인하세요.");
      return;
    }

    window.kakao.maps.load(() => {
      if (!mapContainerRef.current) return;

      const center = new window.kakao.maps.LatLng(37.5665, 126.978); // 서울 시청 근처 기본값
      const options = {
        center,
        level: 7,
      };

      mapRef.current = new window.kakao.maps.Map(
        mapContainerRef.current,
        options
      );
    });
  }, []);

  // ✅ 지역/키워드가 바뀔 때마다 학교 리스트 API 호출
  useEffect(() => {
    // 아무 조건도 없으면 굳이 호출 안 함
    if (!sido && !sigungu && !keyword) {
      setSchools([]);
      return;
    }

    const fetchSchools = async () => {
      setIsLoadingSchools(true);
      setSchoolError(null);

      try {
        const body = {
          cityName: sido || null,
          districtName: sigungu || null,
          schoolName: keyword || null,
        };

        const result = await findSchools(body);
        const list = result.schools || result || [];

        const normalized = list
          .map((item, idx) => normalizeSchool(item, idx))
          .filter(Boolean);

        setSchools(normalized);
      } catch (error) {
        console.error("학교 검색 실패:", error);
        setSchoolError(error);

        if (error.code === "ERR_NETWORK") {
          alert(
            "서버가 아직 준비되지 않았어요. 서버가 켜지면 학교 목록을 불러올 수 있어요!"
          );
        }
      } finally {
        setIsLoadingSchools(false);
      }
    };

    fetchSchools();
  }, [sido, sigungu, keyword]);

  // ✅ 지역 선택 값이 바뀔 때마다 지도 중심 이동 (지오코딩)
  useEffect(() => {
    if (
      !mapRef.current ||
      !window.kakao ||
      !window.kakao.maps ||
      !window.kakao.maps.services
    ) {
      return;
    }

    // 아무것도 선택 안 했으면 이동 X
    if (!sido && !sigungu && !dong) return;

    const geocoder = new window.kakao.maps.services.Geocoder();
    const query = [sido, sigungu, dong].filter(Boolean).join(" ");

    if (!query) return;

    geocoder.addressSearch(query, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const { x, y } = result[0];
        const coords = new window.kakao.maps.LatLng(y, x);

        // 중심 이동 + 줌 조정 (선택 레벨에 따라)
        mapRef.current.setCenter(coords);
        mapRef.current.setLevel(dong ? 5 : sigungu ? 6 : 7);
      } else {
        console.warn("주소 검색 실패:", query, status);
      }
    });
  }, [sido, sigungu, dong]);

  // 🔹 현재 선택된 지역에 해당하는 학교 리스트 (API 결과 기준)
  const filteredSchools = schools.filter((school) => {
    if (sido && school.sido !== sido) return false;
    if (sigungu && school.sigungu !== sigungu) return false;
    if (dong && school.dong !== dong) return false;
    return true;
  });

  // ✅ 학교 마커 표시 + 클릭 시 SchoolDetail로 이동
  useEffect(() => {
    if (!mapRef.current || !window.kakao || !window.kakao.maps) return;

    const { kakao } = window;

    // 1) 기존 마커 제거
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // 2) 표시할 학교가 없으면 종료
    if (filteredSchools.length === 0) return;

    filteredSchools.forEach((school) => {
      if (school.lat == null || school.lng == null) return;

      const position = new kakao.maps.LatLng(school.lat, school.lng);

      const marker = new kakao.maps.Marker({
        map: mapRef.current,
        position,
      });

      markersRef.current.push(marker);

      const iwContent = `
        <div style="padding:4px 8px;font-size:12px;">
          ${school.name}
        </div>
      `;
      const infoWindow = new kakao.maps.InfoWindow({
        content: iwContent,
      });

      kakao.maps.event.addListener(marker, "mouseover", () => {
        infoWindow.open(mapRef.current, marker);
      });

      kakao.maps.event.addListener(marker, "mouseout", () => {
        infoWindow.close();
      });

      // 🔗 마커 클릭 시 해당 학교 상세 페이지로 이동
      kakao.maps.event.addListener(marker, "click", () => {
        navigate(`/school/${school.id}`, { state: { school } });
      });
    });
  }, [filteredSchools, navigate]);

  return (
    <div className="min-h-screen bg-[#EFF6FF] text-gray-900">
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 md:py-6 lg:flex-row lg:gap-6">
        {/* 🔹 왼쪽: 검색 필터 전체 */}
        <section className="order-2 flex-1 rounded-2xl bg-white p-4 shadow-sm lg:order-1 lg:max-w-sm lg:self-start">
          <form className="flex flex-col gap-4" onSubmit={handleSearch}>
            <h2 className="mb-3 text-base font-semibold md:text-lg">
              학교 검색 필터
            </h2>

            {/* 키워드 검색 */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-black md:text-sm">
                학교 이름 
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 서울 ○○고, 풋살, 배드민턴 등"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* 지역 선택 (시/도 → 시/군/구 → 읍/면/동) */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-black md:text-sm">
                지역 선택
              </label>

              {/* 시/도 */}
              <div className="mb-2">
                <select
                  value={sido}
                  onChange={handleChangeSido}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">시/도 선택</option>
                  {sidoOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 시/군/구 */}
              <div className="mb-2">
                <select
                  value={sigungu}
                  onChange={handleChangeSigungu}
                  disabled={!sido}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">시/군/구 선택</option>
                  {sigunguOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* 읍/면/동 */}
              <div>
                <select
                  value={dong}
                  onChange={(e) => setDong(e.target.value)}
                  disabled={!sigungu}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none disabled:bg-gray-100 disabled:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">읍/면/동 선택</option>
                  {dongOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 종목 / 시설 종류 */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-black md:text-sm">
                원하는 종목 / 시설 종류
              </label>
              <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                {SPORT_LIST.map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={`rounded-full border px-3 py-1 ${
                      sportTypes.includes(sport)
                        ? "border-blue-500 bg-blue-50 text-blue-600"
                        : "border-gray-200 hover:border-blue-500 hover:bg-blue-50"
                    }`}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            {/* 검색 버튼 */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                선택한 조건으로 학교 검색하기
              </button>
            </div>

            {/* 안내 배너로 여백을 자연스럽게 채움 */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-[12px] text-blue-800 md:text-sm">
              <p className="font-semibold text-blue-900">검색 팁</p>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                <li>지역을 선택하면 지도 중심이 함께 이동해 주변 시설을 확인하기 좋아요.</li>
                <li>검색 후 결과에서 학교를 클릭하면 상세 시설 정보를 볼 수 있습니다.</li>
              </ul>
            </div>
          </form>
        </section>

        {/* 🔹 오른쪽: 카카오 지도 영역 */}
        <section className="order-1 flex-1 rounded-2xl bg-white p-4 shadow-sm lg:order-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold md:text-lg">
                전국 학교 체육시설 지도
              </h2>
              <p className="mt-1 text-xs text-gray-500 md:text-sm">
                학교를 클릭하면 예약 가능한 체육관 · 운동장 등 정보를 확인할 수 있어요.
              </p>
            </div>
          </div>

          <div
            ref={mapContainerRef}
            className="mb-4 h-64 rounded-2xl border border-gray-300 bg-slate-100/60 md:h-80 lg:h-[550px]"
          />
        </section>
      </main>
    </div>
  );
}
