// =====================================================================
/**
 * game_results 테이블 주입 컬럼
 */
// =====================================================================

export interface InsertGameResultParams {
  game_type: string;
  play_mode: "single" | "multiplayer";
  user_id: string;
  opponent_id?: string;
  winner_id?: string;
  is_win: boolean;
  score?: number;
  game_duration?: number;
  room_id?: string;
  points_awarded?: number;
  is_ranked?: boolean;
  metadata?: Record<string, unknown>;
}

// =====================================================================
/**
 * multi_game_results 테이블 주입 컬럼
 */
// =====================================================================

export interface InsertMultiGameResultParams {
  room_id: string;
  game_type: string;
  winner_user_id: string;
  loser_user_id: string;
  winner_score: number;
  loser_score: number;
}
