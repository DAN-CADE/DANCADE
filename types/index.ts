/**
 * 타입 모듈 진입점
 * 모든 타입을 여기서 재export합니다.
 */

// Common types
export type {
  ApiResponse,
  PaginatedResponse,
  SortOption,
} from "@/types/common";

// User types
export type {
  User,
  UserProfile,
  ProfileUpdateData,
  UserStats,
  RegisterData,
  LoginData,
  DBUser,
  MemberUser,
  GuestUser,
  LocalUser,
} from "@/types/user";

export { isMemberUser, isGuestUser } from "@/types/user";

// Game types
export type {
  Game,
  GameDetail,
  GameCategory,
  GameDifficulty,
  GameStatus,
  GameControls,
  KeyboardControl,
  MouseControl,
  TouchControl,
  GameFormData,
  GameFilters,
  GameSortField,
  GameSortOption,
} from "@/types/game";

// Ranking types
export type {
  Ranking,
  DifficultyRanking,
  RankingStats,
  RankingFilters,
  RankingPeriod,
  RankingSubmitData,
  UserRankingSummary,
} from "@/types/ranking";

// Review types
export type {
  Review,
  ReviewFormData,
  ReviewStats,
  ReviewFilters,
  ReviewSortField,
  ReviewSortOption,
  ReviewLike,
} from "@/types/review";

// Database types
export type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
} from "@/types/database";

export * from "@/types/onlinePlayer";
export * from "@/types/gameResults";
export * from "@/types/lpc";
export * from "@/types/map";
export * from "@/types/tiled";
