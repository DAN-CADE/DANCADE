import {
  SaveGameResultRequest,
  SaveGameResultResponse,
} from "@/game/types/gameSessionData";
import { createServerClient } from "@/lib/supabase/client";
import { getUserStats, updateStatsAfterGame } from "@/lib/supabase/userStats";
import {
  insertGameResult,
  insertMultiGameResult,
} from "@/lib/supabase/gameResults";
import { getRankings as getRankingsFromDB } from "@/lib/supabase/ranking";
import { InsertGameResultParams } from "@/types/gameResults";

// =====================================================================
/**
 * GameResultService - 게임 결과 저장 및 통계 업데이트 전용
 */
// =====================================================================
export class GameResultService {
  private supabase = createServerClient();

  // =====================================================================
  /**
   * 랭킹 조회
   */
  // =====================================================================
  async getRankings(gameType: string, limit?: number) {
    const rankings = await getRankingsFromDB(gameType);
    return limit ? rankings.slice(0, limit) : rankings;
  }

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
      await this.processGameResults(data);

      // 유저별 누적 통계 업데이트
      if (loser_user_id) {
        await this.updateUserStats(winner_user_id, loser_user_id, game_type);
      }

      // 최신화된 통계 데이터 가져오기
      const winnerStats = await getUserStats(winner_user_id);
      const loserStats = loser_user_id
        ? await getUserStats(loser_user_id)
        : null;

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
   * game_results, multi_game_results 테이블에 기록 추가
   */
  // =====================================================================

  private async processGameResults(data: SaveGameResultRequest): Promise<void> {
    const playMode = data.play_mode || "multiplayer";

    // UUID 형식 검증 정규식
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 멀티용 테이블 저장 (현재 승자/패자 모두 실제 유저일 때만 저장)
    if (playMode === "multiplayer") {
      await insertMultiGameResult({
        room_id: data.room_id,
        game_type: data.game_type,
        winner_user_id: data.winner_user_id,
        loser_user_id: data.loser_user_id,
        winner_score: data.winner_score,
        loser_score: data.loser_score,
      });
    }

    // 개별 유저 로그 생성
    const participants = this.createParticipants(data);

    // 실제 유저인 경우에만 생성되도록
    const logs: InsertGameResultParams[] = participants
      .filter((p) => uuidRegex.test(p.id)) // 로그의 주인공(user_id)이 UUID인 경우만
      .map((p) => ({
        game_type: data.game_type,
        play_mode: playMode,
        user_id: p.id,
        opponent_id: p.oppId && uuidRegex.test(p.oppId) ? p.oppId : undefined,
        winner_id: uuidRegex.test(data.winner_user_id)
          ? data.winner_user_id
          : undefined,
        is_win: p.win,
        points_awarded: p.score,
        room_id: data.room_id || "ai-battle",
        game_duration: data.game_duration,
      }));

    if (logs.length > 0) {
      await insertGameResult(logs);
    }
  }

  private createParticipants(data: SaveGameResultRequest) {
    // 승자 정보
    const winner = {
      id: data.winner_user_id,
      oppId: data.loser_user_id,
      win: true,
      score: data.winner_score,
    };

    // 패자 정보
    if (!data.loser_user_id) {
      return [winner];
    }

    const loser = {
      id: data.loser_user_id,
      oppId: data.winner_user_id,
      win: false,
      score: data.loser_score,
    };

    return [winner, loser];
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
    try {
      // 병렬로 두 플레이어 통계 업데이트
      await Promise.all([
        updateStatsAfterGame(winnerId, true, gameType),
        updateStatsAfterGame(loserId, false, gameType),
      ]);

      console.log("[GameResultService] 유저 통계 업데이트 완료");
    } catch (error) {
      console.error("[GameResultService] 통계 업데이트 실패:", error);
      throw error;
    }
  }
}
