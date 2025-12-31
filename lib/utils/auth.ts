import { supabase } from "@/lib/supabase/client";

/**
 * 게임 전역에서 사용하는 통합 유저 타입
 */
export interface UserData {
  userId: string;
  nickname: string;
  isGuest: boolean;
  points: number;
  createdAt?: string;
  uuid?: string;
}

// =====================================================================
// DB 조회
// =====================================================================

/**
 * Supabase DB에서 실제 회원 유저 조회
 */
export async function fetchUserFromDB(
  userid: string
): Promise<UserData | null> {
  const { data, error } = await supabase
    .from("users")
    .select("userid, nickname, is_guest, total_points, created_at, id")
    .eq("userid", userid)
    .single();

  if (error || !data) {
    console.error("유저 DB 조회 실패:", error);
    return null;
  }

  return {
    userId: data.userid,
    nickname: data.nickname,
    isGuest: data.is_guest,
    points: data.total_points ?? 0,
    createdAt: data.created_at,
    uuid: data.id,
  };
}

// =====================================================================
// LocalStorage
// =====================================================================

/**
 * 로컬스토리지에서 유저 정보 읽기
 * (캐시 또는 게스트 용도)
 * ⭐ 스네이크 케이스 → 카멜 케이스 변환 지원
 */
export function getUserDataFromLocal(): UserData | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // ⭐ 스네이크 케이스 → 카멜 케이스 변환
    return {
      userId: parsed.userId || parsed.userid, // ⭐ 둘 다 지원
      nickname: parsed.nickname,
      isGuest: parsed.isGuest ?? parsed.is_guest ?? false,
      points: parsed.points ?? parsed.total_points ?? 0,
      createdAt: parsed.createdAt || parsed.created_at,
      uuid: parsed.uuid || parsed.id, // ⭐ id를 uuid로
    };
  } catch (e) {
    console.error("로컬 유저 데이터 파싱 실패:", e);
    return null;
  }
}

/**
 * 로컬스토리지에 유저 정보 저장
 */
export function saveUserToLocal(user: UserData) {
  if (typeof window === "undefined") return;
  localStorage.setItem("user", JSON.stringify(user));
}

/**
 * 로컬스토리지 유저 정보 제거
 */
export function clearLocalUser() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
}

// =====================================================================
// 게스트 관련
// =====================================================================

export function generateGuestId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generateGuestNickname(): string {
  return `게스트_${Math.floor(1000 + Math.random() * 9000)}`;
}

/**
 * 게스트 유저 생성 또는 기존 게스트 반환
 */
export async function getOrCreateGuestUser(): Promise<UserData> {
  const local = getUserDataFromLocal();
  if (local && local.isGuest) {
    return local;
  }

  const guest: UserData = {
    userId: generateGuestId(),
    nickname: generateGuestNickname(),
    isGuest: true,
    points: 0,
    createdAt: new Date().toISOString(),
    uuid: undefined,
  };

  // DB에 게스트 저장 (통계/랭킹/확장 대비)
  const { error } = await supabase.from("users").insert({
    userid: guest.userId,
    nickname: guest.nickname,
    is_guest: true,
    total_points: 0,
  });

  if (error) {
    console.error("게스트 DB 등록 실패:", error);
  }

  saveUserToLocal(guest);
  return guest;
}

// =====================================================================
// 현재 유저 가져오기
// =====================================================================

/**
 * 우선순위:
 * 1. 로컬 게스트
 * 2. Supabase Auth 로그인 유저 → DB 조회
 */
export async function getCurrentUser(): Promise<UserData | null> {
  // 로컬 유저 최우선 (게스트 + 로그인 공통)
  const local = getUserDataFromLocal();
  if (local) {
    console.log("[getCurrentUser] localStorage에서 로드:", local);
    return local;
  }

  // Supabase Auth 확인
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const userid = user.user_metadata?.userid;

  if (!userid) {
    console.error("[getCurrentUser] userid 없음 (user_metadata 누락)");
    return null;
  }

  // DB 조회 (userid 기준)
  let dbUser = await fetchUserFromDB(userid);

  // 없으면 생성
  if (!dbUser) {
    dbUser = {
      userId: userid,
      nickname: user.user_metadata?.nickname ?? userid,
      isGuest: false,
      createdAt: new Date().toISOString(),
      points: 0,
      uuid: user.id,
    };

    await createUserInDB(dbUser, user.id);
  }

  // 로컬 캐시
  saveUserToLocal(dbUser);

  return dbUser;
}

// =====================================================================
// 간편 헬퍼
// =====================================================================

/**
 * getUserData 별칭 (하위 호환성)
 * - BaseRoomManager 등에서 동기 호출
 * - localStorage만 읽음
 */
export function getUserData(): UserData | null {
  return getUserDataFromLocal();
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.userId ?? null;
}

export async function getCurrentNickname(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.nickname ?? null;
}

export async function isGuestUser(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.isGuest ?? false;
}

async function createUserInDB(user: UserData, authUUID: string) {
  const { error } = await supabase.from("users").insert({
    userid: user.userId,
    nickname: user.nickname,
    is_guest: false,
    total_points: 0,
  });

  if (error) {
    console.error("유저 DB 생성 실패", error);
  }
}
