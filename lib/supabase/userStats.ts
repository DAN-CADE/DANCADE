import { supabase } from "@/lib/supabase/server";
import { UserStats } from "@/types/user";
import { DB_TABLES } from "@/constants/tables";

// =====================================================================
/**
 * 특정 유저의 통계 조회
 */
// =====================================================================

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from(DB_TABLES.USER_STATS)
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // 데이터가 없는 경우는 에러가 아니라 null 반환
    return null;
  }

  return data;
}

// =====================================================================
/**
 * 통계 업데이트 또는 생성 (Upsert)
 */
// =====================================================================

export async function upsertUserStats(stats: Partial<UserStats>) {
  const { data, error } = await supabase
    .from(DB_TABLES.USER_STATS)
    .upsert(stats, { onConflict: "user_id" })
    .select();

  if (error) {
    console.error("[userStats] upsertUserStats 에러:", error);
    return null;
  }

  return data?.[0];
}
