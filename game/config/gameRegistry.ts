export interface GameConfig {
  id: string;
  name: string;
  sceneKey: string;
  description?: string;
  thumbnail?: string;
}

export const GAME_REGISTRY: GameConfig[] = [
  {
    id: "brick-breaker",
    name: "Brick Breaker",
    sceneKey: "StartScene",
    description: "벽돌을 모두 깨세요!",
  },
  {
    id: "ping-pong",
    name: "Ping Pong",
    sceneKey: "PingPongScene",
    description: "실제 탁구 게임을 즐겨보세요!",
  },
  {
    id: "Omok",
    name: "Omok",
    sceneKey: "OmokScene",
    description: "친구들과 오목을 즐겨보세요!",
  },
  // 새 게임 추가는 여기에만
];

// 게임 찾기 헬퍼 함수
export function getGameById(id: string): GameConfig | undefined {
  return GAME_REGISTRY.find((game) => game.id === id);
}

// export function getGameBySceneKey(sceneKey: string): GameConfig | undefined {
//   return GAME_REGISTRY.find((game) => game.sceneKey === sceneKey);
// }
