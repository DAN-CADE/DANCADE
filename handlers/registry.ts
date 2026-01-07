import type { SupabaseClient } from "@supabase/supabase-js";
import { createBaseGameHandler } from "./base/BaseGameHandler";
import { createOmokHandler } from "./games/omok/OmokHandler";
import { createPingPongHandler } from "./games/pingpong/PingpongHandler";
import { GameIO, GameSocket } from "@/types/server/server.types";
import { ServerRoom } from "@/game/types/multiplayer/room.types";

interface GameHandlerConfig {
  maxPlayers: number;
  minPlayers: number;
  autoStart: boolean;
}

interface HandlerRegistration {
  gamePrefix: string;
  config: GameHandlerConfig;
  handler: (
    io: GameIO,
    socket: GameSocket,
    rooms: Map<string, ServerRoom>,
    supabase?: SupabaseClient
  ) => void;
}

/**
 * 게임 핸들러 목록
 * 새 게임 추가 시 여기만 수정!
 */
export const GAME_HANDLERS: HandlerRegistration[] = [
  {
    gamePrefix: "omok",
    config: {
      maxPlayers: 2,
      minPlayers: 2,
      autoStart: false,
    },
    handler: createOmokHandler,
  },
  {
    gamePrefix: "pingpong",
    config: {
      maxPlayers: 2,
      minPlayers: 2,
      autoStart: false,
    },
    handler: createPingPongHandler,
  },
  // ✅ 새 게임 추가는 여기에!
  // {
  //   gamePrefix: "tetris",
  //   config: { ... },
  //   handler: createTetrisHandler,
  // },
];

/**
 * 모든 게임 핸들러 자동 등록
 */
export function registerAllHandlers(
  io: GameIO,
  socket: GameSocket,
  rooms: Map<string, ServerRoom>,
  supabase?: SupabaseClient
) {
  const disconnectHandlers: Array<{ handleDisconnect: () => void }> = [];

  GAME_HANDLERS.forEach(({ gamePrefix, config, handler }) => {
    // Base 핸들러 등록 (방 관리)
    const disconnectHandler = createBaseGameHandler(
      io,
      socket,
      rooms,
      gamePrefix,
      config
    );
    disconnectHandlers.push(disconnectHandler);

    // 게임별 핸들러 등록
    handler(io, socket, rooms, supabase);
  });

  // 통합 disconnect 핸들러 반환
  return {
    handleDisconnect: () => {
      disconnectHandlers.forEach((handler) => handler.handleDisconnect());
    },
  };
}
