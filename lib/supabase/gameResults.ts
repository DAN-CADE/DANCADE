// lib/supabase/gameResults.ts
import { supabase } from "@/lib/supabase/server";
import { DB_TABLES } from "@/lib/constants/tables";
import {
  InsertGameResultParams,
  InsertSingleGameResultParams,
} from "@/types/gameResults";

// =====================================================================
/**
 * game_results 테이블에 기록 삽입
 */
// =====================================================================

export const insertGameResult = async (
  params: Partial<InsertSingleGameResultParams>
) => {
  const { data, error } = await supabase
    .from(DB_TABLES.GAME_RESULTS)
    .insert({
      ...params,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select();

  if (error) {
    console.error("[DB 에러] insertGameResult:", error.message);
    throw error;
  }

  return data?.[0];
};

// =====================================================================
/**
 * multi_game_results 테이블에 기록 삽입
 */
// =====================================================================

export const insertMultiGameResult = async (
  params: Partial<InsertGameResultParams>
) => {
  const { data, error } = await supabase
    .from(DB_TABLES.MULTI_GAME_RESULTS)
    .insert({
      ...params,
      played_at: new Date().toISOString(),
    })
    .select();

  if (error) {
    console.error("[DB 에러] insertMultiGameResult:", error.message);
    throw error;
  }

  return data?.[0];
};
