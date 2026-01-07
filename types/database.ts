/**
 * Supabase Database 타입 정의
 * 이 파일은 Supabase CLI로 생성된 타입을 기반으로 합니다.
 */

import type { GameCategory, GameDifficulty, GameStatus } from "@/types/game";

// Database 스키마 타입
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
          total_plays: number;
          total_reviews: number;
          favorite_games: string[];
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
          total_plays?: number;
          total_reviews?: number;
          favorite_games?: string[];
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
          total_plays?: number;
          total_reviews?: number;
          favorite_games?: string[];
        };
      };
      games: {
        Row: {
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
          instructions: string;
          controls: Record<string, unknown>;
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          short_description: string;
          thumbnail_url: string;
          category: GameCategory;
          difficulty: GameDifficulty;
          status?: GameStatus;
          play_count?: number;
          rating_average?: number;
          rating_count?: number;
          instructions: string;
          controls: Record<string, unknown>;
          game_url: string;
          screenshots?: string[];
          tags?: string[];
          min_players?: number;
          max_players?: number;
          estimated_play_time?: number;
          developer?: string | null;
          version?: string;
          is_featured?: boolean;
          is_new?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string;
          short_description?: string;
          thumbnail_url?: string;
          category?: GameCategory;
          difficulty?: GameDifficulty;
          status?: GameStatus;
          play_count?: number;
          rating_average?: number;
          rating_count?: number;
          instructions?: string;
          controls?: Record<string, unknown>;
          game_url?: string;
          screenshots?: string[];
          tags?: string[];
          min_players?: number;
          max_players?: number;
          estimated_play_time?: number;
          developer?: string | null;
          version?: string;
          is_featured?: boolean;
          is_new?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      rankings: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          score: number;
          play_time: number;
          difficulty: GameDifficulty;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          score: number;
          play_time: number;
          difficulty: GameDifficulty;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          score?: number;
          play_time?: number;
          difficulty?: GameDifficulty;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          rating: number;
          content: string;
          created_at: string;
          updated_at: string;
          likes_count: number;
          is_edited: boolean;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          rating: number;
          content: string;
          created_at?: string;
          updated_at?: string;
          likes_count?: number;
          is_edited?: boolean;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          rating?: number;
          content?: string;
          created_at?: string;
          updated_at?: string;
          likes_count?: number;
          is_edited?: boolean;
        };
      };
      review_likes: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
    Enums: {
      game_category: GameCategory;
      game_difficulty: GameDifficulty;
      game_status: GameStatus;
    };
  };
}

// 테이블 Row 타입 헬퍼
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

// Enum 타입 헬퍼
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
