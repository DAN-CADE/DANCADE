// handlers/base/utils/RoomUtils.js

const RoomStatsEnricher = require("./RoomStatsEnricher");
const { v4: uuidv4 } = require("uuid");

// =====================================================================
/**
 * 랜덤 방 ID 생성
 * @returns {string} 생성된 방 ID
 */
function generateRoomId() {
  return uuidv4();
}
// =====================================================================

// =====================================================================
/**
 * 특정 게임 타입의 방 목록 반환 (통계 포함)
 * @param {Map} rooms - 전체 방 목록
 * @param {string} gamePrefix - 게임 타입 (예: "omok")
 * @returns {Promise<Array>} 방 목록 (통계 포함)
 */
// =====================================================================

async function getRoomList(rooms, gamePrefix) {
  console.log(
    `[getRoomList] 시작 - gamePrefix: ${gamePrefix}, 전체 방: ${rooms.size}개`
  );

  const roomList = [];
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
        hostUsername: room.players[0]?.username,
        hostSocketId: room.hostSocketId,
        hostUserId: room.players[0]?.userId,
        hostUserUUID: room.players[0]?.userUUID,
        playerCount: room.players.length,
        maxPlayers: room.maxPlayers,
        isPrivate: room.isPrivate,
        status: room.status,
        players: room.players,
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
 * @param {Object} params
 * @param {string} params.roomId - 방 ID
 * @param {string} params.roomName - 방 이름
 * @param {string} params.gamePrefix - 게임 타입
 * @param {string} params.hostSocketId - 방장 소켓 ID
 * @param {string} params.userId - 방장 유저 ID
 * @param {string} params.username - 방장 이름
 * @param {boolean} params.isPrivate - 비공개 여부
 * @param {string} params.password - 방 비밀번호
 * @param {number} params.maxPlayers - 최대 인원
 * @returns {Object} 방 데이터
 */
// =====================================================================

function createRoomData({
  roomId,
  roomName,
  gamePrefix,
  hostSocketId,
  userId,
  userUUID,
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
        userId,
        username,
        userUUID,
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

// =====================================================================
/**
 * 새 플레이어 데이터 생성
 * @param {string} socketId - 소켓 ID
 * @param {string} username - 사용자 이름
 * @param {string} [userId] - 유저 ID
 * @returns {Object} 플레이어 데이터
 */
// =====================================================================

function createPlayerData(socketId, username, userId = null, userUUID = null) {
  return {
    socketId,
    userId,
    username,
    userUUID,
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
