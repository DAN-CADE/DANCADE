import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 게임 관련 타입 정의
 */

// 게임 난이도
export type GameDifficulty = "easy" | "medium" | "hard" | "expert";

// 게임 카테고리
export type GameCategory =
  | "action"
  | "puzzle"
  | "arcade"
  | "strategy"
  | "sports"
  | "racing"
  | "adventure"
  | "casual";

// 게임 상태
export type GameStatus = "active" | "inactive" | "maintenance" | "coming_soon";

// 게임 기본 정보
export interface Game {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  category: GameCategory;
  difficulty: GameDifficulty;
  status: GameStatus;
  play_count: number;
  rating_average: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

// 게임 상세 정보
export interface GameDetail extends Game {
  instructions: string;
  controls: GameControls;
  game_url: string;
  screenshots: string[];
  tags: string[];
  min_players: number;
  max_players: number;
  estimated_play_time: number;
  developer: string | null;
  version: string;
  is_featured: boolean;
  is_new: boolean;
}

// 게임 컨트롤 정보
export interface GameControls {
  keyboard?: KeyboardControl[];
  mouse?: MouseControl[];
  touch?: TouchControl[];
}

export interface KeyboardControl {
  key: string;
  action: string;
}

export interface MouseControl {
  button: "left" | "right" | "middle";
  action: string;
}

export interface TouchControl {
  gesture: "tap" | "swipe" | "drag" | "pinch";
  action: string;
}

// 게임 생성/수정 데이터
export interface GameFormData {
  title: string;
  slug: string;
  description: string;
  short_description: string;
  thumbnail_url: string;
  category: GameCategory;
  difficulty: GameDifficulty;
  instructions: string;
  controls: GameControls;
  game_url: string;
  tags: string[];
}

// 게임 필터 옵션
export interface GameFilters {
  category?: GameCategory;
  difficulty?: GameDifficulty;
  status?: GameStatus;
  search?: string;
  tags?: string[];
  minRating?: number;
  isFeatured?: boolean;
  isNew?: boolean;
}

// 게임 목록 정렬 옵션
export type GameSortField =
  | "created_at"
  | "play_count"
  | "rating_average"
  | "title";

export interface GameSortOption {
  field: GameSortField;
  direction: "asc" | "desc";
}

// AI전 지원하는 게임 scene 공통 인터페이스
export interface GameSceneWithState<TSide = never> {
  gameState: {
    userSide: TSide;
  };
  startTime?: number;
  currentUser?: {
    uuid: string;
  };
}

// 게임 config
export interface GameConfig {
  maxPlayers: number;
  minPlayers: number;
  autoStart: boolean;
}

export interface MatchmakingConfig {
  maxPlayers: number;
  quickMatchRoomId?: string;
  supabase?: SupabaseClient;
}
