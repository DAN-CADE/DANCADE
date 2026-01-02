// lib/points/single/rewardSingle.ts
import { supabase } from "@/lib/supabase/server";
import { addPoints } from "@/lib/domain/points/core/addPoints";

const SINGLE_REWARD_POINTS = 100;

export async function rewardSingle(
  userId: string,
  gameType: string,
  score: number
) {
  /** 1️⃣ 플레이 기록 저장 */
  await supabase.from("game_scores").insert({
    user_id: userId,
    game_type: gameType,
    score,
    play_mode: "single",
  });

  /** 2️⃣ 기존 랭킹 조회 */
  const { data: ranking } = await supabase
    .from("game_rankings")
    .select("id, high_score")
    .eq("user_id", userId)
    .eq("game_type", gameType)
    .single();

  const prevHighScore = ranking?.high_score ?? 0;

  /** 3️⃣ 기록 갱신 체크 */
  if (score <= prevHighScore) {
    return {
      rewarded: false,
      earnedPoints: 0,
    };
  }

  /** 4️⃣ 랭킹 갱신 */
  if (ranking) {
    await supabase
      .from("game_rankings")
      .update({
        high_score: score,
        updated_at: new Date(),
      })
      .eq("id", ranking.id);
  } else {
    await supabase.from("game_rankings").insert({
      user_id: userId,
      game_type: gameType,
      high_score: score,
    });
  }

  /** 5️⃣ 포인트 지급 (🔥 core 사용) */
  const { totalPoints } = await addPoints(userId, SINGLE_REWARD_POINTS, {
    type: "single_record_break",
    description: `${gameType} 최고 기록 갱신`,
  });

  return {
    rewarded: true,
    earnedPoints: SINGLE_REWARD_POINTS,
    totalPoints,
  };
}
