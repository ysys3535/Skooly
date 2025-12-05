// src/pages/MyPage.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { api } from "../api/http"; // 공통 axios
import { unwrapResult } from "../api/response"; // { result }만 뽑는 헬퍼
import { getMyProfile, updateMyProfile } from "../api/auth"; // /members/me, /members/{id}
import { updateClub, deleteClub, createClub } from "../api/clubs"; // 동호회 생성/수정/삭제 API

const CLUB_TEMPLATES_KEY = "school_fitness_club_templates";
const getMyCreatedClubKey = (memberId) =>
  memberId ? `my_created_club_ids_${memberId}` : "my_created_club_ids";

const loadMyCreatedClubIds = (memberId) => {
  try {
    const raw = localStorage.getItem(getMyCreatedClubKey(memberId));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.map(String));
    }
  } catch (e) {
    console.warn("내가 만든 클럽 ID 로드 실패:", e);
  }
  return new Set();
};

const saveMyCreatedClubIds = (memberId, ids) => {
  try {
    localStorage.setItem(
      getMyCreatedClubKey(memberId),
      JSON.stringify(Array.from(ids))
    );
  } catch (e) {
    console.warn("내가 만든 클럽 ID 저장 실패:", e);
  }
};

export default function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 로그인 여부(렌더 할지 말지)
  const [shouldRender, setShouldRender] = useState(true);
  const [tab, setTab] = useState(() => location.state?.tab || "profile");

  // 내 정보 상태
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

  // 내가 만든 동호회 목록
  const [myClubs, setMyClubs] = useState([]);
  const [isLoadingMyClubs, setIsLoadingMyClubs] = useState(true);
  const [myClubsError, setMyClubsError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [newClub, setNewClub] = useState({
    clubName: "",
    representativeName: "",
    phone: "",
    email: "",
    description: "",
  });
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [createClubError, setCreateClubError] = useState(null);
  const myMemberIdForUI =
    profile.memberId || localStorage.getItem("memberId") || null;
  const createdIdsForUI = useMemo(
    () => loadMyCreatedClubIds(myMemberIdForUI),
    [myMemberIdForUI]
  );

  // 어떤 동호회 카드가 펼쳐져 있는지(상세)
  const [expandedClubId, setExpandedClubId] = useState(null);
  // 어떤 동호회가 수정 모드인지
  const [editingClubId, setEditingClubId] = useState(null);

  // 로컬 템플릿 불러오기
  const loadLocalClubTemplates = () => {
    try {
      const stored = localStorage.getItem(CLUB_TEMPLATES_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("로컬 클럽 템플릿 로드 실패:", error);
      return [];
    }
  };

  const saveLocalClubTemplates = (templates) => {
    try {
      localStorage.setItem(CLUB_TEMPLATES_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error("로컬 클럽 템플릿 저장 실패:", error);
    }
  };

  // 로그인 체크
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

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const displayGender = (value) => {
    const v = (value || "").toString().toLowerCase();
    if (v === "female") return "여";
    if (v === "male") return "남";
    if (v === "여" || v === "남") return value;
    return value || "";
  };

  // (공통) 클럽 응답을 화면용 상태로 정리
  const normalizeMyClub = (raw, idx) => {
    if (!raw) return null;
    return {
      id: raw.id || raw.clubId || idx,
      clubName: raw.clubName || raw.name || "이름 없는 클럽",
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
      representativeName:
        raw.representativeName ||
        raw.captinName ||
        raw.captainName ||
        raw.captin_name ||
        raw.captain_name ||
        raw.leaderName ||
        "",
      phone: raw.phone || raw.leaderPhone || "",
      email: raw.email || raw.leaderEmail || "",
      ownerId:
        raw.ownerId || raw.memberId || raw.creatorId || raw.leaderId || null,
    };
  };

  // 1) 내 정보 불러오기 (GET /members/me)
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

  // URL state로 전달된 탭 이동 지원 (예: /mypage, { state: { tab: "myClubs" } })
  useEffect(() => {
    if (location.state?.tab) {
      setTab(location.state.tab);
    }
  }, [location.state?.tab]);

  // 2) 내가 만든 동호회 목록 불러오기
  useEffect(() => {
    if (!shouldRender) return;

    const myMemberId =
      profile.memberId || Number(localStorage.getItem("memberId"));

    if (!myMemberId) return;
    const createdIds = loadMyCreatedClubIds(myMemberId);
    const fetchMyClubs = async () => {
      setIsLoadingMyClubs(true);
      setMyClubsError(null);

      try {
        // 스펙: GET /club/find -> ApiResponse<{ clubs: ClubItem[] }>
        const res = await api.get("/club/find");
        const data = unwrapResult(res); // { clubs: [...] }
        const clubs = data.clubs || [];

        const normalized = clubs
          .map((item, idx) => normalizeMyClub(item, idx))
          .filter(Boolean);

        // 위에서 등록한 기본정보(기록된 clubId)만 노출
        const mine = normalized.filter((club) => {
          const cid =
            club.id || club.clubId || club.club_id || club.clubid || null;
          return cid && createdIds.has(String(cid));
        });

        // 로컬 템플릿과 병합
        const localTemplates = loadLocalClubTemplates();
        const localMine = localTemplates
          .filter(
            (tpl) =>
              !tpl.ownerId || String(tpl.ownerId) === String(myMemberId)
          )
          .map((tpl, idx) => normalizeMyClub(tpl, `local-${idx}`))
          .filter(Boolean);

        const merged = [...mine];
        const existingIds = new Set(merged.map((c) => String(c.id)));

        // localMine에 같은 id가 있으면 최신값으로 덮어쓰기, 없으면 추가
        localMine.forEach((club, idx) => {
          const id =
            club.id ?? club.clubId ?? club.club_id ?? club.clubid ?? `local-${idx}`;
          const key = String(id);
          const payload = { ...club, id };
          const existIdx = merged.findIndex((c) => String(c.id) === key);
          if (existIdx >= 0) {
            merged[existIdx] = { ...merged[existIdx], ...payload };
          } else if (!existingIds.has(key)) {
            merged.push(payload);
          }
          existingIds.add(key);
        });

        setMyClubs(merged);
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

  // 3) 내 프로필 수정 (PATCH /members/{memberId})
  const handleSaveProfile = async () => {
    if (!profile.memberId) {
      alert("회원 ID를 찾을 수 없습니다. 다시 로그인해 주세요.");
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

      alert("내 정보가 수정되었습니다.");
      setIsEditingProfile(false);
    } catch (error) {
      console.error("프로필 수정 실패:", error);
      alert("내 정보 수정 중 오류가 발생했습니다. 다시 시도해 주세요.");
    }
  };

  // 동호회 카드 입력값 변경
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

  const handleNewClubChange = (e) => {
    const { name, value } = e.target;
    setNewClub((prev) => ({ ...prev, [name]: value }));
  };

  // 4) 동호회 정보 수정 (PATCH /club/update/{clubId})
  const handleSaveMyClub = async (id) => {
    const target = myClubs.find((c) => c.id === id);
    if (!target) return;

    const clubId = Number(id);
    if (!clubId || Number.isNaN(clubId)) {
      alert("클럽 ID를 확인할 수 없습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }

    try {
      // 백엔드 DTO에 맞춰서 작성 (필드명은 서버 스펙에 따라 조정)
      const payload = {
        name: target.clubName,
        captin_name: target.representativeName,
        captain_name: target.representativeName,
        phone: target.phone,
        email: target.email,
        description: target.description,
      };

      const updated = await updateClub(clubId, payload);

      // 로컬 템플릿도 업데이트해서 새로고침 시 유지
      const existingTemplates = loadLocalClubTemplates();
      const filtered = existingTemplates.filter((c) => {
        const cid = c.id ?? c.clubId ?? c.club_id ?? c.clubid;
        return String(cid) !== String(clubId);
      });
      filtered.push({
        id: clubId,
        clubId,
        clubName: updated?.name || target.clubName,
        representativeName:
          updated?.captinName ||
          updated?.captainName ||
          updated?.captain_name ||
          updated?.captin_name ||
          target.representativeName,
        phone: updated?.phone || target.phone,
        email: updated?.email || target.email,
        description: updated?.description || target.description,
        ownerId: profile.memberId || localStorage.getItem("memberId"),
      });
      saveLocalClubTemplates(filtered);

      setMyClubs((prev) =>
        prev.map((club) =>
          club.id === id
            ? {
                ...club,
                clubName: updated?.name || target.clubName,
                representativeName:
                  updated?.captinName ||
                  updated?.captainName ||
                  updated?.captain_name ||
                  updated?.captin_name ||
                  target.representativeName,
                phone: updated?.phone || target.phone,
                email: updated?.email || target.email,
                description: updated?.description || target.description,
              }
            : club
        )
      );

      alert("동호회 정보가 수정되었습니다.");
      setEditingClubId(null);
    } catch (error) {
      console.error("동호회 정보 수정 실패:", error);
      alert("동호회 정보 수정 중 문제가 발생했습니다. 다시 시도해 주세요.");
    }
  };

  // 5) 동호회 삭제 (DELETE /club/delete/{clubId})
  const handleDeleteMyClub = async (id) => {
    const clubId = Number(id);
    if (!clubId || Number.isNaN(clubId)) {
      alert("클럽 ID를 확인할 수 없습니다. 새로고침 후 다시 시도해 주세요.");
      return;
    }

    if (!window.confirm("정말 이 동호회를 삭제하시겠습니까?")) return;

    try {
      setDeletingId(id);
      await deleteClub(clubId);

      setMyClubs((prev) =>
        prev.filter((club) => String(club.id) !== String(id))
      );

      const templates = loadLocalClubTemplates();
      const filtered = templates.filter((c) => {
        const cid = c.id ?? c.clubId ?? c.club_id ?? c.clubid;
        return String(cid) !== String(clubId);
      });
      saveLocalClubTemplates(filtered);

      alert("동호회가 삭제되었습니다.");
    } catch (error) {
      console.error("동호회 삭제 실패:", error);
      alert("동호회 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateNewClub = async () => {
    if (!newClub.clubName || !newClub.representativeName || !newClub.phone || !newClub.description) {
      alert("동호회 이름, 대표자 이름, 대표 전화번호, 소개는 필수입니다.");
      return;
    }

    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(newClub.phone)) {
      alert("전화번호는 010-1234-5678 형식으로 입력해 주세요.");
      return;
    }

    const payload = {
      clubName: newClub.clubName,
      captainName: newClub.representativeName,
      phone: newClub.phone,
      email: newClub.email || null,
      description: newClub.description,
    };

    setIsCreatingClub(true);
    setCreateClubError(null);
    try {
      const created = await createClub(payload);
      const normalized = normalizeMyClub(created, created?.id || created?.clubId);

      setMyClubs((prev) => {
        const next = normalized ? [normalized, ...prev] : prev;
        return next;
      });

      // 내가 만든 클럽 ID 기록
      try {
        const myId = profile.memberId || localStorage.getItem("memberId");
        const ids = loadMyCreatedClubIds(myId);
        const cid =
          normalized?.id ||
          normalized?.clubId ||
          normalized?.club_id ||
          normalized?.clubid;
        if (cid != null) {
          ids.add(String(cid));
          saveMyCreatedClubIds(myId, ids);
        }
      } catch (e) {
        console.warn("내가 만든 클럽 ID 저장 실패:", e);
      }

      setNewClub({
        clubName: "",
        representativeName: "",
        phone: "",
        email: "",
        description: "",
      });

      alert("동호회 기본 정보가 등록되었습니다.");
    } catch (error) {
      console.error("동호회 기본 정보 등록 실패:", error);
      setCreateClubError(error);
      alert("동호회 기본 정보 등록 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsCreatingClub(false);
    }
  };

  // 로그아웃
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
      {/* 상단 헤더 */}
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
              className={
                "flex-1 py-3 transition " +
                (tab === t.id
                  ? "border-b-2 border-[#5131C3] text-[#5131C3]"
                  : "hover:text-[#5131C3]")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 본문 */}
      <main className="mx-auto max-w-3xl px-4 py-6">
        {/* 내 정보 탭 */}
        {tab === "profile" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                내 정보
              </h2>
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
                  value={displayGender(profile.gender)}
                  onChange={handleProfileChange}
                  disabled={!isEditingProfile}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#5131C3]/40"
                  placeholder="예) 남 / 여"
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
                  전화번호
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
                내 정보를 불러오는 중 문제가 발생했습니다. 다시 시도해 주세요.
              </p>
            )}
          </section>
        )}

        {/* 내가 만든 동호회 탭 */}
        {tab === "myClubs" && (
          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                내가 만든 동호회
              </h2>
            </div>

            {/* 동호회 기본정보 등록 폼 */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">동호회 기본 정보 등록</p>
              <p className="mt-1 text-xs text-slate-500">
                아래 정보를 저장하면 동호회 등록 페이지에서 자동으로 불러옵니다.
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    동호회 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="clubName"
                    value={newClub.clubName}
                    onChange={handleNewClubChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="예) 스쿨리 농구 동호회"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    대표자 이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="representativeName"
                    value={newClub.representativeName}
                    onChange={handleNewClubChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="대표자 성함"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    대표 전화번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newClub.phone}
                    onChange={handleNewClubChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="010-1234-5678"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    이메일
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newClub.email}
                    onChange={handleNewClubChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="example@email.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    동호회 소개 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={newClub.description}
                    onChange={handleNewClubChange}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="클럽 활동 내용과 분위기를 소개해 주세요."
                  />
                </div>
              </div>
              {createClubError && (
                <p className="mt-2 text-xs text-red-500">
                  동호회 기본 정보를 등록하는 중 문제가 발생했습니다. 다시 시도해 주세요.
                </p>
              )}
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateNewClub}
                  disabled={isCreatingClub}
                  className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isCreatingClub ? "저장 중..." : "기본 정보 등록"}
                </button>
              </div>
            </div>

            {myClubsError && (
              <p className="text-xs text-red-500">
                동호회 목록을 불러오는 중 문제가 발생했습니다. 다시 시도해
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
                  const isMyClub =
                    myMemberIdForUI &&
                    club.ownerId &&
                    String(club.ownerId) === String(myMemberIdForUI);

                  return (
                    <div
                      key={club.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      {/* 상단: 주요 정보 + 펼치기 */}
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

                      {/* 펼쳐진 영역: 상세 + 수정 */}
                      {isExpanded && (
                        <div className="mt-3 border-t border-slate-200 pt-3 text-sm">
                          {isMyClub && (
                            <div className="mb-3 flex items-center justify-between">
                              {isEditing ? (
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => setEditingClubId(null)}
                                    className="rounded-full border border-slate-200 px-3 py-1 text-xs"
                                  >
                                    취소
                                  </button>
                                  <button
                                    onClick={() => handleSaveMyClub(club.id)}
                                    className="rounded-full bg-[#F6A623] px-3 py-1 text-xs text-white disabled:opacity-60"
                                    disabled={deletingId === club.id}
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMyClub(club.id)}
                                    className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    disabled={deletingId === club.id}
                                  >
                                    {deletingId === club.id ? "삭제 중..." : "삭제"}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingClubId(club.id)}
                                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700"
                                    disabled={deletingId === club.id}
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMyClub(club.id)}
                                    className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    disabled={deletingId === club.id}
                                  >
                                    {deletingId === club.id ? "삭제 중..." : "삭제"}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

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

                            {/* 대표자 이름 */}
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-500">
                                대표자 이름
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
                                placeholder="예) 홍길동"
                              />
                            </div>

                            {/* 연락처 + 소개글 */}
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
                              <div className="md:col-span-2">
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
                                  placeholder="동호회 분위기, 모집 대상, 활동 내용을 적어 주세요."
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

        {/* 설정 탭 */}
        {tab === "settings" && (
          <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              설정
            </h2>

            <button
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50"
              onClick={() => {
                setTab("profile");
                setIsEditingProfile(true);
              }}
            >
              내 정보 수정하기
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
