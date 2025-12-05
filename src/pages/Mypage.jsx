// src/pages/MyPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/http"; // 공통 axios
import { unwrapResult } from "../api/response"; // { result }만 뽑는 헬퍼
import { getMyProfile, updateMyProfile } from "../api/auth"; // /members/me, /members/{id}

export default function MyPage() {
  const navigate = useNavigate();

  // 로그인 체크
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    const memberId = localStorage.getItem("memberId");
    const username = localStorage.getItem("username");

    if (!memberId && !username) {
      alert("로그인이 필요한 서비스입니다.");
      setShouldRender(false);
      navigate("/login");
    } else {
      setShouldRender(true);
    }
  }, [navigate]);

  const [tab, setTab] = useState("profile");

  // ✅ 내 정보 상태
  const [profile, setProfile] = useState({
    memberId: null,
    username: "",
    name: "",
    gender: "",
    birthDate: "",
    email: "",
    phone: "",
    status: "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);

  // ✅ 내가 만든 동호회 목록
  const [myClubs, setMyClubs] = useState([]);
  const [isLoadingMyClubs, setIsLoadingMyClubs] = useState(true);
  const [myClubsError, setMyClubsError] = useState(null);

  // 어떤 동호회 카드가 열려 있는지 (토글)
  const [expandedClubId, setExpandedClubId] = useState(null);
  // 어떤 동호회가 수정 모드인지
  const [editingClubId, setEditingClubId] = useState(null);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ (공통) 동호회 응답 → 화면용 형태로 정리
  const normalizeMyClub = (raw, idx) => {
    if (!raw) return null;
    return {
      id: raw.id || raw.clubId || idx,
      // 백엔드 필드 이름을 다양하게 대응
      clubName: raw.clubName || raw.name || "이름 없는 동호회",
      school: raw.school || raw.schoolName || "",
      sport:
        raw.sport ||
        (Array.isArray(raw.sportNames) && raw.sportNames.length > 0
          ? raw.sportNames.join(" / ")
          : ""),
      day: raw.day || raw.activityDay || "",
      time: raw.time || raw.activityTime || "",
      ageRange: raw.ageRange || raw.age || "",
      level: raw.level || raw.intensity || "",
      fee: raw.fee || raw.feeInfo || "",
      description: raw.description || raw.introduction || "",
      representativeName: raw.representativeName || raw.leaderName || "",
      phone: raw.phone || raw.leaderPhone || "",
      email: raw.email || raw.leaderEmail || "",
      // 클럽 작성자 식별용 (memberId/ownerId 등)
      ownerId:
        raw.ownerId ||
        raw.memberId ||
        raw.creatorId ||
        raw.leaderId ||
        null,
    };
  };

  // ✅ 내 정보 불러오기 (GET /members/me)
  useEffect(() => {
    if (!shouldRender) return;

    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      setProfileError(null);

      try {
        const user = await getMyProfile(); // unwrapResult까지 된 MemberProfileRes

        setProfile({
          memberId: user.memberId,
          username: user.username ?? "",
          name: user.name ?? "",
          gender: user.gender ?? "",
          birthDate: user.birthDate ?? user.birthdate ?? "",
          email: user.email ?? "",
          phone: user.phone ?? user.phoneNumber ?? "",
          status: user.status ?? "",
        });
      } catch (error) {
        console.error("내 정보 불러오기 실패:", error);
        setProfileError(error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [shouldRender]);

  // ✅ 내가 만든 동호회 목록 불러오기
  useEffect(() => {
    if (!shouldRender) return;

    // 내 memberId가 아직 없으면 기다렸다가 다시 실행
    const myMemberId =
      profile.memberId || Number(localStorage.getItem("memberId"));

    if (!myMemberId) return;

    const fetchMyClubs = async () => {
      setIsLoadingMyClubs(true);
      setMyClubsError(null);

      try {
        // 스펙: GET /club/find → ClubGetRes{ clubs: ClubItem[] }
        const res = await api.get("/club/find");
        const data = unwrapResult(res); // { clubs: [...] } 라고 가정
        const clubs = data.clubs || [];

        const normalized = clubs
          .map((item, idx) => normalizeMyClub(item, idx))
          .filter(Boolean);

        // 현재 로그인한 회원이 만든 클럽만 필터
        const mine = normalized.filter(
          (club) =>
            club.ownerId &&
            String(club.ownerId) === String(myMemberId)
        );

        setMyClubs(mine);
      } catch (error) {
        console.error("내가 만든 동호회 목록 불러오기 실패:", error);
        setMyClubsError(error);
        setMyClubs([]);
      } finally {
        setIsLoadingMyClubs(false);
      }
    };

    fetchMyClubs();
  }, [shouldRender, profile.memberId]);

  // ✅ 프로필 저장 (PATCH /members/{memberId})
  const handleSaveProfile = async () => {
    if (!profile.memberId) {
      alert("회원 ID를 찾을 수 없어요. 다시 로그인 후 시도해 주세요.");
      return;
    }

    try {
      const body = {
        name: profile.name,
        gender: profile.gender,
        birthDate: profile.birthDate,
        email: profile.email,
        phone: profile.phone,
      };

      const updated = await updateMyProfile(profile.memberId, body);

      setProfile((prev) => ({
        ...prev,
        name: updated.name ?? prev.name,
        gender: updated.gender ?? prev.gender,
        birthDate: updated.birthDate ?? updated.birthdate ?? prev.birthDate,
        email: updated.email ?? prev.email,
        phone: updated.phone ?? updated.phoneNumber ?? prev.phone,
        status: updated.status ?? prev.status,
      }));

      alert("내 정보가 저장되었습니다.");
      setIsEditingProfile(false);
    } catch (error) {
      console.error("프로필 수정 실패:", error);
      alert("내 정보 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  // 동호회 정보 변경 핸들러 (id 기준으로 특정 동호회만 수정)
  const handleMyClubChange = (e, id) => {
    const { name, value } = e.target;
    setMyClubs((prev) =>
      prev.map((club) =>
        club.id === id
          ? {
              ...club,
              [name]: value,
            }
          : club
      )
    );
  };

  // ✅ 동호회 정보 저장 (PATCH /club/update/{clubId})
  const handleSaveMyClub = async (id) => {
    const target = myClubs.find((c) => c.id === id);
    if (!target) return;

    try {
      const body = {
        clubName: target.clubName,
        school: target.school,
        sport: target.sport,
        day: target.day,
        time: target.time,
        ageRange: target.ageRange,
        level: target.level,
        fee: target.fee,
        description: target.description,
        representativeName: target.representativeName,
        phone: target.phone,
        email: target.email,
      };

      await api.patch(`/club/update/${id}`, body);
      alert("동호회 정보가 저장되었습니다.");
      setEditingClubId(null);
    } catch (error) {
      console.error("동호회 정보 저장 실패:", error);
      alert("동호회 정보 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("access_token");
    localStorage.removeItem("memberId");
    localStorage.removeItem("username");
    localStorage.removeItem("name");

    alert("로그아웃 되었습니다.");
    navigate("/login");
  };

  if (!shouldRender) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 제목 */}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold text-slate-900">마이페이지</h1>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl justify-around text-sm font-medium text-slate-600">
          {[
            { id: "profile", label: "내 정보" },
            { id: "myClubs", label: "내가 만든 동호회" },
            { id: "settings", label: "설정" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3 transition ${
                tab === t.id
                  ? "border-b-2 border-[#5131C3] text-[#5131C3]"
                  : "hover:text-[#5131C3]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 본문 */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* 내 정보 */}
        {tab === "profile" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">내 정보</h2>
              {isEditingProfile ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-sm"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="rounded-full bg-[#5131C3] px-3 py-1 text-sm text-white"
                  >
                    저장
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700"
                >
                  수정
                </button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  아이디
                </label>
                <input
                  type="text"
                  value={profile.username}
                  disabled
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  이름
                </label>
                <input
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#5131C3]/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  성별
                </label>
                <input
                  type="text"
                  name="gender"
                  value={profile.gender}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#5131C3]/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  생년월일
                </label>
                <input
                  type="text"
                  name="birthDate"
                  value={profile.birthDate}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#5131C3]/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#5131C3]/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  전화
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#5131C3]/40"
                />
              </div>
            </div>
            {isLoadingProfile && (
              <p className="mt-1 text-xs text-slate-400">
                내 정보를 불러오는 중입니다...
              </p>
            )}
            {profileError && (
              <p className="mt-1 text-xs text-red-500">
                내 정보를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
              </p>
            )}
          </section>
        )}

        {/* 내가 만든 동호회 */}
        {tab === "myClubs" && (
          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                내가 만든 동호회
              </h2>
            </div>

            {myClubsError && (
              <p className="text-xs text-red-500">
                동호회 목록을 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해
                주세요.
              </p>
            )}

            {isLoadingMyClubs ? (
              <div className="space-y-2">
                <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                <div className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
              </div>
            ) : myClubs.length === 0 ? (
              <p className="text-sm text-slate-500">
                아직 만든 동호회가 없습니다.{" "}
                <Link
                  to="/clubs/new"
                  className="text-[#5131C3] underline underline-offset-2"
                >
                  동호회 등록하러 가기
                </Link>
              </p>
            ) : (
              <div className="space-y-3">
                {myClubs.map((club) => {
                  const isExpanded = expandedClubId === club.id;
                  const isEditing = editingClubId === club.id;

                  return (
                    <div
                      key={club.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      {/* 상단: 주요 정보 + 토글 */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedClubId((prev) =>
                            prev === club.id ? null : club.id
                          )
                        }
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {club.clubName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {club.school} · {club.sport} · {club.day} ·{" "}
                            {club.time}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {isExpanded ? "접기 ▲" : "자세히 보기 ▼"}
                        </span>
                      </button>

                      {/* 토글 펼친 영역: 상세 + 수정 */}
                      {isExpanded && (
                        <div className="mt-3 border-t border-slate-200 pt-3 text-sm">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                              동호회 상세 정보
                            </p>
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingClubId(null)}
                                  className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={() => handleSaveMyClub(club.id)}
                                  className="rounded-full bg-[#F6A623] px-3 py-1 text-xs text-white"
                                >
                                  저장
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingClubId(club.id)}
                                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700"
                              >
                                수정
                              </button>
                            )}
                          </div>

                          <div className="space-y-3 text-xs md:text-sm">
                            {/* 동호회 이름 */}
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-500">
                                동호회 이름
                              </label>
                              <input
                                type="text"
                                name="clubName"
                                value={club.clubName}
                                onChange={(e) =>
                                  handleMyClubChange(e, club.id)
                                }
                                disabled={!isEditing}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F6A623]/40"
                              />
                            </div>

                            {/* 학교 이름 */}
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-500">
                                학교 이름
                              </label>
                              <input
                                type="text"
                                name="school"
                                value={club.school}
                                onChange={(e) =>
                                  handleMyClubChange(e, club.id)
                                }
                                disabled={!isEditing}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F6A623]/40"
                                placeholder="예: ○○고등학교 / ○○중학교"
                              />
                            </div>

                            {/* 운동 종목 / 활동 강도 */}
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                  운동 종목
                                </label>
                                <input
                                  type="text"
                                  name="sport"
                                  value={club.sport}
                                  onChange={(e) =>
                                    handleMyClubChange(e, club.id)
                                  }
                                  disabled={!isEditing}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F6A623]/40"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                  활동 강도
                                </label>
                                <select
                                  name="level"
                                  value={club.level || ""}
                                  onChange={(e) =>
                                    handleMyClubChange(e, club.id)
                                  }
                                  disabled={!isEditing}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F6A623]/40"
                                >
                                  <option value="">선택해주세요</option>
                                  <option value="입문">입문</option>
                                  <option value="초급">초급</option>
                                  <option value="중급">중급</option>
                                  <option value="상급">상급</option>
                                </select>
                              </div>
                            </div>

                            {/* 활동 요일 / 시간 */}
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                  활동 요일
                                </label>
                                <input
                                  type="text"
                                  name="day"
                                  value={club.day}
                                  onChange={(e) =>
                                    handleMyClubChange(e, club.id)
                                  }
                                  disabled={!isEditing}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F6A623]/40"
                                  placeholder="예: 화요일, 토요일"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                  활동 시간
                                </label>
                                <input
                                  type="text"
                                  name="time"
                                  value={club.time}
                                  onChange={(e) =>
                                    handleMyClubChange(e, club.id)
                                  }
                                  disabled={!isEditing}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F6A623]/40"
                                  placeholder="예: 18:00 ~ 21:00"
                                />
                              </div>
                            </div>

                            {/* 연령대 / 예상 회비 */}
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                  연령대
                                </label>
                                <input
                                  type="text"
                                  name="ageRange"
                                  value={club.ageRange || ""}
                                  onChange={(e) =>
                                    handleMyClubChange(e, club.id)
                                  }
                                  disabled={!isEditing}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F6A623]/40"
                                  placeholder="예: 20대 ~ 30대"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                  예상 회비
                                </label>
                                <input
                                  type="text"
                                  name="fee"
                                  value={club.fee || ""}
                                  onChange={(e) =>
                                    handleMyClubChange(e, club.id)
                                  }
                                  disabled={!isEditing}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F6A623]/40"
                                  placeholder="예: 월 30,000원 / 연 10만원"
                                />
                              </div>
                            </div>

                            {/* 소개글 */}
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-500">
                                소개글
                              </label>
                              <textarea
                                name="description"
                                value={club.description || ""}
                                onChange={(e) =>
                                  handleMyClubChange(e, club.id)
                                }
                                disabled={!isEditing}
                                rows={3}
                                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F6A623]/40"
                                placeholder="동호회 분위기, 모집 대상, 활동 내용을 적어주세요."
                              />
                            </div>

                            {/* 대표 이름 */}
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-500">
                                대표 이름
                              </label>
                              <input
                                type="text"
                                name="representativeName"
                                value={club.representativeName || ""}
                                onChange={(e) =>
                                  handleMyClubChange(e, club.id)
                                }
                                disabled={!isEditing}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F6A623]/40"
                                placeholder="예: 홍길동"
                              />
                            </div>

                            {/* 연락처 */}
                            <div className="grid gap-3 md:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                  대표 전화번호
                                </label>
                                <input
                                  type="tel"
                                  name="phone"
                                  value={club.phone || ""}
                                  onChange={(e) =>
                                    handleMyClubChange(e, club.id)
                                  }
                                  disabled={!isEditing}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F6A623]/40"
                                  placeholder="010-0000-0000"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-slate-500">
                                  대표 이메일
                                </label>
                                <input
                                  type="email"
                                  name="email"
                                  value={club.email || ""}
                                  onChange={(e) =>
                                    handleMyClubChange(e, club.id)
                                  }
                                  disabled={!isEditing}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F6A623]/40"
                                  placeholder="example@email.com"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 설정 */}
        {tab === "settings" && (
          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">설정</h2>

            <button
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50"
              onClick={() => {
                setTab("profile");
                setIsEditingProfile(true);
              }}
            >
              정보 수정
            </button>

            <button
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm text-red-600 hover:bg-slate-50"
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
