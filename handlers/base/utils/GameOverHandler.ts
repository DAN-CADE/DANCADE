import axios from "axios";

import type { UserStats } from "../../../types/user";
import {
  GameIO,
  GameOverOptions,
  GameResultResponse,
  ServerPlayer,
} from "../../../types/server/server.types";
import { ServerRoom } from "../../../game/types/multiplayer/room.types";

// 환경변수로 Next.js API URL 설정
const NEXT_API_URL = process.env.NEXT_API_URL || "http://localhost:3000";

// =====================================================================
/**
 * GameOverHandler
 * - 모든 게임의 종료 처리 공통화
 * - DB 저장, 통계 조회, 방 정리
 */
// =====================================================================
export class GameOverHandler {
  private io: GameIO;
  private rooms: Map<string, ServerRoom>;
  private gamePrefix: string;

  // =====================================================================
  /**
   * @param io - Socket.IO 서버 인스턴스
   * @param rooms - 방 목록
   * @param gamePrefix - 게임 타입 (예: "omok", "pingpong")
   */
  // =====================================================================
  constructor(io: GameIO, rooms: Map<string, ServerRoom>, gamePrefix: string) {
    this.io = io;
    this.rooms = rooms;
    this.gamePrefix = gamePrefix;
  }

  // =====================================================================
  /**
   * 게임 종료 처리 (공통)
   */
  // =====================================================================
  async handleGameOver(
    roomId: string,
    winner: number | string,
    options: GameOverOptions = {}
  ): Promise<void> {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.isProcessingEnd || room.status === "finished") {
      return;
    }

    // 시간 계산
    const gameDuration = room.startTime
      ? Math.floor((Date.now() - room.startTime) / 1000)
      : 0;

    // 상태 잠금
    room.isProcessingEnd = true;
    room.status = "finished";

    // 승자/패자 식별
    const { winnerPlayer, loserPlayer } = this.findWinnerAndLoser(room, winner);

    if (!winnerPlayer || !loserPlayer) {
      console.error(`[${this.gamePrefix}] 플레이어를 찾을 수 없음`);
      this.io.to(roomId).emit(`${this.gamePrefix}:gameOver`, {
        winner,
        roomData: room,
        winnerStats: null,
        loserStats: null,
      });
      return;
    }

    try {
      const { winnerStats, loserStats } = await this.saveGameResult(
        roomId,
        winnerPlayer,
        loserPlayer,
        { ...options, gameDuration }
      );

      // 모든 클라이언트에 알림
      this.io.to(roomId).emit(`${this.gamePrefix}:gameOver`, {
        winner,
        roomData: room,
        winnerStats,
        loserStats,
        gameDuration,
      });

      console.log(`[${this.gamePrefix}] 결과 저장 및 브로드캐스트 완료`);
    } catch (error) {
      console.error(`[${this.gamePrefix}] 결과 저장 에러:`, error);
    }
  }

  // =====================================================================
  /**
   * 승자/패자 찾기
   */
  // =====================================================================
  private findWinnerAndLoser(
    room: ServerRoom,
    winner: number | string
  ): {
    winnerPlayer: ServerPlayer | undefined;
    loserPlayer: ServerPlayer | undefined;
  } {
    // 승자 찾기
    const winnerPlayer = room.players.find(
      (p) => p.side === winner || p.role === winner
    );

    // 패자 찾기
    const loserPlayer = room.players.find((p) =>
      winnerPlayer ? p.userUUID !== winnerPlayer.userUUID : false
    );

    return { winnerPlayer, loserPlayer };
  }

  // =====================================================================
  /**
   * 게임 결과 DB 저장
   */
  // =====================================================================
  private async saveGameResult(
    roomId: string,
    winnerPlayer: ServerPlayer,
    loserPlayer: ServerPlayer,
    options: GameOverOptions = {}
  ): Promise<{ winnerStats: UserStats | null; loserStats: UserStats | null }> {
    const winnerId = winnerPlayer.userUUID || winnerPlayer.userId;
    const loserId = loserPlayer.userUUID || loserPlayer.userId;

    if (!winnerId || !loserId) {
      console.warn(`[${this.gamePrefix}][게임종료] userId 없음, DB 저장 생략`);
      console.warn(`[${this.gamePrefix}][디버그] winnerPlayer:`, winnerPlayer);
      console.warn(`[${this.gamePrefix}][디버그] loserPlayer:`, loserPlayer);
      return { winnerStats: null, loserStats: null };
    }

    console.log(`[${this.gamePrefix}][게임종료] DB 저장 시작:`, {
      roomId,
      winner_user_id: winnerPlayer.userUUID,
      loser_user_id: loserPlayer.userUUID,
    });

    try {
      const response = await axios.post<GameResultResponse>(
        `${NEXT_API_URL}/api/game-result`,
        {
          room_id: roomId,
          game_type: this.gamePrefix,
          play_mode: loserId ? "multiplayer" : "single",
          winner_user_id: winnerId,
          loser_user_id: loserId,
          winner_score: options.winnerScore,
          loser_score: options.loserScore,
          game_duration: options.gameDuration,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      console.log(
        `[${this.gamePrefix}][API성공] 게임 결과 저장 완료:`,
        response.data
      );

      return {
        winnerStats: response.data.winnerStats,
        loserStats: response.data.loserStats,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(
          `[${this.gamePrefix}][API실패] 게임 결과 저장 실패:`,
          error.message
        );

        if (error.response) {
          console.error(
            `[${this.gamePrefix}][API실패] 응답:`,
            error.response.data
          );
        }
      } else {
        console.error(`[${this.gamePrefix}][API실패] 알 수 없는 에러:`, error);
      }

      return { winnerStats: null, loserStats: null };
    }
  }
}
