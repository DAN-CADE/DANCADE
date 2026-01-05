import {
  SaveGameResultRequest,
  SaveGameResultResponse,
} from "@/game/types/gameSessionData";
import { createServerClient } from "@/lib/supabase/client";
import { DB_TABLES } from "@/lib/constants/tables";
import { getUserStats, upsertUserStats } from "@/lib/supabase/userStats";

// =====================================================================
/**
 * GameResultService - 게임 결과 저장 및 통계 업데이트 전용
 */
// =====================================================================
export class GameResultService {
  private supabase = createServerClient();

  // =====================================================================
  /**
   * 게임 결과 저장
   * 전달받는 ID는 이미 DB에 존재하는 유저의 UUID여야 합니다.
   */
  // =====================================================================

  async saveGameResult(
    data: SaveGameResultRequest
  ): Promise<SaveGameResultResponse> {
    const { room_id, game_type, winner_user_id, loser_user_id } = data;

    console.log(`[GameResultService] ${game_type} 저장 프로세스 시작:`, {
      room_id,
      winner_user_id,
      loser_user_id,
    });

    try {
      // 결정된 테이블과 함께 데이터 저장
      await this.insertGameResult(data);

      // 유저별 누적 통계 업데이트
      await this.updateUserStats(winner_user_id, loser_user_id, game_type);

      // 최신화된 통계 데이터 가져오기
      const winnerStats = await getUserStats(winner_user_id);
      const loserStats = await getUserStats(loser_user_id);

      if (!winnerStats || !loserStats) {
        throw new Error("결과 저장 후 통계 데이터를 불러오는 데 실패했습니다.");
      }

      return { success: true, winnerStats, loserStats };
    } catch (error) {
      console.error("[GameResultService] 데이터 저장 실패:", error);
      throw error;
    }
  }

  // =====================================================================
  /**
   * multi_game_results 테이블에 기록 추가
   */
  // =====================================================================

  private async insertGameResult(
    data: SaveGameResultRequest
    // targetTable: string
  ): Promise<void> {
    const { error } = await this.supabase
      .from(DB_TABLES.MULTI_GAME_RESULTS)
      .insert({
        room_id: data.room_id,
        game_type: data.game_type,
        winner_user_id: data.winner_user_id,
        loser_user_id: data.loser_user_id,
        winner_score: data.winner_score || null,
        loser_score: data.loser_score || null,
        played_at: new Date().toISOString(),
      });

    if (error) throw new Error(`게임 기록 삽입 실패: ${error.message}`);
  }

  // =====================================================================
  /**
   * user_stats 테이블 업데이트
   */
  // =====================================================================

  private async updateUserStats(
    winnerId: string,
    loserId: string,
    gameType: string
  ): Promise<void> {
    const players = [
      { id: winnerId, isWinner: true },
      { id: loserId, isWinner: false },
    ];

    for (const player of players) {
      const currentStats = await getUserStats(player.id);

      if (currentStats) {
        const wins = currentStats.total_wins + (player.isWinner ? 1 : 0);
        const games = currentStats.total_games_played + 1;

        await upsertUserStats({
          user_id: player.id,
          total_wins: wins,
          total_losses: currentStats.total_losses + (player.isWinner ? 0 : 1),
          total_games_played: games,
          win_rate: Math.round((wins / games) * 100),
          favorite_game: gameType,
        });
      } else {
        await upsertUserStats({
          user_id: player.id,
          total_wins: player.isWinner ? 1 : 0,
          total_losses: player.isWinner ? 0 : 1,
          total_games_played: 1,
          win_rate: player.isWinner ? 100 : 0,
          favorite_game: gameType,
        });
      }
    }
    console.log("[GameResultService] 통계 업데이트 완료");
  }

  // =====================================================================
  /**
   * 게임 랭킹 조회
   */
  // =====================================================================

  async getRankings(gameType?: string, limit: number = 100) {
    let query = this.supabase
      .from(DB_TABLES.USER_STATS) // 미리 계산된 통계 테이블 사용
      .select(
        `
      user_id,
      total_wins,
      total_games_played,
      win_rate,
      favorite_game,
      users ( username ) 
    `
      )
      .order("total_wins", { ascending: false }) // 승수 높은 순
      .limit(limit);

    if (gameType) {
      query = query.eq("favorite_game", gameType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}
