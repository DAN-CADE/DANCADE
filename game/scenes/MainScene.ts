// game/scenes/MainScene.ts
import { type GameConfig } from "@/game/config/gameRegistry";
import { ArcadeMachineManager } from "@/game/managers/ArcadeMachineManager";
import { PlayerManager } from "@/game/managers/PlayerManager";

/**
 * MainScene - 아케이드 메인 로비 씬
 * 플레이어가 돌아다니며 게임기와 상호작용할 수 있는 메인 공간
 */
export class MainScene extends Phaser.Scene {
  // ============================================================
  // 상수 정의
  // ============================================================
  private readonly FADE_DURATION = 300; // 씬 전환 시 페이드 효과 지속 시간 (ms)
  private readonly PLAYER_START_X = 960; // 플레이어 시작 X 좌표
  private readonly PLAYER_START_Y = 544; // 플레이어 시작 Y 좌표

  // ============================================================
  // 게임 오브젝트 및 매니저
  // ============================================================
  private map!: Phaser.Tilemaps.Tilemap; // Tiled로 만든 맵 데이터
  private playerManager!: PlayerManager; // 플레이어 이동 및 입력 관리
  private machineManager!: ArcadeMachineManager; // 아케이드 게임기 생성 및 관리
  private interactKey!: Phaser.Input.Keyboard.Key; // E키 (상호작용)
  private interactPrompt!: Phaser.GameObjects.Text; // "Press E to play" UI 텍스트
  private nearbyGame: GameConfig | null = null; // 현재 플레이어 근처에 있는 게임 정보

  constructor() {
    super({ key: "MainScene" });
  }

  /**
   * preload - 리소스 로딩
   * 씬이 시작되기 전에 필요한 이미지, 맵, 스프라이트시트 로드
   */
  preload() {
    // 타일셋 이미지 로드
    this.load.image("CommonTile", "/tilesets/CommonTile.png");

    // Tiled JSON 맵 파일 로드
    this.load.tilemapTiledJSON("map", "/maps/DanMap5.tmj");

    // 플레이어 스프라이트시트 로드 (64x64 프레임)
    this.load.spritesheet(
      "player",
      "/assets/spritesheets/body/male/light.png",
      {
        frameWidth: 64,
        frameHeight: 64,
      }
    );

    // 아케이드 게임기 이미지 로드
    this.load.image("arcade-machine", "/assets/arcade-machine.png");
  }

  /**
   * create - 씬 초기화
   * 게임 오브젝트 생성 및 초기 설정
   */
  create() {
    // 1. 매니저 초기화
    this.playerManager = new PlayerManager(this);
    this.machineManager = new ArcadeMachineManager(this);

    // 2. 맵 생성 (타일맵 레이어 렌더링)
    this.createMap();

    // 3. 플레이어 생성 및 배치
    this.playerManager.create(this.PLAYER_START_X, this.PLAYER_START_Y);

    // 4. 맵에서 게임기 위치 파싱 및 생성
    this.machineManager.parseFromMap(this.map);

    // 5. 플레이어와 게임기 간 충돌 설정
    this.setupCollisions();

    // 6. 키보드 입력 설정
    this.setupInput();

    // 7. UI 요소 생성
    this.createUI();

    console.log("MainScene created!");
  }

  /**
   * createMap - Tiled 맵 생성 및 렌더링
   * JSON 맵 파일을 읽어와서 레이어별로 렌더링
   */
  private createMap(): void {
    // Tiled JSON 맵 생성
    this.map = this.make.tilemap({ key: "map" });

    // 타일셋 이미지와 맵 연결
    const tileset = this.map.addTilesetImage("CommonTile", "CommonTile");

    if (!tileset) {
      console.error("Failed to load tileset");
      return;
    }

    // 모든 레이어 순회하며 렌더링 (배경, 장애물, 장식 등)
    this.map.layers.forEach((layer) => {
      this.map.createLayer(layer.name, tileset, 0, 0);
    });

    // 카메라 경계를 맵 크기에 맞춤 (플레이어가 맵 밖을 보지 못하게)
    this.cameras.main.setBounds(
      0,
      0,
      this.map.widthInPixels,
      this.map.heightInPixels
    );
  }

  /**
   * setupCollisions - 충돌 처리 설정
   * 플레이어가 게임기를 통과하지 못하도록 물리 충돌 추가
   */
  private setupCollisions(): void {
    const machines = this.machineManager.getMachines();
    const player = this.playerManager.getSprite();

    // 각 게임기마다 플레이어와의 충돌 설정
    machines.forEach((machine) => {
      if (machine.sprite.body) {
        // Phaser의 Arcade Physics로 충돌 감지
        this.physics.add.collider(player, machine.sprite);
      } else {
        // 물리 바디가 없으면 경고 (디버깅용)
        console.warn("Machine sprite has no physics body:", machine.game.name);
      }
    });
  }

  /**
   * setupInput - 키보드 입력 설정
   * E키를 상호작용 키로 등록
   */
  private setupInput(): void {
    this.interactKey = this.input.keyboard!.addKey("E");
  }

  /**
   * createUI - UI 요소 생성
   * 상호작용 안내 텍스트 생성 (화면에 고정)
   */
  private createUI(): void {
    this.interactPrompt = this.add
      .text(0, 0, "", {
        fontSize: "16px",
        backgroundColor: "#000",
        padding: { x: 10, y: 5 },
        color: "#ffff00", // 노란색
      })
      .setOrigin(0.5) // 중앙 정렬
      .setVisible(false) // 처음엔 숨김
      .setScrollFactor(0) // 카메라 이동에 영향 받지 않음 (화면 고정)
      .setDepth(1000); // 최상단 레이어
  }

  /**
   * update - 매 프레임마다 실행
   * 게임 로직 업데이트 (약 60fps)
   */
  update(): void {
    // 1. 플레이어 이동 처리
    this.playerManager.update();

    // 2. 근처 게임기 체크 및 하이라이트
    this.checkNearbyArcade();

    // 3. E키 입력 처리
    this.handleInteraction();

    // 4. UI 위치 업데이트
    this.updateUI();
  }

  /**
   * checkNearbyArcade - 근처 게임기 감지
   * 플레이어 위치를 기준으로 가장 가까운 게임기 찾기
   * - 범위 내: 하이라이트 + 안내 텍스트 표시
   * - 범위 밖: 하이라이트 제거 + 안내 텍스트 숨김
   */
  private checkNearbyArcade(): void {
    // 현재 플레이어 좌표
    const pos = this.playerManager.getPosition();

    // 가장 가까운 게임기 찾기 (INTERACTION_RADIUS 내)
    const nearest = this.machineManager.findNearestMachine(pos.x, pos.y);

    // 모든 게임기 하이라이트 초기화
    this.machineManager.clearAllHighlights();

    if (nearest) {
      // 게임기가 범위 내에 있으면
      this.nearbyGame = nearest.game; // 현재 게임 저장
      this.machineManager.highlightMachine(nearest); // 노란색 원 표시
      this.interactPrompt
        .setText(`Press E to play ${nearest.game.name}`) // 게임 이름 표시
        .setVisible(true); // 텍스트 보이기
    } else {
      // 범위 밖이면
      this.nearbyGame = null; // 게임 정보 초기화
      this.interactPrompt.setVisible(false); // 텍스트 숨기기
    }
  }

  /**
   * handleInteraction - E키 상호작용 처리
   * E키를 누르고 근처에 게임이 있으면 게임 실행
   */
  private handleInteraction(): void {
    // JustDown: 키가 막 눌린 순간만 true (연속 입력 방지)
    if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.nearbyGame) {
      this.launchGame(this.nearbyGame);
    }
  }

  /**
   * updateUI - UI 위치 업데이트
   * 안내 텍스트를 항상 화면 상단 중앙에 고정
   */
  private updateUI(): void {
    if (this.interactPrompt.visible) {
      // 카메라 중앙에 배치 (화면 이동해도 따라감)
      this.interactPrompt.setPosition(this.cameras.main.width / 2, 100);
    }
  }

  /**
   * launchGame - 게임 실행
   * 페이드 아웃 후 선택한 게임 씬으로 전환
   * @param game - 실행할 게임 설정 정보
   */
  private launchGame(game: GameConfig): void {
    console.log(`Launching: ${game.name}`);

    // 화면 페이드 아웃 (검은색, 300ms)
    this.cameras.main.fadeOut(this.FADE_DURATION, 0, 0, 0);

    // 페이드 아웃 완료 후 씬 전환
    this.cameras.main.once("camerafadeoutcomplete", () => {
      const pos = this.playerManager.getPosition();

      // 새 씬 시작 (data 전달: 돌아올 씬 & 플레이어 위치)
      this.scene.start(game.sceneKey, {
        returnScene: "MainScene", // 게임 종료 시 돌아올 씬
        playerPosition: pos, // 플레이어가 있던 위치 (선택사항)
      });
    });
  }

  /**
   * shutdown - 씬 종료 시 정리
   * 메모리 누수 방지를 위한 리소스 해제
   */
  shutdown(): void {
    // 게임기 매니저의 모든 오브젝트 제거
    this.machineManager.destroy();
  }
}
