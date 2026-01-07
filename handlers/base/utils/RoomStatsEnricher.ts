import {
  ApiUserStats,
  RoomListItem,
  RoomListItemWithStats,
  StatsApiResponse,
} from "../../../types/server/server.types";
import axios from "axios";

// 환경변수로 Next.js API URL 설정
const NEXT_API_URL = process.env.NEXT_API_URL || "http://localhost:3000";

/**
 * RoomStatsEnricher
 * - 방 목록에 유저 통계 정보 추가
 * - API 호출 실패 시 기본값 반환
 */
export class RoomStatsEnricher {
  /**
   * 방 목록에 호스트 통계 추가
   */
  static async enrichRoomsWithStats(
    rooms: RoomListItem[],
    gameType: string
  ): Promise<RoomListItemWithStats[]> {
    console.log(`[RoomStatsEnricher] 시작:`, {
      roomsType: typeof rooms,
      isArray: Array.isArray(rooms),
      length: rooms?.length,
    });

    if (!rooms || rooms.length === 0) {
      console.log(`[RoomStatsEnricher] 방 목록 비어있음, 그대로 반환`);
      return rooms || [];
    }

    try {
      // 모든 호스트의 uuid 추출
      const hostUUIDs = rooms
        .map((room) => {
          // players 배열에서 호스트 찾기
          const host = room.players?.find(
            (p: any) => p.socketId === room.hostSocketId
          );
          return host?.userUUID || host?.uuid;
        })
        .filter(Boolean) as string[];

      if (hostUUIDs.length === 0) {
        console.warn("[RoomStatsEnricher] 호스트 uuid 없음");
        return rooms;
      }

      // 통계 일괄 조회
      const statsMap = await this.fetchStats(hostUUIDs, gameType);

      // 방 목록에 통계 추가
      return rooms.map((room) => {
        const host = room.players?.find(
          (p: any) => p.socketId === room.hostSocketId
        );
        const hostUUID = host?.userUUID || host?.uuid;

        if (hostUUID && statsMap.has(hostUUID)) {
          const stats = statsMap.get(hostUUID)!;
          return {
            ...room,
            hostStats: {
              wins: stats.total_wins,
              losses: stats.total_losses,
              winRate: stats.win_rate,
              totalGames: stats.total_games_played,
            },
          };
        }

        // 통계 없으면 기본값
        return {
          ...room,
          hostStats: {
            wins: 0,
            losses: 0,
            winRate: 0,
            totalGames: 0,
          },
        };
      });
    } catch (error) {
      console.error("[RoomStatsEnricher] 통계 조회 실패:", error);
      console.error("[RoomStatsEnricher] 원본 rooms:", rooms);

      // 에러 시 기본값 반환
      const result = rooms.map((room) => ({
        ...room,
        hostStats: {
          wins: 0,
          losses: 0,
          winRate: 0,
          totalGames: 0,
        },
      }));

      console.log(`[RoomStatsEnricher] 에러 후 반환:`, {
        type: typeof result,
        isArray: Array.isArray(result),
        length: result.length,
        firstRoom: result[0],
      });

      return result;
    }
  }

  /**
   * 유저 통계 일괄 조회
   */
  private static async fetchStats(
    userUUIDs: string[],
    gameType: string
  ): Promise<Map<string, ApiUserStats>> {
    const statsMap = new Map<string, ApiUserStats>();

    try {
      // 병렬로 모든 유저 통계 조회
      const promises = userUUIDs.map(async (userUUID) => {
        try {
          const response = await axios.get<StatsApiResponse>(
            `${NEXT_API_URL}/api/game-result`,
            {
              params: { userId: userUUID, gameType },
              timeout: 3000,
            }
          );

          if (response.data.success && response.data.stats) {
            statsMap.set(userUUID, response.data.stats);
          }
        } catch (error) {
          // 개별 조회 실패는 무시 (기본값 사용)
          if (axios.isAxiosError(error)) {
            console.warn(
              `[RoomStatsEnricher] ${userUUID} 통계 조회 실패:`,
              error.message
            );
          }
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error("[RoomStatsEnricher] 일괄 조회 실패:", error);
    }

    return statsMap;
  }
}
