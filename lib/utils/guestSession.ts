// lib/utils/guestSession.ts

export interface GuestSession {
  nickname: string;
  createdAt: string;
  lastActivity: string;
  todos?: Record<string, unknown>[];
  notes?: Record<string, unknown>[];
  [key: string]: unknown;
}

// 게스트 세션 생성
export const createGuestSession = (nickname: string): GuestSession => {
  const session: GuestSession = {
    nickname,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    todos: [],
    notes: [],
  };

  localStorage.setItem("guestSession", JSON.stringify(session));
  return session;
};

// 게스트 세션 가져오기
export const getGuestSession = (): GuestSession | null => {
  const data = localStorage.getItem("guestSession");
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

// 게스트 세션 업데이트
export const updateGuestSession = (updates: Partial<GuestSession>) => {
  const current = getGuestSession();
  if (!current) return null;

  const updated = {
    ...current,
    ...updates,
    lastActivity: new Date().toISOString(),
  };

  localStorage.setItem("guestSession", JSON.stringify(updated));
  return updated;
};

// 게스트 데이터에 항목 추가
export const addGuestData = (key: string, data: Record<string, unknown>) => {
  const session = getGuestSession();
  if (!session) return null;

  const currentData =
    (session[key] as Record<string, unknown>[] | undefined) || [];
  const updated = {
    ...session,
    [key]: [...currentData, data],
    lastActivity: new Date().toISOString(),
  };

  localStorage.setItem("guestSession", JSON.stringify(updated));
  return updated;
};

// 게스트 세션 삭제
export const clearGuestSession = () => {
  localStorage.removeItem("guestSession");
};
