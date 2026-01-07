// handlers/base/utils/eventEmitters.js

/**
 * 이벤트 발송 관련 유틸리티 함수 모음
 */

/**
 * 방 목록 업데이트 브로드캐스트 (⭐ async로 수정)
 * @param {Object} io - Socket.IO 서버 인스턴스
 * @param {Map} rooms - 방 목록
 * @param {string} gamePrefix - 게임 타입
 */
async function broadcastRoomListUpdate(io, rooms, gamePrefix) {
  try {
    const { getRoomList } = require("./RoomUtils");
    const roomList = await getRoomList(rooms, gamePrefix);

    // ⭐ 안전장치: 배열이 아니면 빈 배열
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

    // ⭐ 에러 시에도 빈 배열 전송 (클라이언트 에러 방지)
    io.emit(`${gamePrefix}:roomListUpdate`, []);
  }
}

/**
 * 플레이어 입장 알림
 * @param {Object} io - Socket.IO 서버 인스턴스
 * @param {string} roomId - 방 ID
 * @param {Object} player - 플레이어 객체
 * @param {Object} room - 방 객체
 * @param {string} gamePrefix - 게임 타입
 */
function notifyPlayerJoined(io, roomId, player, room, gamePrefix) {
  io.to(roomId).emit(`${gamePrefix}:playerJoined`, {
    player,
    roomData: room,
  });
}

/**
 * 플레이어 퇴장 알림
 * @param {Object} io - Socket.IO 서버 인스턴스
 * @param {string} roomId - 방 ID
 * @param {string} socketId - 소켓 ID
 * @param {string} username - 사용자 이름
 * @param {Object} room - 방 객체
 * @param {string} gamePrefix - 게임 타입
 */
function notifyPlayerLeft(io, roomId, socketId, username, room, gamePrefix) {
  io.to(roomId).emit(`${gamePrefix}:playerLeft`, {
    socketId,
    username,
    roomData: room,
  });
}

/**
 * 방장 변경 알림
 * @param {Object} io - Socket.IO 서버 인스턴스
 * @param {string} roomId - 방 ID
 * @param {string} newHostSocketId - 새 방장 소켓 ID
 * @param {Object} room - 방 객체
 * @param {string} gamePrefix - 게임 타입
 */
function notifyHostChanged(io, roomId, newHostSocketId, room, gamePrefix) {
  io.to(roomId).emit(`${gamePrefix}:hostChanged`, {
    newHostSocketId,
    roomData: room,
  });
}

/**
 * 게임 중단 알림
 * @param {Object} io - Socket.IO 서버 인스턴스
 * @param {string} roomId - 방 ID
 * @param {string} reason - 중단 이유
 * @param {string} leavingPlayerName - 나간 플레이어 이름
 * @param {Object} room - 방 객체
 * @param {string} gamePrefix - 게임 타입
 */
function notifyGameAborted(
  io,
  roomId,
  reason,
  leavingPlayerName,
  room,
  gamePrefix
) {
  io.to(roomId).emit(`${gamePrefix}:gameAborted`, {
    reason,
    leavingPlayer: leavingPlayerName,
    roomData: room,
  });
}

/**
 * 플레이어 준비 상태 알림
 * @param {Object} io - Socket.IO 서버 인스턴스
 * @param {string} roomId - 방 ID
 * @param {string} socketId - 소켓 ID
 * @param {boolean} isReady - 준비 상태
 * @param {Object} room - 방 객체
 * @param {string} gamePrefix - 게임 타입
 */
function notifyPlayerReady(io, roomId, socketId, isReady, room, gamePrefix) {
  io.to(roomId).emit(`${gamePrefix}:playerReady`, {
    socketId,
    isReady,
    roomData: room,
  });
}

/**
 * 모든 플레이어 준비 완료 알림
 * @param {Object} io - Socket.IO 서버 인스턴스
 * @param {string} roomId - 방 ID
 * @param {string} gamePrefix - 게임 타입
 */
function notifyAllReady(io, roomId, gamePrefix) {
  io.to(roomId).emit(`${gamePrefix}:allReady`, { canStart: true });
}

/**
 * 자동 시작 알림
 * @param {Object} io - Socket.IO 서버 인스턴스
 * @param {Object} room - 방 객체
 * @param {string} gamePrefix - 게임 타입
 */
function notifyAutoStart(io, room, gamePrefix) {
  io.to(room.roomId).emit(`${gamePrefix}:autoStart`, { roomData: room });
}

module.exports = {
  broadcastRoomListUpdate,
  notifyPlayerJoined,
  notifyPlayerLeft,
  notifyHostChanged,
  notifyGameAborted,
  notifyPlayerReady,
  notifyAllReady,
  notifyAutoStart,
};
