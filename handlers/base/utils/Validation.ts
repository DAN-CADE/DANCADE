import { ServerRoom } from "@/game/types/multiplayer/room.types";
import { GameSocket } from "@/types/server/server.types";

// =====================================================================
/**
 * 검증 관련 유틸리티 함수 모음
 */
// =====================================================================

// =====================================================================
/**
 * 방 존재 여부 검증
 */
// =====================================================================
export function validateRoomExists(
  room: ServerRoom | null | undefined,
  socket: GameSocket,
  gamePrefix: string
): room is ServerRoom {
  if (!room) {
    socket.emit(`${gamePrefix}:joinError`, {
      message: "존재하지 않는 방입니다.",
    });
    return false;
  }
  return true;
}

// =====================================================================
/**
 * 방 인원 체크
 */
// =====================================================================
export function validateRoomNotFull(
  room: ServerRoom,
  socket: GameSocket,
  gamePrefix: string
): boolean {
  if (room.players.length >= room.maxPlayers) {
    socket.emit(`${gamePrefix}:joinError`, {
      message: "방이 가득 찼습니다.",
    });
    return false;
  }
  return true;
}

// =====================================================================
/**
 * 방 비밀번호 체크
 */
// =====================================================================
export function validateRoomPassword(
  room: ServerRoom,
  password: string | undefined,
  socket: GameSocket,
  gamePrefix: string
): boolean {
  if (room.isPrivate && room.password !== password) {
    socket.emit(`${gamePrefix}:joinError`, {
      message: "비밀번호가 틀렸습니다.",
    });
    return false;
  }
  return true;
}

// =====================================================================
/**
 * 중복 입장 체크
 */
// =====================================================================
export function validateNotAlreadyInRoom(
  room: ServerRoom,
  socketId: string,
  socket: GameSocket,
  gamePrefix: string
): boolean {
  const alreadyInRoom = room.players.some((p) => p.socketId === socketId);
  if (alreadyInRoom) {
    socket.emit(`${gamePrefix}:joinError`, {
      message: "이미 방에 입장했습니다.",
    });
    return false;
  }
  return true;
}

// =====================================================================
/**
 * 방장 권한 체크
 */
// =====================================================================
export function validateIsHost(
  room: ServerRoom,
  socketId: string,
  socket: GameSocket,
  gamePrefix: string
): boolean {
  if (socketId !== room.hostSocketId) {
    socket.emit(`${gamePrefix}:error`, {
      message: "방장만 실행할 수 있습니다.",
    });
    return false;
  }
  return true;
}

// =====================================================================
/**
 * 플레이어가 방에 있는지 체크
 */
// =====================================================================
export function validatePlayerInRoom(
  room: ServerRoom,
  socketId: string,
  socket: GameSocket,
  gamePrefix: string
) {
  const player = room.players.find((p) => p.socketId === socketId);
  if (!player) {
    socket.emit(`${gamePrefix}:error`, {
      message: "방에 입장하지 않았습니다.",
    });
    return null;
  }
  return player;
}

// =====================================================================
/**
 * 사용자 이름 체크
 */
// =====================================================================
export function validateUsername(
  username: string | undefined,
  socket: GameSocket,
  gamePrefix: string
): boolean {
  if (!username) {
    socket.emit(`${gamePrefix}:joinError`, {
      message: "사용자 이름이 필요합니다.",
    });
    return false;
  }
  return true;
}

// =====================================================================
/**
 * 필수 데이터 체크
 */
// =====================================================================
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[],
  socket: GameSocket,
  gamePrefix: string
): boolean {
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      socket.emit(`${gamePrefix}:error`, {
        message: `필수 데이터가 누락되었습니다: ${field}`,
      });
      return false;
    }
  }
  return true;
}
