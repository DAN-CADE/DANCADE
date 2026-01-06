// handlers/base/utils/GameOverHandler.js

const axios = require("axios");

// 환경변수로 Next.js API URL 설정
const NEXT_API_URL = process.env.NEXT_API_URL || "http://localhost:3000";

// =====================================================================
/**
 * GameOverHandler
 * - 모든 게임의 종료 처리 공통화
 * - DB 저장, 통계 조회, 방 정리
 */
// =====================================================================
class GameOverHandler {
  // =====================================================================
  /**
   * @param {Object} io - Socket.IO 서버 인스턴스
   * @param {Map} rooms - 방 목록
   * @param {string} gamePrefix - 게임 타입 (예: "omok", "pingpong")
   */
  // =====================================================================

  constructor(io, rooms, gamePrefix) {
    this.io = io;
    this.rooms = rooms;
    this.gamePrefix = gamePrefix;
  }

  // =====================================================================
  /**
   * 게임 종료 처리 (공통)
   * @param {string} roomId - 방 ID
   * @param {number} winner - 승자 역할 (1, 2 등)
   * @param {Object} options - 추가 옵션
   * @param {number} [options.winnerScore] - 승자 점수
   * @param {number} [options.loserScore] - 패자 점수
   * @returns {Promise<void>}
   */
  // =====================================================================

  async handleGameOver(roomId, winner, options = {}) {
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
      // 방 정보를 확인해서 빠른 매칭인지 판단
      // const isQuickMatch = room.isQuickMatch || false;

      const { winnerStats, loserStats } = await this.saveGameResult(
        roomId,
        winnerPlayer,
        loserPlayer,
        { ...options, gameDuration }
      );

      // 모든 클라이언트에 알림 (클라이언트는 이 정보를 받아서 UI만 그림)
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
   * @param {Object} room - 방 객체
   * @param {number} winner - 승자 역할
   * @returns {{winnerPlayer: Object, loserPlayer: Object}}
   */
  // =====================================================================

  findWinnerAndLoser(room, winner) {
    // 승자 찾기 (입력받은 winner 값과 일치하는 플레이어)
    const winnerPlayer = room.players.find(
      (p) => p.side === winner || p.role === winner
    );

    // 승자를 제외한 다른 플레이어가 있는 경우에만 loserPlayer 할당
    const loserPlayer = room.players.find((p) =>
      winnerPlayer ? p.userUUID !== winnerPlayer.userUUID : false
    );

    return { winnerPlayer, loserPlayer };
  }

  // =====================================================================
  /**
   * 게임 결과 DB 저장
   * @param {string} roomId - 방 ID
   * @param {Object} winnerPlayer - 승자 정보
   * @param {Object} loserPlayer - 패자 정보
   * @param {Object} options - 추가 옵션
   * @returns {Promise<{winnerStats: Object|null, loserStats: Object|null}>}
   */
  // =====================================================================

  async saveGameResult(roomId, winnerPlayer, loserPlayer, options = {}) {
    const winnerId = winnerPlayer.userUUID || winnerPlayer.userId;
    const loserId = loserPlayer.userUUID || loserPlayer.userId;

    // if (!winnerPlayer.userId || !loserPlayer.userId) {
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
      const response = await axios.post(
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
          timeout: 5000, // 5초 타임아웃
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

      // API 실패해도 게임은 종료 (통계만 없음)
      return { winnerStats: null, loserStats: null };
    }
  }
}

module.exports = GameOverHandler;
