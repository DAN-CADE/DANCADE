import { ServerRoom } from "../../../game/types/multiplayer/room.types";
import { GameIO, ServerPlayer } from "../../../types/server/server.types";

/**
 * 이벤트 발송 관련 유틸리티 함수 모음
 */

/**
 * 방 목록 업데이트 브로드캐스트
 */
export async function broadcastRoomListUpdate(
  io: GameIO,
  rooms: Map<string, ServerRoom>,
  gamePrefix: string
): Promise<void> {
  try {
    const { getRoomList } = await import("./RoomUtils");
    const roomList = await getRoomList(rooms, gamePrefix);

    // 안전장치: 배열이 아니면 빈 배열
    const safeRoomList = Array.isArray(roomList) ? roomList : [];

    console.log(`[broadcastRoomListUpdate] 브로드캐스트:`, {
      gamePrefix,
      type: typeof safeRoomList,
      isArray: Array.isArray(safeRoomList),
      length: safeRoomList.length,
    });

    io.emit(`${gamePrefix}:roomListUpdate`, safeRoomList);
  } catch (error) {
    console.error(`[${gamePrefix}] 방 목록 브로드캐스트 실패:`, error);

    // 에러 시에도 빈 배열 전송 (클라이언트 에러 방지)
    io.emit(`${gamePrefix}:roomListUpdate`, []);
  }
}

/**
 * 플레이어 입장 알림
 */
export function notifyPlayerJoined(
  io: GameIO,
  roomId: string,
  player: ServerPlayer,
  room: ServerRoom,
  gamePrefix: string
): void {
  io.to(roomId).emit(`${gamePrefix}:playerJoined`, {
    player,
    roomData: room,
  });
}

/**
 * 플레이어 퇴장 알림
 */
export function notifyPlayerLeft(
  io: GameIO,
  roomId: string,
  socketId: string,
  username: string,
  room: ServerRoom,
  gamePrefix: string
): void {
  io.to(roomId).emit(`${gamePrefix}:playerLeft`, {
    socketId,
    username,
    roomData: room,
  });
}

/**
 * 방장 변경 알림
 */
export function notifyHostChanged(
  io: GameIO,
  roomId: string,
  newHostSocketId: string,
  room: ServerRoom,
  gamePrefix: string
): void {
  io.to(roomId).emit(`${gamePrefix}:hostChanged`, {
    newHostSocketId,
    roomData: room,
  });
}

/**
 * 게임 중단 알림
 */
export function notifyGameAborted(
  io: GameIO,
  roomId: string,
  reason: string,
  leavingPlayerName: string,
  room: ServerRoom,
  gamePrefix: string
): void {
  io.to(roomId).emit(`${gamePrefix}:gameAborted`, {
    reason,
    leavingPlayer: leavingPlayerName,
    roomData: room,
  });
}

/**
 * 플레이어 준비 상태 알림
 */
export function notifyPlayerReady(
  io: GameIO,
  roomId: string,
  socketId: string,
  isReady: boolean,
  room: ServerRoom,
  gamePrefix: string
): void {
  io.to(roomId).emit(`${gamePrefix}:playerReady`, {
    socketId,
    isReady,
    roomData: room,
  });
}

/**
 * 모든 플레이어 준비 완료 알림
 */
export function notifyAllReady(
  io: GameIO,
  roomId: string,
  gamePrefix: string
): void {
  io.to(roomId).emit(`${gamePrefix}:allReady`, { canStart: true });
}

/**
 * 자동 시작 알림
 */
export function notifyAutoStart(
  io: GameIO,
  room: ServerRoom,
  gamePrefix: string
): void {
  io.to(room.roomId).emit(`${gamePrefix}:autoStart`, { roomData: room });
}
