import type { GameConfig } from "@/types/game";
import { RoomManager } from "./RoomManager";
import { PlayerManager } from "./PlayerManager";
import { GameIO, GameSocket } from "../../types/server/server.types";
import { ServerRoom } from "../../game/types/multiplayer/room.types";

// =====================================================================
/**
 * disconnect 핸들러 반환 타입
 */
// =====================================================================
interface DisconnectHandler {
  handleDisconnect: () => void;
}

// =====================================================================
/**
 * 기본 게임 핸들러 (모든 멀티플레이 게임 공통 로직)
 * - 방 생성, 입장, 나가기, 준비, 방 목록
 * - 게임 시작은 게임별 핸들러에서 처리
 *
 * @param io - Socket.IO 서버 인스턴스
 * @param socket - 클라이언트 소켓
 * @param rooms - 방 목록
 * @param gamePrefix - 게임 타입 (예: "omok", "pingpong")
 * @param config - 게임 설정
 *
 * @returns disconnect 핸들러를 포함한 객체
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
// =====================================================================
export function createBaseGameHandler(
  io: GameIO,
  socket: GameSocket,
  rooms: Map<string, ServerRoom>,
  gamePrefix: string = "game",
  config: Partial<GameConfig> = {}
): DisconnectHandler {
  // =====================================================================
  // 기본 설정
  // =====================================================================

  const defaultConfig: GameConfig = {
    maxPlayers: 2,
    minPlayers: 2,
    autoStart: false,
  };

  const finalConfig: GameConfig = { ...defaultConfig, ...config };

  console.log(
    `[${gamePrefix}][핸들러등록] ${socket.id} (최대: ${finalConfig.maxPlayers}명, 최소: ${finalConfig.minPlayers}명, 자동시작: ${finalConfig.autoStart})`
  );

  // =====================================================================
  // 매니저 인스턴스 생성
  // =====================================================================

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
  // 이벤트 핸들러 등록
  // =====================================================================

  roomManager.registerHandlers();
  playerManager.registerHandlers();

  // =====================================================================
  // disconnect 핸들러 반환
  // =====================================================================

  return {
    handleDisconnect: () => {
      roomManager.handleDisconnect();
    },
  };
}

// =====================================================================
// CommonJS 호환성을 위한 default export
// =====================================================================
export default createBaseGameHandler;
