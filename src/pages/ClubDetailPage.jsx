// src/pages/ClubDetailPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getClubs,
  updateSchoolClub,
  deleteSchoolClub,
} from "../api/clubs";

const normalizeClub = (raw, fallbackId) => {
  if (!raw) return null;

  const id = raw.schoolClubId || raw.id || raw.clubId || fallbackId;
  const schoolId = raw.schoolId ?? null;
  const schoolName = raw.schoolName || raw.school || "학교 정보 없음";

  const sport = Array.isArray(raw.sportNames)
    ? raw.sportNames.join(", ")
    : raw.sport || "종목 미정";

  const day = raw.activeDays || raw.day || "활동 요일 정보 없음";
  const time = raw.activeTime || raw.time || "활동 시간 정보 없음";

  const ageRange = raw.ageRange || "";
  const intensity = raw.activityLevel || raw.intensity || raw.level || "정보 없음";

  const fee =
    typeof raw.fee === "number"
      ? `${raw.fee.toLocaleString()}원`
      : raw.fee || "";

  const intro =
    raw.schoolClubDescription || raw.clubDescription || raw.description || "";

  const leaderPhone = raw.phone || "";
  const leaderEmail = raw.email || "";

  return {
    id,
    name: raw.name || raw.clubName || "이름 없는 동호회",
    schoolId,
    schoolName,
    sport,
    day,
    time,
    ageRange,
    intensity,
    fee,
    intro,
    leaderPhone,
    leaderEmail,
  };
};

export default function ClubDetailPage() {
  const navigate = useNavigate();
  const { clubId } = useParams();

  const [club, setClub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [edit, setEdit] = useState({
    activeDays: "",
    activeTime: "",
    ageRange: "",
    activityLevel: "",
    fee: "",
    description: "",
    sportNames: "",
  });

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
        return level || "BEGINNER";
    }
  };

  useEffect(() => {
    const fetchClub = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await getClubs();
        const list = result.clubs || [];
        const numericId = Number(clubId);
        const raw =
          list.find((c) => {
            const targets = [
              c.schoolClubId,
              c.schoolClubID,
              c.id,
              c.clubId,
            ];
            return targets.some(
              (val) =>
                val === numericId ||
                String(val) === clubId
            );
          }) || null;

        const normalized = normalizeClub(raw, clubId);
        setClub(normalized);
      } catch (error) {
        console.error("클럽 상세 조회 실패:", error);
        setLoadError(error);
        if (error.code === "ERR_NETWORK") {
          alert("서버가 아직 준비되지 않았어요. 서버가 켜지면 다시 시도해주세요!");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchClub();
  }, [clubId]);

  useEffect(() => {
    if (club) {
      setEdit({
        activeDays: club.day || "",
        activeTime: club.time || "",
        ageRange: club.ageRange || "",
        activityLevel: club.intensity || "",
        fee: club.fee || "",
        description: club.intro || "",
        sportNames: club.sport || "",
      });
    }
  }, [club]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEdit((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    if (!club?.id) {
      alert("clubId를 확인할 수 없습니다.");
      return;
    }

    const payload = {
      activeDays: edit.activeDays,
      activeTime: edit.activeTime,
      ageRange: edit.ageRange,
      activityLevel: mapLevelToEnum(edit.activityLevel),
      fee: edit.fee ? Number(edit.fee) || 0 : 0,
      description: edit.description,
      sportNames:
        edit.sportNames && edit.sportNames.trim().length > 0
          ? edit.sportNames.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
    };

    try {
      await updateSchoolClub(club.id, payload);
      alert("동호회 정보가 수정되었습니다.");
      setIsEditing(false);
      setClub((prev) => ({
        ...prev,
        day: edit.activeDays,
        time: edit.activeTime,
        ageRange: edit.ageRange,
        intensity: edit.activityLevel || prev.intensity,
        fee: edit.fee,
        intro: edit.description,
        sport: edit.sportNames,
      }));
    } catch (error) {
      console.error("동호회 수정 실패:", error);
      alert(error.message || "수정 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async () => {
    if (!club?.id) {
      alert("clubId를 확인할 수 없습니다.");
      return;
    }
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteSchoolClub(club.id);
      alert("동호회가 삭제되었습니다.");
      navigate(-1);
    } catch (error) {
      console.error("동호회 삭제 실패:", error);
      alert(error.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#EFF6FF] min-h-screen bg-slate-50">
        <header className="bg-white border-b">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
            >
              <span className="text-2xl text-gray-700">←</span>
            </button>
            <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          </div>
        </header>
        <main className="mx-auto max-w-4xl space-y-5 px-4 py-4 md:py-6">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-50" />
          </section>
        </main>
      </div>
    );
  }

  if (!club || loadError) {
    return (
      <div className="bg-[#EFF6FF] min-h-screen bg-slate-50">
        <header className="bg-white border-b">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
            >
              <span className="text-2xl text-gray-700">←</span>
            </button>
            <div>
              <h1 className="text-lg font-semibold md:text-xl">
                동호회 정보를 불러오지 못했어요
              </h1>
              <p className="mt-1 text-xs text-gray-500 md:text-sm">
                페이지를 새로고침하거나, 목록에서 다시 선택해 주세요.
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
          <div className="rounded-2xl bg-white p-6 text-center text-sm text-gray-600 shadow-sm md:text-base">
            동호회 정보가 존재하지 않거나, 서버와의 통신 중 문제가 발생했습니다.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-[#EFF6FF] min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/5"
          >
            <span className="text-2xl text-gray-700">←</span>
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:gap-3">
            <div>
              <h1 className="text-lg font-semibold md:text-xl">{club.name}</h1>
              <p className="mt-1 text-xs text-gray-500 md:text-sm">
                {club.schoolName} · {club.sport}
              </p>
            </div>
            <div className="mt-2 flex gap-2 md:mt-0">
              <button
                type="button"
                onClick={() => setIsEditing((prev) => !prev)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:border-blue-500 hover:text-blue-600"
              >
                {isEditing ? "수정 취소" : "수정하기"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-600 hover:border-red-400 hover:bg-red-50"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-4 md:py-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          {!isEditing ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold md:text-base">동호회 소개</h2>
                <div className="flex flex-wrap gap-2 text-[11px] md:text-xs">
                  <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                    {club.sport}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                    {club.day}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    강도: {club.intensity}
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-xs text-gray-800 md:text-sm">
                {club.intro || "동호회 소개글이 아직 등록되지 않았습니다."}
              </div>

              <div className="mt-5 grid gap-3 text-xs text-gray-700 md:grid-cols-2 md:text-sm">
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold text-slate-500 md:text-xs">
                    활동 요일
                  </p>
                  <p className="mt-1 font-medium text-gray-900">{club.day}</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold text-slate-500 md:text-xs">
                    활동 시간
                  </p>
                  <p className="mt-1 font-medium text-gray-900">{club.time}</p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold text-slate-500 md:text-xs">
                    연령대
                  </p>
                  <p className="mt-1 font-medium text-gray-900">
                    {club.ageRange || "연령대 정보 없음"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold text-slate-500 md:text-xs">
                    활동 강도
                  </p>
                  <p className="mt-1 font-medium text-gray-900">{club.intensity}</p>
                </div>

                <div className="md:col-span-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-3">
                  <p className="text-[11px] font-semibold text-amber-700 md:text-xs">
                    예상 회비
                  </p>
                  <p className="mt-1 text-xs text-amber-900 md:text-sm">
                    {club.fee || "회비 정보는 추후 안내 예정입니다."}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold md:text-base">동호회 정보 수정</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    활동 요일
                  </label>
                  <input
                    type="text"
                    name="activeDays"
                    value={edit.activeDays}
                    onChange={handleEditChange}
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
                    name="activeTime"
                    value={edit.activeTime}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="예: 18:00 ~ 21:00"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    연령대
                  </label>
                  <input
                    type="text"
                    name="ageRange"
                    value={edit.ageRange}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="예: 20대 ~ 30대"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    활동 강도
                  </label>
                  <select
                    name="activityLevel"
                    value={edit.activityLevel}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">선택해주세요</option>
                    <option value="입문">입문</option>
                    <option value="초급">초급</option>
                    <option value="중급">중급</option>
                    <option value="상급">상급</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    예상 회비
                  </label>
                  <input
                    type="text"
                    name="fee"
                    value={edit.fee}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="예: 월 30,000원 / 연 10만원"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    소개글
                  </label>
                  <textarea
                    name="description"
                    value={edit.description}
                    onChange={handleEditChange}
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="동호회 소개/공지 등을 입력하세요."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    종목명 배열 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    name="sportNames"
                    value={edit.sportNames}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="예: 테니스, 배드민턴"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleUpdate}
                  className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                >
                  수정 저장
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold md:text-base">동호회 대표 / 연락처</h2>
          <p className="mt-1 text-[11px] text-slate-500 md:text-xs">
            가입 문의, 일정 조율 등은 아래 대표 연락처로 문의해 주세요.
          </p>

          <div className="mt-4 grid gap-3 text-xs text-gray-700 md:grid-cols-2 md:text-sm">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold text-slate-500 md:text-xs">
                대표 전화번호
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 md:text-base">
                {club.leaderPhone || "전화번호 정보 없음"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold text-slate-500 md:text-xs">
                대표 이메일
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900 md:text-base">
                {club.leaderEmail || "이메일 정보 없음"}
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="text-xs text-gray-600 md:text-sm">
            <p className="font-semibold text-gray-900">사용 학교 정보</p>
            <p className="mt-1 leading-relaxed">
              이 동호회는{" "}
              <span className="font-semibold">{club.schoolName}</span>의 체육시설을
              사용하고 있어요.
            </p>
            <p className="mt-1 text-[11px] text-slate-500 md:text-xs">
              시설 종류, 예약 가능 시간 등은 학교 상세 페이지에서 확인할 수 있습니다.
            </p>
          </div>

          {club.schoolId ? (
            <Link
              to={`/school/${club.schoolId}`}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 md:text-sm"
            >
              학교 상세 페이지 보기
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center rounded-xl bg-gray-300 px-4 py-2 text-xs font-semibold text-white md:text-sm"
            >
              학교 정보 없음
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
