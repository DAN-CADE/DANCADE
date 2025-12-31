// server/handlers/games/pingpong/pingpongHandler.js

const PingPongGameManager = require("./PingPongGameManager");
const PingPongMatchmaking = require("./PingPongMatchmaking");

/**
 * 핑퐁 게임 전용 핸들러
 * - 게임 시작/종료, 공 치기, 패들 이동, 빠른 매칭
 *
 * @param {Object} io - Socket.IO 서버 인스턴스
 * @param {Object} socket - 클라이언트 소켓
 * @param {Map} rooms - 방 목록
 */
module.exports = (io, socket, rooms) => {
  console.log(`[PingPong Handler] 핸들러 등록: ${socket.id}`);

  // 매니저 인스턴스 생성
  const gameManager = new PingPongGameManager(io, socket, rooms);
  const matchmaking = new PingPongMatchmaking(io, socket, rooms);

  // 이벤트 핸들러 등록
  gameManager.registerHandlers();
  matchmaking.registerHandlers();
};
