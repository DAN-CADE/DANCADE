// lib/services/gameResultService.ts

import { createServerClient } from "@/lib/supabase/client";

/**
 * 게임 결과 저장 요청 데이터
 */
export interface SaveGameResultRequest {
  room_id: string;
  game_type: string;
  winner_user_id: string;
  loser_user_id: string;
  winner_score?: number;
  loser_score?: number;
}

/**
 * 유저 통계 데이터
 */
export interface UserStats {
  user_id: string;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  total_games_played: number;
}

/**
 * 게임 결과 저장 응답
 */
export interface SaveGameResultResponse {
  success: boolean;
  winnerStats: UserStats;
  loserStats: UserStats;
}

/**
 * GameResultService
 * - 게임 결과 저장 및 통계 업데이트
 * - 모든 멀티플레이 게임에서 재사용 가능
 */
export class GameResultService {
  private supabase = createServerClient();

  /**
   * userid를 users 테이블의 id (UUID)로 변환
   * ⭐ 게스트 유저는 없으면 자동 생성
   * @param userid - userid (예: "test1", "guest_xxx")
   * @returns UUID 또는 null
   */
  private async getUserUUID(userid: string): Promise<string | null> {
    // 이미 UUID 형식이면 그대로 반환
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(userid)) {
      return userid;
    }

    // ⭐ 게스트 유저 처리
    if (userid.startsWith("guest_")) {
      console.log(`[GameResultService] 게스트 유저 처리: ${userid}`);

      // 1. 먼저 조회
      const { data: existing } = await this.supabase
        .from("users")
        .select("id")
        .eq("userid", userid)
        .maybeSingle();

      if (existing) {
        console.log(`[GameResultService] 게스트 유저 존재: ${existing.id}`);
        return existing.id;
      }

      // 2. 없으면 생성
      console.log(`[GameResultService] 게스트 유저 생성: ${userid}`);
      const { data: newUser, error } = await this.supabase
        .from("users")
        .insert({
          userid: userid,
          nickname: `게스트_${userid.slice(-4)}`,
          total_points: 0,
        })
        .select("id")
        .single();

      if (error) {
        console.error(`[GameResultService] 게스트 생성 실패:`, error);
        return null;
      }

      console.log(`[GameResultService] 게스트 생성 완료: ${newUser.id}`);
      return newUser.id;
    }

    // 일반 유저 조회
    const { data, error } = await this.supabase
      .from("users")
      .select("id")
      .eq("userid", userid)
      .maybeSingle();

    if (error || !data) {
      console.error(
        `[GameResultService] UUID 조회 실패 (userid: ${userid}):`,
        error
      );
      return null;
    }

    return data.id;
  }

  /**
   * 게임 결과 저장 (트랜잭션)
   * 1. userid → UUID 변환 (게스트는 자동 생성)
   * 2. multi_game_results에 결과 저장
   * 3. user_stats 업데이트 (승자/패자)
   * 4. 업데이트된 통계 반환
   */
  async saveGameResult(
    data: SaveGameResultRequest
  ): Promise<SaveGameResultResponse> {
    const { room_id, game_type, winner_user_id, loser_user_id } = data;

    console.log("[GameResultService] 저장 시작:", data);

    try {
      // ⭐ 1. userid → UUID 변환 (게스트 자동 생성)
      const winnerUUID = await this.getUserUUID(winner_user_id);
      const loserUUID = await this.getUserUUID(loser_user_id);

      if (!winnerUUID || !loserUUID) {
        throw new Error(
          `UUID 변환 실패: winner=${winner_user_id}, loser=${loser_user_id}`
        );
      }

      console.log("[GameResultService] UUID 변환 완료:", {
        winner_user_id,
        winnerUUID,
        loser_user_id,
        loserUUID,
      });

      // 2. 게임 결과 저장 (UUID 사용)
      await this.insertGameResult({
        ...data,
        winner_user_id: winnerUUID,
        loser_user_id: loserUUID,
      });

      // 3. 통계 업데이트
      await this.updateUserStats(winnerUUID, loserUUID);

      // 4. 업데이트된 통계 조회
      const winnerStats = await this.getUserStats(winnerUUID);
      const loserStats = await this.getUserStats(loserUUID);

      if (!winnerStats || !loserStats) {
        throw new Error("통계 조회 실패");
      }

      return {
        success: true,
        winnerStats,
        loserStats,
      };
    } catch (error) {
      console.error("[GameResultService] 저장 실패:", error);
      throw error;
    }
  }

  /**
   * multi_game_results 테이블에 결과 저장
   */
  private async insertGameResult(data: SaveGameResultRequest): Promise<void> {
    const { error } = await this.supabase.from("multi_game_results").insert({
      room_id: data.room_id,
      game_type: data.game_type,
      winner_user_id: data.winner_user_id,
      loser_user_id: data.loser_user_id,
      winner_score: data.winner_score || null,
      loser_score: data.loser_score || null,
      played_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[GameResultService] 결과 저장 실패:", error);
      throw new Error(`게임 결과 저장 실패: ${error.message}`);
    }

    console.log("[GameResultService] 결과 저장 완료");
  }

  /**
   * user_stats 테이블 업데이트 (승자/패자)
   */
  private async updateUserStats(
    winnerUserId: string,
    loserUserId: string
  ): Promise<void> {
    // 승자 통계 업데이트
    const { error: winnerError } = await this.supabase.rpc(
      "update_user_stats",
      {
        p_user_id: winnerUserId,
        p_is_winner: true,
      }
    );

    if (winnerError) {
      console.error(
        "[GameResultService] 승자 통계 업데이트 실패:",
        winnerError
      );
      throw new Error(`승자 통계 업데이트 실패: ${winnerError.message}`);
    }

    // 패자 통계 업데이트
    const { error: loserError } = await this.supabase.rpc("update_user_stats", {
      p_user_id: loserUserId,
      p_is_winner: false,
    });

    if (loserError) {
      console.error("[GameResultService] 패자 통계 업데이트 실패:", loserError);
      throw new Error(`패자 통계 업데이트 실패: ${loserError.message}`);
    }

    console.log("[GameResultService] 통계 업데이트 완료");
  }

  /**
   * 유저 통계 조회
   */
  async getUserStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await this.supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("[GameResultService] 통계 조회 실패:", error);
      return null;
    }

    return data;
  }

  /**
   * 게임 이력 조회
   */
  async getGameHistory(
    userId: string,
    gameType?: string,
    limit: number = 10
  ): Promise<any[]> {
    let query = this.supabase
      .from("multi_game_results")
      .select("*")
      .or(`winner_user_id.eq.${userId},loser_user_id.eq.${userId}`)
      .order("played_at", { ascending: false })
      .limit(limit);

    if (gameType) {
      query = query.eq("game_type", gameType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[GameResultService] 이력 조회 실패:", error);
      return [];
    }

    return data || [];
  }
}
