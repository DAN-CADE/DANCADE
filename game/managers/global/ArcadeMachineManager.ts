import { BaseGameManager } from "../base/BaseGameManager";
import { getGameById, type GameConfig } from "@/game/config/gameRegistry";
import {
  ArcadeCallbacks,
  ArcadeMachine,
  ArcadeState,
  TiledObject,
} from "@/game/types/arcade";
export class ArcadeMachineManager extends BaseGameManager<
  ArcadeState,
  ArcadeCallbacks
> {
  private readonly SETTINGS = {
    LABEL_OFFSET_Y: 60,
    INTERACTION_RADIUS: 110,
    HIGHLIGHT_COLOR: 0xffff00,
    HIGHLIGHT_RADIUS: 70,
    LABEL_STYLE: {
      // 스타일 설정 분리
      fontSize: "14px",
      backgroundColor: "#000",
      color: "#fff",
      padding: { x: 5, y: 3 },
    },
  };

  constructor(scene: Phaser.Scene, callbacks: ArcadeCallbacks = {}) {
    // 부모 생성자 호출: 초기 상태(machines 비어있음)와 콜백 전달
    super(scene, { machines: [], nearestMachine: null }, callbacks);
  }

  // 맵의 오브젝트 레이어에서 게임기들을 생성
  public setGameObjects(map: Phaser.Tilemaps.Tilemap): void {
    // Tiled 맵에서 "gameObject" 레이어 가져오기
    const objectLayer = map.getObjectLayer("gameObject");
    if (!objectLayer) {
      console.warn("게임기를 찾을 수 없습니다.");
      return;
    }

    // 각 오브젝트를 파싱하여 게임기 생성
    objectLayer.objects.forEach((obj) => {
      const machine = this.parseTiledObject(obj as unknown as TiledObject);
      if (machine) this.gameState.machines.push(machine);
    });
  }

  // 자원 정리 후 상태 초기화
  public resetGame(): void {
    this.destroy();
    this.gameState.machines = [];
    this.gameState.nearestMachine = null;
  }

  // 매 프레임 플레이어 위치를 받아 가장 가까운 게임기 탐색 및 하이라이트
  public update(playerPos: {
    x: number;
    y: number;
  }): { game: GameConfig; x: number; y: number } | null {
    const nearest = this.findNearest(playerPos.x, playerPos.y);

    // 이전과 상태가 달라졌을 때만 콜백 호출
    if (nearest !== this.gameState.nearestMachine) {
      if (nearest) this.callCallback("onNearMachine", nearest.game);
      else this.callCallback("onLeaveMachine");

      this.gameState.nearestMachine = nearest || null;
    }

    this.updateHighlights(nearest);
    // 게임 정보와 위치 정보를 함께 반환
    return nearest ? { game: nearest.game, x: nearest.x, y: nearest.y } : null;
  }

  private parseTiledObject(obj: TiledObject): ArcadeMachine | null {
    // 1. gameId 추출 로직
    const gameIdProp = obj.properties?.find(
      (p: { name: string; value: unknown }) => p.name === "gameId"
    );
    if (!gameIdProp || typeof gameIdProp.value !== "string") return null;

    const gameConfig = getGameById(gameIdProp.value);
    if (!gameConfig) return null;

    // 2. 중심점 계산
    const centerX = obj.x + (obj.width || 0) / 2;
    const centerY = obj.y + (obj.height || 0) / 2;

    // 3. 게임 라벨 생성
    const nameLabel = this.scene.add
      .text(
        centerX,
        centerY - this.SETTINGS.LABEL_OFFSET_Y,
        gameConfig.name,
        this.SETTINGS.LABEL_STYLE
      )
      .setOrigin(0.5)
      .setDepth(100);

    return { game: gameConfig, x: centerX, y: centerY, nameLabel };
  }

  private findNearest(
    playerX: number,
    playerY: number
  ): ArcadeMachine | undefined {
    const radiusSq = Math.pow(this.SETTINGS.INTERACTION_RADIUS, 2);
    let nearest: ArcadeMachine | undefined;
    let minDistanceSq = radiusSq;

    for (const machine of this.gameState.machines) {
      const distSq =
        Math.pow(playerX - machine.x, 2) + Math.pow(playerY - machine.y, 2);
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        nearest = machine;
      }
    }
    return nearest;
  }

  private createHighlight(x: number, y: number): Phaser.GameObjects.Graphics {
    return this.scene.add
      .graphics()
      .lineStyle(3, this.SETTINGS.HIGHLIGHT_COLOR, 0.8)
      .strokeCircle(x, y, this.SETTINGS.HIGHLIGHT_RADIUS)
      .setDepth(10);
  }

  private updateHighlights(nearest: ArcadeMachine | undefined): void {
    this.gameState.machines.forEach((m) => {
      const isNearest = m === nearest;

      if (isNearest) {
        if (!m.highlight) m.highlight = this.createHighlight(m.x, m.y); // 로직 분리
        m.highlight.setVisible(true);
      } else {
        m.highlight?.setVisible(false);
      }
    });
  }

  public override destroy(): void {
    this.gameState.machines.forEach((m) => {
      m.nameLabel?.destroy();
      m.highlight?.destroy();
    });
    super.destroy(); // BaseGameManager의 destroy 호출
  }
}
