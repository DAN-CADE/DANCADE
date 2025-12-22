import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================
// 플레이어 생성/업데이트
// ============================================

/**
 * 플레이어 입장 시 데이터 생성
 */
export async function upsertPlayer(
  userId: string,
  x: number = 0,
  y: number = 0
) {
  const { data, error } = await supabase
    .from("players")
    .upsert(
      {
        user_id: userId,
        x,
        y,
        is_online: true,
        last_active: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select();

  if (error) {
    console.error("❌ upsertPlayer 에러:", error);
    return null;
  }

  return data?.[0];
}

// ============================================
// 플레이어 위치 업데이트
// ============================================

/**
 * 플레이어 위치만 업데이트 (자주 호출됨)
 */
export async function updatePlayerPosition(
  userId: string,
  x: number,
  y: number
) {
  const { data, error } = await supabase
    .from("players")
    .update({
      x,
      y,
      last_active: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select();

  if (error) {
    console.error("❌ updatePlayerPosition 에러:", error);
    return null;
  }

  return data?.[0];
}

// ============================================
// 플레이어 조회
// ============================================

/**
 * 온라인 플레이어 목록 조회
 */
export async function getOnlinePlayers() {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("is_online", true)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("❌ getOnlinePlayers 에러:", error);
    return [];
  }

  return data || [];
}

/**
 * 특정 플레이어 조회
 */
export async function getPlayer(userId: string) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("❌ getPlayer 에러:", error);
    return null;
  }

  return data;
}

// ============================================
// 플레이어 상태 변경
// ============================================

/**
 * 플레이어 오프라인 처리
 */
export async function setPlayerOffline(userId: string) {
  const { data, error } = await supabase
    .from("players")
    .update({
      is_online: false,
      last_active: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .select();

  if (error) {
    console.error("❌ setPlayerOffline 에러:", error);
    return null;
  }

  return data?.[0];
}

// ============================================
// Realtime 구독
// ============================================

/**
 * 플레이어 변경사항 실시간 구독
 */
export function subscribeToPlayers(
  callback: (
    event: "INSERT" | "UPDATE" | "DELETE",
    payload: Record<string, unknown>
  ) => void
) {
  const subscription = supabase
    .channel("players-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "players",
      },
      (payload) => {
        callback(
          payload.eventType as "INSERT" | "UPDATE" | "DELETE",
          payload.new
        );
      }
    )
    .subscribe();

  return subscription;
}
