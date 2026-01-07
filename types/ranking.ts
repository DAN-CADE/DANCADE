/**
 * 랭킹 관련 타입 정의
 */

import type { GameDifficulty } from "@/types/game";

// 랭킹 항목
export interface Ranking {
  id: string;
  game_id: string;
  user_id: string;
  score: number;
  play_time: number;
  difficulty: GameDifficulty;
  created_at: string;
  rank?: number;
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  game?: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string;
  };
}

// 난이도별 랭킹
export interface DifficultyRanking {
  difficulty: GameDifficulty;
  rankings: Ranking[];
  total: number;
}

// 랭킹 통계
export interface RankingStats {
  totalPlayers: number;
  highestScore: number;
  averageScore: number;
  totalPlays: number;
  recentPlays: number;
}

// 랭킹 필터 옵션
export interface RankingFilters {
  gameId?: string;
  userId?: string;
  difficulty?: GameDifficulty;
  period?: RankingPeriod;
  limit?: number;
}

// 랭킹 기간
export type RankingPeriod = "all" | "daily" | "weekly" | "monthly" | "yearly";

// 랭킹 제출 데이터
export interface RankingSubmitData {
  game_id: string;
  score: number;
  play_time: number;
  difficulty: GameDifficulty;
  metadata?: Record<string, unknown>;
}

// 사용자 랭킹 요약
export interface UserRankingSummary {
  userId: string;
  totalGamesPlayed: number;
  totalScore: number;
  bestRank: number;
  averageRank: number;
  topGames: {
    gameId: string;
    gameTitle: string;
    score: number;
    rank: number;
  }[];
}
