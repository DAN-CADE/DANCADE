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

// =====================================================================
// =====================================================================

export async function updateStatsAfterGame(
  userId: string,
  isWinner: boolean,
  gameType: string
): Promise<UserStats | null> {
  // 기존 통계 조회
  const currentStats = await getUserStats(userId);

  if (currentStats) {
    const wins = currentStats.total_wins + (isWinner ? 1 : 0);
    const games = currentStats.total_games_played + 1;

    return await upsertUserStats({
      user_id: userId,
      total_wins: wins,
      total_losses: currentStats.total_losses + (isWinner ? 0 : 1),
      total_games_played: games,
      win_rate: Math.round((wins / games) * 100),
      favorite_game: gameType,
    });
  } else {
    // 첫 게임
    return await upsertUserStats({
      user_id: userId,
      total_wins: isWinner ? 1 : 0,
      total_losses: isWinner ? 0 : 1,
      total_games_played: 1,
      win_rate: isWinner ? 100 : 0,
      favorite_game: gameType,
    });
  }
}
