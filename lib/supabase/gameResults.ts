// lib/supabase/gameResults.ts
import { supabase } from "@/lib/supabase/server";
import { DB_TABLES } from "@/constants/tables";
import {
  InsertGameResultParams,
  InsertMultiGameResultParams,
} from "@/types/gameResults";

// =====================================================================
/**
 * game_results 테이블에 기록 삽입
 */
// =====================================================================

export const insertGameResult = async (
  params: Partial<InsertGameResultParams> | Partial<InsertGameResultParams>[]
) => {
  const { data, error } = await supabase
    .from(DB_TABLES.GAME_RESULTS)
    .insert(params)
    .select();

  if (error) {
    console.error("[DB 에러] insertGameResult:", error.message);
    throw error;
  }

  return data;
};

// =====================================================================
/**
 * multi_game_results 테이블에 기록 삽입
 */
// =====================================================================

export const insertMultiGameResult = async (
  params: Partial<InsertMultiGameResultParams>
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

  return data;
};
