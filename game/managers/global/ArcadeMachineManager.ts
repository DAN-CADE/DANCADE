import { getGameById, type GameConfig } from "@/game/config/gameRegistry";
import { ArcadeMachine, TiledObject } from "@/game/types/arcade";

/**
 * ArcadeMachineManager
 *
 * 핑퐁 스타일 리팩토링:
 * - Scene과의 결합도 낮춤
 * - 로직을 Manager에 집중
 * - update() 패턴 적용
 */
export class ArcadeMachineManager {
  private readonly LABEL_OFFSET_Y = 60;
  private readonly INTERACTION_RADIUS = 110;

  private scene: Phaser.Scene;
  private machines: ArcadeMachine[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * init - Tiled 맵에서 게임기 초기화
   * 핑퐁의 setupScene()처럼 초기 설정
   */
  init(map: Phaser.Tilemaps.Tilemap): void {
    const objectLayer = map.getObjectLayer("gameObject");
    if (!objectLayer) {
      console.warn("ArcadeMachineManager: 'gameObject' layer not found");
      return;
    }

    objectLayer.objects.forEach((obj) => {
      this.createMachineFromObject(obj as unknown as TiledObject);
    });
  }

  /**
   * update - 매 프레임 호출
   * 핑퐁의 gameManager.update()와 동일한 패턴
   *
   * @returns 현재 가까운 게임 정보 (없으면 null)
   */
  update(playerPos: { x: number; y: number }): GameConfig | null {
    const nearest = this.findNearest(playerPos.x, playerPos.y);

    this.clearHighlights();

    if (nearest) {
      this.applyHighlight(nearest);
      return nearest.game;
    }

    return null;
  }

  /**
   * getMachines - 게임기 배열 반환
   */
  getMachines(): ArcadeMachine[] {
    return this.machines;
  }

  /**
   * destroy - 정리
   * 핑퐁의 cleanupManagers()처럼 리소스 해제
   */
  destroy(): void {
    this.machines.forEach((m) => {
      m.highlight?.destroy();
      m.nameLabel?.destroy();
    });
    this.machines = [];
  }

  // ============================================================
  // Private 메서드 - 내부 로직
  // ============================================================

  private createMachineFromObject(obj: TiledObject): void {
    const gameId = obj.properties?.find((p) => p.name === "gameId")?.value;
    const gameConfig = getGameById(gameId);

    if (!gameConfig) {
      if (gameId) {
        console.error(`Game not found: ${gameId}`);
      }
      return;
    }

    const centerX = obj.x + (obj.width || 0) / 2;
    const centerY = obj.y + (obj.height || 0) / 2;

    const nameLabel = this.scene.add
      .text(centerX, centerY - this.LABEL_OFFSET_Y, gameConfig.name, {
        fontSize: "14px",
        backgroundColor: "#000",
        color: "#fff",
        padding: { x: 5, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.machines.push({
      game: gameConfig,
      x: centerX,
      y: centerY,
      nameLabel,
    });
  }

  private findNearest(
    playerX: number,
    playerY: number
  ): ArcadeMachine | undefined {
    const radiusSquared = this.INTERACTION_RADIUS ** 2;

    return this.machines
      .map((machine) => ({
        machine,
        distanceSquared:
          Math.pow(playerX - machine.x, 2) + Math.pow(playerY - machine.y, 2),
      }))
      .filter(({ distanceSquared }) => distanceSquared < radiusSquared)
      .sort((a, b) => a.distanceSquared - b.distanceSquared)[0]?.machine;
  }

  private applyHighlight(machine: ArcadeMachine): void {
    if (!machine.highlight) {
      machine.highlight = this.scene.add.graphics();
      machine.highlight.lineStyle(3, 0xffff00, 0.8);
      machine.highlight.strokeCircle(machine.x, machine.y, 70);
      machine.highlight.setDepth(10);
    }
    machine.highlight.setVisible(true);
  }

  private clearHighlights(): void {
    this.machines.forEach((m) => {
      m.highlight?.setVisible(false);
    });
  }
}
