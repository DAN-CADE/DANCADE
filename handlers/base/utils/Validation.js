// handlers/base/utils/validation.js

/**
 * 검증 관련 유틸리티 함수 모음
 */

/**
 * 방 존재 여부 검증
 * @param {Object|null} room - 방 객체
 * @param {Object} socket - 소켓 객체
 * @param {string} gamePrefix - 게임 타입
 * @returns {boolean} 검증 성공 여부
 */
function validateRoomExists(room, socket, gamePrefix) {
  if (!room) {
    socket.emit(`${gamePrefix}:joinError`, {
      message: "존재하지 않는 방입니다.",
    });
    return false;
  }
  return true;
}

/**
 * 방 인원 체크
 * @param {Object} room - 방 객체
 * @param {Object} socket - 소켓 객체
 * @param {string} gamePrefix - 게임 타입
 * @returns {boolean} 검증 성공 여부
 */
function validateRoomNotFull(room, socket, gamePrefix) {
  if (room.players.length >= room.maxPlayers) {
    socket.emit(`${gamePrefix}:joinError`, {
      message: "방이 가득 찼습니다.",
    });
    return false;
  }
  return true;
}

/**
 * 방 비밀번호 체크
 * @param {Object} room - 방 객체
 * @param {string} password - 입력된 비밀번호
 * @param {Object} socket - 소켓 객체
 * @param {string} gamePrefix - 게임 타입
 * @returns {boolean} 검증 성공 여부
 */
function validateRoomPassword(room, password, socket, gamePrefix) {
  if (room.isPrivate && room.password !== password) {
    socket.emit(`${gamePrefix}:joinError`, {
      message: "비밀번호가 틀렸습니다.",
    });
    return false;
  }
  return true;
}

/**
 * 중복 입장 체크
 * @param {Object} room - 방 객체
 * @param {string} socketId - 소켓 ID
 * @param {Object} socket - 소켓 객체
 * @param {string} gamePrefix - 게임 타입
 * @returns {boolean} 검증 성공 여부
 */
function validateNotAlreadyInRoom(room, socketId, socket, gamePrefix) {
  const alreadyInRoom = room.players.some((p) => p.socketId === socketId);
  if (alreadyInRoom) {
    socket.emit(`${gamePrefix}:joinError`, {
      message: "이미 방에 입장했습니다.",
    });
    return false;
  }
  return true;
}

/**
 * 방장 권한 체크
 * @param {Object} room - 방 객체
 * @param {string} socketId - 소켓 ID
 * @param {Object} socket - 소켓 객체
 * @param {string} gamePrefix - 게임 타입
 * @returns {boolean} 검증 성공 여부
 */
function validateIsHost(room, socketId, socket, gamePrefix) {
  if (socketId !== room.hostSocketId) {
    socket.emit(`${gamePrefix}:error`, {
      message: "방장만 실행할 수 있습니다.",
    });
    return false;
  }
  return true;
}

/**
 * 플레이어가 방에 있는지 체크
 * @param {Object} room - 방 객체
 * @param {string} socketId - 소켓 ID
 * @param {Object} socket - 소켓 객체
 * @param {string} gamePrefix - 게임 타입
 * @returns {Object|null} 플레이어 객체 또는 null
 */
function validatePlayerInRoom(room, socketId, socket, gamePrefix) {
  const player = room.players.find((p) => p.socketId === socketId);
  if (!player) {
    socket.emit(`${gamePrefix}:error`, {
      message: "방에 입장하지 않았습니다.",
    });
    return null;
  }
  return player;
}

/**
 * 사용자 이름 체크
 * @param {string} username - 사용자 이름
 * @param {Object} socket - 소켓 객체
 * @param {string} gamePrefix - 게임 타입
 * @returns {boolean} 검증 성공 여부
 */
function validateUsername(username, socket, gamePrefix) {
  if (!username) {
    socket.emit(`${gamePrefix}:joinError`, {
      message: "사용자 이름이 필요합니다.",
    });
    return false;
  }
  return true;
}

/**
 * 필수 데이터 체크
 * @param {Object} data - 데이터 객체
 * @param {Array<string>} requiredFields - 필수 필드 배열
 * @param {Object} socket - 소켓 객체
 * @param {string} gamePrefix - 게임 타입
 * @returns {boolean} 검증 성공 여부
 */
function validateRequiredFields(data, requiredFields, socket, gamePrefix) {
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

module.exports = {
  validateRoomExists,
  validateRoomNotFull,
  validateRoomPassword,
  validateNotAlreadyInRoom,
  validateIsHost,
  validatePlayerInRoom,
  validateUsername,
  validateRequiredFields,
};
