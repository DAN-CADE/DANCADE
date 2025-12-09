// game/managers/ArcadeMachineManager.ts
import { getGameById, type GameConfig } from "@/game/config/gameRegistry";

/**
 * TiledObject - Tiled 맵 에디터의 오브젝트 타입 정의
 * Tiled에서 생성한 오브젝트의 좌표와 커스텀 속성을 담음
 */
interface TiledObject {
  x: number; // 오브젝트 X 좌표
  y: number; // 오브젝트 Y 좌표
  properties?: Array<{ name: string; value: string }>; // 커스텀 속성 (예: gameId)
}

/**
 * ArcadeMachine - 게임기 오브젝트 인터페이스
 * 한 개의 아케이드 게임기가 가지는 모든 정보
 */
export interface ArcadeMachine {
  sprite: Phaser.GameObjects.Sprite; // 게임기 스프라이트 (비주얼)
  game: GameConfig; // 연결된 게임 정보 (이름, sceneKey 등)
  x: number; // 게임기 X 좌표
  y: number; // 게임기 Y 좌표
  highlight?: Phaser.GameObjects.Graphics; // 하이라이트 원 (플레이어가 가까이 갔을 때)
  nameLabel?: Phaser.GameObjects.Text; // 게임 이름 텍스트
  collider?: Phaser.Physics.Arcade.Body; // 물리 충돌 바디 (사용 안 함, 제거 가능)
}

/**
 * ArcadeMachineManager - 아케이드 게임기 관리 클래스
 *
 * 역할:
 * 1. Tiled 맵에서 게임기 위치 파싱
 * 2. 게임기 스프라이트 생성 및 배치
 * 3. 플레이어와의 거리 계산
 * 4. 근처 게임기 하이라이트 효과
 * 5. 충돌 처리를 위한 물리 바디 설정
 */
export class ArcadeMachineManager {
  // ============================================================
  // 상수 정의
  // ============================================================
  private readonly LABEL_OFFSET_Y = 60; // 게임 이름 라벨의 Y축 오프셋 (게임기 위에 표시)
  private readonly INTERACTION_RADIUS = 80; // 상호작용 가능 반경 (픽셀)

  // ============================================================
  // 프로퍼티
  // ============================================================
  private scene: Phaser.Scene; // 현재 씬 참조 (스프라이트 생성용)
  private machines: ArcadeMachine[] = []; // 생성된 모든 게임기 배열

  /**
   * 생성자
   * @param scene - 게임기를 생성할 Phaser 씬
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * parseFromMap - Tiled 맵에서 게임기 파싱
   *
   * Tiled 맵의 "ArcadeMachines" 오브젝트 레이어를 찾아서
   * 각 오브젝트를 게임기로 변환
   *
   * @param map - Phaser Tilemap 객체
   */
  parseFromMap(map: Phaser.Tilemaps.Tilemap): void {
    // Tiled에서 생성한 "ArcadeMachines" 레이어 가져오기
    const objectLayer = map.getObjectLayer("ArcadeMachines");

    if (!objectLayer) {
      // 레이어가 없으면 임시 게임기 생성 (개발용)
      console.warn("No ArcadeMachines layer found, using fallback");
      this.createFallbackMachines();
      return;
    }

    try {
      // 레이어의 모든 오브젝트를 순회하며 게임기 생성
      objectLayer.objects.forEach((obj) => {
        this.createFromTiled(obj as TiledObject);
      });
    } catch (error) {
      // 파싱 실패 시 폴백 게임기 생성
      console.error("Error parsing arcade machines:", error);
      this.createFallbackMachines();
    }
  }

  /**
   * createFromTiled - Tiled 오브젝트를 게임기로 변환
   *
   * Tiled 오브젝트에서 gameId 속성을 읽어서
   * 해당하는 게임 정보를 찾아 게임기 생성
   *
   * @param obj - Tiled 오브젝트 (좌표 + 속성)
   */
  private createFromTiled(obj: TiledObject): void {
    // Tiled에서 설정한 "gameId" 커스텀 속성 가져오기
    // 예: properties = [{ name: "gameId", value: "brick-breaker" }]
    const gameId = obj.properties?.find((p) => p.name === "gameId")?.value;

    if (!gameId) {
      // gameId가 없으면 어떤 게임인지 알 수 없음
      console.warn(`Object at (${obj.x}, ${obj.y}) missing gameId`);
      return;
    }

    // gameRegistry에서 게임 정보 찾기
    const gameConfig = getGameById(gameId);
    if (!gameConfig) {
      // 존재하지 않는 게임 ID
      console.error(`Game not found: ${gameId}`);
      return;
    }

    // 게임기 생성
    this.create(obj.x, obj.y, gameConfig);
  }

  /**
   * create - 게임기 스프라이트 생성
   *
   * 실제 게임기를 화면에 표시하고 물리 바디 추가
   *
   * @param x - X 좌표
   * @param y - Y 좌표
   * @param gameConfig - 게임 설정 정보
   */
  private create(x: number, y: number, gameConfig: GameConfig): void {
    // 1. 게임기 스프라이트 생성
    const sprite = this.scene.add.sprite(x, y, "arcade-machine");

    // 2. 물리 바디 추가 (플레이어가 통과하지 못하게)
    // true = static body (움직이지 않는 고정 오브젝트)
    this.scene.physics.add.existing(sprite, true);

    // 3. 충돌 박스 크기 조정 (스프라이트보다 작게)
    const body = sprite.body as Phaser.Physics.Arcade.StaticBody;
    if (body) {
      // 스프라이트 크기의 80% 너비, 60% 높이로 설정
      body.setSize(sprite.width * 0.8, sprite.height * 0.6);
      // 충돌 박스를 약간 아래쪽으로 이동 (발판 느낌)
      body.setOffset(sprite.width * 0.1, sprite.height * 0.4);
    }

    // 4. 게임 이름 라벨 생성 (게임기 위에 표시)
    const nameLabel = this.scene.add
      .text(x, y - this.LABEL_OFFSET_Y, gameConfig.name, {
        fontSize: "14px",
        backgroundColor: "#000", // 검은색 배경
        padding: { x: 5, y: 3 },
        color: "#ffffff", // 흰색 텍스트
      })
      .setOrigin(0.5); // 중앙 정렬

    // 5. 배열에 추가 (나중에 검색/관리용)
    this.machines.push({
      sprite,
      game: gameConfig,
      x,
      y,
      nameLabel,
    });
  }

  /**
   * createFallbackMachines - 임시 게임기 생성 (개발용)
   *
   * Tiled 맵이 준비되지 않았을 때 사용
   * 빨간 사각형으로 게임기 위치 표시
   */
  private createFallbackMachines(): void {
    // 하드코딩된 임시 위치
    const positions = [
      { x: 300, y: 300, gameId: "brick-breaker" },
      { x: 600, y: 300, gameId: "whack-a-mole" },
      { x: 900, y: 300, gameId: "memory-game" },
    ];

    positions.forEach((pos) => {
      const gameConfig = getGameById(pos.gameId);
      if (gameConfig) {
        // 빨간 사각형 생성 (임시 게임기)
        const sprite = this.scene.add.rectangle(
          pos.x,
          pos.y,
          64,
          64,
          0xff0000 // 빨간색
        ) as any;

        // 물리 바디 추가 (충돌 가능하게)
        this.scene.physics.add.existing(sprite, true);

        // 이름 라벨
        const nameLabel = this.scene.add
          .text(pos.x, pos.y - 50, gameConfig.name, {
            fontSize: "14px",
            backgroundColor: "#000",
            padding: { x: 5, y: 3 },
          })
          .setOrigin(0.5);

        this.machines.push({
          sprite,
          game: gameConfig,
          x: pos.x,
          y: pos.y,
          nameLabel,
        });
      }
    });
  }

  /**
   * findNearestMachine - 가장 가까운 게임기 찾기
   *
   * 플레이어 위치를 기준으로 INTERACTION_RADIUS 내에 있는
   * 게임기 중 가장 가까운 것을 반환
   *
   * 최적화: 제곱근 계산을 피하기 위해 거리의 제곱을 사용
   *
   * @param playerX - 플레이어 X 좌표
   * @param playerY - 플레이어 Y 좌표
   * @returns 가장 가까운 게임기 또는 undefined (범위 내 없음)
   */
  findNearestMachine(
    playerX: number,
    playerY: number
  ): ArcadeMachine | undefined {
    // 반경의 제곱 (제곱근 계산 회피)
    const radiusSquared = this.INTERACTION_RADIUS ** 2;

    return (
      this.machines
        // 1. 각 게임기와의 거리 제곱 계산
        .map((machine) => ({
          machine,
          distanceSquared:
            Math.pow(playerX - machine.x, 2) + Math.pow(playerY - machine.y, 2),
        }))
        // 2. 범위 내의 게임기만 필터링
        .filter(({ distanceSquared }) => distanceSquared < radiusSquared)
        // 3. 거리 순으로 정렬 (가까운 순)
        .sort((a, b) => a.distanceSquared - b.distanceSquared)[0]?.machine
    );
  }

  /**
   * highlightMachine - 게임기 하이라이트 표시
   *
   * 플레이어가 가까이 있을 때 노란색 원으로 표시
   * 처음 호출 시 Graphics 객체 생성, 이후 재사용
   *
   * @param machine - 하이라이트할 게임기
   */
  highlightMachine(machine: ArcadeMachine): void {
    if (!machine.highlight) {
      // Graphics 객체가 없으면 생성
      machine.highlight = this.scene.add.graphics();
      machine.highlight.lineStyle(3, 0xffff00, 0.8); // 노란색, 두께 3, 투명도 80%
      machine.highlight.strokeCircle(machine.x, machine.y, 50); // 반경 50 원
      machine.highlight.setDepth(10); // 다른 오브젝트 위에 표시
    }
    // 보이기
    machine.highlight.setVisible(true);
  }

  /**
   * clearAllHighlights - 모든 하이라이트 숨기기
   *
   * 플레이어가 게임기에서 멀어졌을 때 호출
   * 모든 게임기의 하이라이트를 비활성화
   */
  clearAllHighlights(): void {
    this.machines.forEach((machine) => {
      machine.highlight?.setVisible(false);
    });
  }

  /**
   * getMachines - 모든 게임기 배열 반환
   *
   * MainScene에서 충돌 설정 시 사용
   *
   * @returns 생성된 모든 게임기 배열
   */
  getMachines(): ArcadeMachine[] {
    return this.machines;
  }

  /**
   * destroy - 매니저 정리 (메모리 해제)
   *
   * 씬 종료 시 호출
   * 생성한 모든 오브젝트를 제거하여 메모리 누수 방지
   */
  destroy(): void {
    this.machines.forEach((machine) => {
      machine.highlight?.destroy(); // 하이라이트 원 제거
      machine.nameLabel?.destroy(); // 이름 라벨 제거
      machine.sprite?.destroy(); // 스프라이트 제거
    });
    this.machines = []; // 배열 초기화
  }
}
