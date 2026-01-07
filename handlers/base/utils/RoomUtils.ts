import { v4 as uuidv4 } from "uuid";

import { RoomStatsEnricher } from "../../base/utils/RoomStatsEnricher";
import {
  RoomListItem,
  RoomListItemWithStats,
  ServerRoom,
} from "../../../game/types/multiplayer/room.types";
import { ServerPlayer } from "../../../types/server/server.types";

// =====================================================================
/**
 * 랜덤 방 ID 생성
 */
// =====================================================================
export function generateRoomId(): string {
  return uuidv4();
}

// =====================================================================
/**
 * 특정 게임 타입의 방 목록 반환 (통계 포함)
 */
// =====================================================================
export async function getRoomList(
  rooms: Map<string, ServerRoom>,
  gamePrefix: string
): Promise<RoomListItemWithStats[]> {
  console.log(
    `[getRoomList] 시작 - gamePrefix: ${gamePrefix}, 전체 방: ${rooms.size}개`
  );

  const roomList: RoomListItem[] = [];

  rooms.forEach((room) => {
    console.log(`[getRoomList] 방 체크:`, {
      roomId: room.roomId,
      gameType: room.gameType,
      status: room.status,
      gamePrefix,
      match: room.gameType === gamePrefix && room.status === "waiting",
    });

    if (room.gameType === gamePrefix && room.status === "waiting") {
      roomList.push({
        roomId: room.roomId,
        roomName: room.roomName,
        hostUsername: room.players[0]?.username || "Unknown",
        hostSocketId: room.hostSocketId,
        hostUserId: room.players[0]?.userId,
        hostUserUUID: room.players[0]?.userUUID,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        isPrivate: room.isPrivate,
        status: room.status,
        players: room.players,
        gameType: room.gameType,
      });
    }
  });

  console.log(`[getRoomList] 필터링 완료 - ${roomList.length}개 방`);

  // 통계 정보 추가
  const enrichedRooms = await RoomStatsEnricher.enrichRoomsWithStats(
    roomList,
    gamePrefix
  );

  console.log(`[getRoomList] enrichment 완료:`, {
    type: typeof enrichedRooms,
    isArray: Array.isArray(enrichedRooms),
    length: enrichedRooms?.length,
  });

  return enrichedRooms;
}

// =====================================================================
/**
 * 방 데이터 객체 생성
 */
// =====================================================================
export function createRoomData(params: {
  roomId: string;
  roomName: string;
  gamePrefix: string;
  hostSocketId: string;
  userId?: string | null;
  userUUID?: string | null;
  username: string;
  isPrivate: boolean;
  password?: string;
  maxPlayers: number;
}): ServerRoom {
  return {
    roomId: params.roomId,
    roomName: params.roomName || `${params.username}의 방`,
    gameType: params.gamePrefix,
    hostSocketId: params.hostSocketId,
    players: [
      {
        socketId: params.hostSocketId,
        userId: params.userId,
        username: params.username,
        userUUID: params.userUUID,
        isReady: false,
        joinedAt: Date.now(),
      },
    ],
    isPrivate: params.isPrivate || false,
    password: params.password || "",
    maxPlayers: params.maxPlayers,
    playerCount: 1,
    status: "waiting",
    createdAt: Date.now(),
  };
}

// =====================================================================
/**
 * 새 플레이어 데이터 생성
 */
// =====================================================================
export function createPlayerData(
  socketId: string,
  username: string,
  userId: string | null = null,
  userUUID: string | null = null
): ServerPlayer {
  return {
    socketId,
    userId,
    username,
    userUUID,
    isReady: false,
    joinedAt: Date.now(),
  };
}
