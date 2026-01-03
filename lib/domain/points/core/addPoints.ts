// lib/points/core/addPoints.ts
import { supabase } from "@/lib/supabase/server";
import { AddPointsMeta, AddPointsResult } from "@/game/types/point";

export async function addPoints(
  userId: string,
  amount: number,
  meta: AddPointsMeta
): Promise<AddPointsResult> {
  if (!userId) {
    throw new Error("userId is required");
  }

  if (amount <= 0) {
    throw new Error("amount must be greater than 0");
  }

  /** 1️⃣ 현재 포인트 조회 */
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("total_points")
    .eq("id", userId)
    .single();

  if (userError || !user) {
    throw new Error("User not found");
  }

  const newTotalPoints = user.total_points + amount;

  /** 2️⃣ users 테이블 업데이트 */
  const { error: updateError } = await supabase
    .from("users")
    .update({
      total_points: newTotalPoints,
      updated_at: new Date(),
    })
    .eq("id", userId);

  if (updateError) {
    throw new Error("Failed to update user points");
  }

  /** 3️⃣ point_history 기록 */
  const { error: historyError } = await supabase
    .from("point_history")
    .insert({
      user_id: userId,
      amount,
      type: meta.type,
      description: meta.description ?? null,
      balance_after: newTotalPoints,
    });

  if (historyError) {
    throw new Error("Failed to insert point history");
  }

  return {
    totalPoints: newTotalPoints,
  };
}
