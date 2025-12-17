import { GameConfig } from "@/game/config/gameRegistry";

export interface TiledObject {
  x: number; // 오브젝트 X 좌표
  y: number; // 오브젝트 Y 좌표
  properties?: Array<{ name: string; value: string }>; // 커스텀 속성 (예: gameId)
  width: number;
  height: number;
}
export interface ArcadeMachine {
  // sprite: Phaser.GameObjects.Sprite; // 게임기 스프라이트 (비주얼) -> 기본 tileLayer의 이미지로 대체
  game: GameConfig; // 연결된 게임 정보 (이름, sceneKey 등)
  x: number; // 게임기 X 좌표
  y: number; // 게임기 Y 좌표
  highlight?: Phaser.GameObjects.Graphics; // 하이라이트 원 (플레이어가 가까이 갔을 때)
  nameLabel?: Phaser.GameObjects.Text; // 게임 이름 텍스트
  collider?: Phaser.Physics.Arcade.Body; // 물리 충돌 바디 (사용 안 함, 제거 가능)
  width?: number;
  height?: number;
}

// ----------------------------------------------------
// 매니저 전용 상태 및 콜백 타입 추가
// ----------------------------------------------------

// 1. 상태 타입 정의 (BaseGameManager의 TGameState)
export interface ArcadeState {
  machines: ArcadeMachine[]; // 모든 게임기 목록
  nearestMachine: ArcadeMachine | null; // 가장 가까운 게임기
}

// 2. 콜백 타입 정의 (BaseGameManager의 TCallbacks)
export interface ArcadeCallbacks {
  onNearMachine?: (game: GameConfig) => void; // 게임기 근처 도착
  onLeaveMachine?: () => void; // 게임기에서 멀어짐
  [key: string]: unknown;
}
