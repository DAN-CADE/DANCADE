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
    // sceneKey: "BrickBreakerScene",
    sceneKey: "StartScene",
    description: "벽돌을 모두 깨세요!",
  },
  {
    id: "whack-a-mole",
    name: "Whack-a-Mole",
    sceneKey: "WhackAMole",
    description: "두더지를 잡으세요!",
  },
  {
    id: "memory-game",
    name: "Memory Game",
    sceneKey: "MemoryGame",
    description: "카드를 맞추세요!",
  },
  {
    id: "ping-pong",
    name: "Ping Pong",
    sceneKey: "RealPingPongScene",
    description: "실제 탁구 게임을 즐겨보세요!",
  },
  // 새 게임 추가는 여기에만
];

// 게임 찾기 헬퍼 함수
export function getGameById(id: string): GameConfig | undefined {
  return GAME_REGISTRY.find((game) => game.id === id);
}

export function getGameBySceneKey(sceneKey: string): GameConfig | undefined {
  return GAME_REGISTRY.find((game) => game.sceneKey === sceneKey);
}
