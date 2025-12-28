// handlers/base/utils/roomUtils.js

/**
 * 방 관련 유틸리티 함수 모음
 */

/**
 * 랜덤 방 ID 생성
 * @returns {string} 생성된 방 ID
 */
function generateRoomId() {
  return "room_" + Math.random().toString(36).substr(2, 9);
}

/**
 * 특정 게임 타입의 공개 방 목록 반환
 * @param {Map} rooms - 전체 방 목록
 * @param {string} gamePrefix - 게임 타입 (예: "omok")
 * @returns {Array} 공개 방 목록
 */
function getRoomList(rooms, gamePrefix) {
  const roomList = [];
  rooms.forEach((room) => {
    if (
      room.gameType === gamePrefix &&
      room.status === "waiting" &&
      !room.isPrivate
    ) {
      roomList.push({
        roomId: room.roomId,
        roomName: room.roomName,
        hostUsername: room.players[0]?.username,
        hostSocketId: room.hostSocketId,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        isPrivate: room.isPrivate,
        status: room.status,
      });
    }
  });
  return roomList;
}

/**
 * 방 데이터 객체 생성
 * @param {Object} params
 * @param {string} params.roomId - 방 ID
 * @param {string} params.roomName - 방 이름
 * @param {string} params.gamePrefix - 게임 타입
 * @param {string} params.hostSocketId - 방장 소켓 ID
 * @param {string} params.username - 방장 이름
 * @param {boolean} params.isPrivate - 비공개 여부
 * @param {string} params.password - 방 비밀번호
 * @param {number} params.maxPlayers - 최대 인원
 * @returns {Object} 방 데이터
 */
function createRoomData({
  roomId,
  roomName,
  gamePrefix,
  hostSocketId,
  username,
  isPrivate,
  password,
  maxPlayers,
}) {
  return {
    roomId,
    roomName: roomName || `${username}의 방`,
    gameType: gamePrefix,
    hostSocketId,
    players: [
      {
        socketId: hostSocketId,
        username,
        isReady: false,
        joinedAt: Date.now(),
      },
    ],
    isPrivate: isPrivate || false,
    password: password || "",
    maxPlayers,
    playerCount: 1,
    status: "waiting",
    createdAt: Date.now(),
  };
}

/**
 * 새 플레이어 데이터 생성
 * @param {string} socketId - 소켓 ID
 * @param {string} username - 사용자 이름
 * @returns {Object} 플레이어 데이터
 */
function createPlayerData(socketId, username) {
  return {
    socketId,
    username,
    isReady: false,
    joinedAt: Date.now(),
  };
}

module.exports = {
  generateRoomId,
  getRoomList,
  createRoomData,
  createPlayerData,
};
