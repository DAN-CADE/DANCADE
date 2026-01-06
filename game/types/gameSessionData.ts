// game/types/GameSessionData.ts

import { UserStats } from "@/types/user";

export interface gameSessionData {
  userId: string;
  gameId: string;
  mode: "single" | "multi";
}

/**
 * 게임 결과 저장 요청 데이터
 */
export interface SaveGameResultRequest {
  room_id?: string;
  game_type: string;
  winner_user_id: string;
  loser_user_id: string;
  winner_score?: number;
  loser_score?: number;
}

/**
 * 게임 결과 저장 응답
 */
export interface SaveGameResultResponse {
  success: boolean;
  winnerStats: UserStats;
  loserStats: UserStats;
}
