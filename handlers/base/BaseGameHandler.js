// handlers/base/baseGameHandler.js

const RoomManager = require("./RoomManager");
const PlayerManager = require("./PlayerManager");
// => require 에러린트 뜨는 거 확인 필요

/**
 * 기본 게임 핸들러 (모든 멀티플레이 게임 공통 로직)
 * - 방 생성, 입장, 나가기, 준비, 방 목록
 * - 게임 시작은 게임별 핸들러에서 처리
 *
 * @param {Object} io - Socket.IO 서버 인스턴스
 * @param {Object} socket - 클라이언트 소켓
 * @param {Map} rooms - 방 목록
 * @param {string} gamePrefix - 게임 타입 (예: "omok", "pingpong")
 * @param {Object} config - 게임 설정
 * @param {number} [config.maxPlayers=2] - 최대 플레이어 수
 * @param {number} [config.minPlayers=2] - 최소 플레이어 수
 * @param {boolean} [config.autoStart=false] - 자동 시작 여부
 *
 * @returns {Object} - disconnect 핸들러를 포함한 객체
 *
 * @example
 * // server.js에서 사용
 * const baseGameHandler = require('./handlers/base/BaseGameHandler');
 *
 * io.on('connection', (socket) => {
 *   const omokHandler = baseGameHandler(io, socket, rooms, 'omok', {
 *     maxPlayers: 2,
 *     minPlayers: 2,
 *     autoStart: false
 *   });
 *
 *   socket.on('disconnect', () => {
 *     omokHandler.handleDisconnect();
 *   });
 * });
 */
module.exports = (io, socket, rooms, gamePrefix = "game", config = {}) => {
  // =====================================================================
  // =====================================================================

  const defaultConfig = {
    maxPlayers: 2,
    minPlayers: 2,
    autoStart: false,
  };

  const finalConfig = { ...defaultConfig, ...config };

  console.log(
    `[${gamePrefix}][핸들러등록] ${socket.id} (최대: ${finalConfig.maxPlayers}명, 최소: ${finalConfig.minPlayers}명, 자동시작: ${finalConfig.autoStart})`
  );

  // =====================================================================
  // =====================================================================

  // 매니저 인스턴스 생성
  const roomManager = new RoomManager(
    io,
    socket,
    rooms,
    gamePrefix,
    finalConfig
  );
  const playerManager = new PlayerManager(
    io,
    socket,
    rooms,
    gamePrefix,
    finalConfig
  );

  // =====================================================================
  // =====================================================================

  // 이벤트 핸들러 등록
  roomManager.registerHandlers();
  playerManager.registerHandlers();

  // =====================================================================
  // =====================================================================

  // disconnect 핸들러 반환
  return {
    handleDisconnect: () => {
      roomManager.handleDisconnect();
    },
  };
};
