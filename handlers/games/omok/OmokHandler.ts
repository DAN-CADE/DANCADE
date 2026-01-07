// // handlers/games/omok/omokHandler.js

// const OmokGameManager = require("./OmokGameManager");
// const OmokMatchmaking = require("./OmokMatchmaking");

// /**
//  * 오목 게임 전용 핸들러
//  * - 게임 시작/종료, 수 전송, 빠른 매칭
//  *
//  * @param {Object} io - Socket.IO 서버 인스턴스
//  * @param {Object} socket - 클라이언트 소켓
//  * @param {Map} rooms - 방 목록
//  *
//  * @example
//  * // server.js에서 사용
//  * const omokHandler = require('./handlers/games/omok/OmokHandler');
//  *
//  * io.on('connection', (socket) => {
//  *   omokHandler(io, socket, rooms);
//  * });
//  */
// module.exports = (io, socket, rooms, supabase) => {
//   console.log(`[Omok Handler] 핸들러 등록: ${socket.id}`);

//   // 매니저 인스턴스 생성
//   const gameManager = new OmokGameManager(io, socket, rooms);
//   const matchmaking = new OmokMatchmaking(io, socket, rooms, supabase);

//   // 이벤트 핸들러 등록
//   gameManager.registerHandlers();
//   matchmaking.registerHandlers();
// };

// @/server/handlers/games/omok/OmokHandler.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import { OmokGameManager } from "./OmokGameManager";
import { OmokMatchmaking } from "./OmokMatchmaking";
import { GameIO, GameSocket } from "@/types/server/server.types";
import { ServerRoom } from "@/game/types/multiplayer/room.types";

/**
 * 오목 게임 전용 핸들러
 * - 게임 시작/종료, 수 전송, 빠른 매칭
 *
 * @param io - Socket.IO 서버 인스턴스
 * @param socket - 클라이언트 소켓
 * @param rooms - 방 목록
 * @param supabase - Supabase 클라이언트 (선택적)
 *
 * @example
 * // server.js에서 사용
 * const omokHandler = require('./handlers/games/omok/OmokHandler');
 *
 * io.on('connection', (socket) => {
 *   omokHandler(io, socket, rooms, supabase);
 * });
 */
export function createOmokHandler(
  io: GameIO,
  socket: GameSocket,
  rooms: Map<string, ServerRoom>,
  supabase?: SupabaseClient
): void {
  console.log(`[Omok Handler] 핸들러 등록: ${socket.id}`);

  // 매니저 인스턴스 생성
  const gameManager = new OmokGameManager(io, socket, rooms);
  const matchmaking = new OmokMatchmaking(io, socket, rooms, supabase);

  // 이벤트 핸들러 등록
  gameManager.registerHandlers();
  matchmaking.registerHandlers();
}

// =====================================================================
// CommonJS 호환성을 위한 default export
// =====================================================================
export default createOmokHandler;
