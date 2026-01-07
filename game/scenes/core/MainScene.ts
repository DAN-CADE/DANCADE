// game/scenes/core/MainScene.ts
import { BaseGameScene } from "@/game/scenes/base/BaseGameScene";
import { MapManager } from "@/game/managers/global/MapManager";
import { AvatarManager } from "@/game/managers/global/AvatarManager";
import { ArcadeMachineManager } from "@/game/managers/global/ArcadeMachineManager";
import { InteractionManager } from "@/game/managers/global/InteractionManager";
import { AvatarDataManager } from "@/game/managers/global/AvatarDataManager";
import { LpcSpriteManager } from "@/game/managers/global/LpcSpriteManager";
import { UIManager } from "@/game/managers/global/UIManager";
import { LobbyNetworkManager } from "@/game/managers/global/LobbyNetworkManager";
import { supabase } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";
import type { LpcSprite } from "@/components/avatar/utils/LpcTypes";

// Window 확장 타입 정의
declare global {
  interface Window {
    __avatarDataManager?: AvatarDataManager;
    __avatarManager?: AvatarManager;
    __mainScene?: MainScene;
  }
}

export class MainScene extends BaseGameScene {
  private mapManager!: MapManager;
  private player!: AvatarManager;
  private avatarDataManager!: AvatarDataManager;
  private arcadeManager!: ArcadeMachineManager;
  private interactionManager!: InteractionManager;
  private lpcSpriteManager!: LpcSpriteManager;
  private lobbyNetwork!: LobbyNetworkManager;
  private readonly spawnPoint = { x: 960, y: 544 };

  // NPC 상호작용 관련
  public uiManager!: UIManager;
  private npcManagers: AvatarManager[] = [];
  private interactKey!: Phaser.Input.Keyboard.Key;

  // 실시간 랭킹
  private rankingSubscription: RealtimeChannel | null = null;

  constructor() {
    super({ key: "MainScene" });
  }

  // 무엇을 로드할 것인가
  protected loadAssets(): void {
    this.mapManager = new MapManager(this);
    this.mapManager.preloadMap();

    this.player = new AvatarManager(this);
    this.player.preloadAvatar();

    // LPC 아바타 매니저 초기화 (다른 플레이어용)
    this.lpcSpriteManager = new LpcSpriteManager();
    this.load.json("lpc_config", "/assets/lpc_assets.json");
    this.load.once(
      "filecomplete-json-lpc_config",
      (key: string, type: string, data: LpcSprite) => {
        if (data?.assets) {
          this.lpcSpriteManager.setLpcSprite(data);
        }
      }
    );

    // 네트워크 매니저 초기화 및 연결
    this.lobbyNetwork = new LobbyNetworkManager(
      this,
      this.lpcSpriteManager,
      {
        onNotice: (message) => this.uiManager?.showNotice(message),
      }
    );
    this.lobbyNetwork.connect();
  }

  // 씬 기본 설정
  protected setupScene(): void {
    this.cameras.main.setBackgroundColor("#000000");
  }

  // 어떤 도구(매니저)들을 사용할 것인가
  protected initManagers(): void {
    this.avatarDataManager = new AvatarDataManager(this);
    this.player = new AvatarManager(this);
    this.arcadeManager = new ArcadeMachineManager(this);
    this.interactionManager = new InteractionManager(this);
    this.lpcSpriteManager = new LpcSpriteManager();
    this.uiManager = new UIManager(this);

    // React에서 접근 가능하도록 노출
    window.__avatarDataManager = this.avatarDataManager;
    window.__avatarManager = this.player;
    window.__mainScene = this;
  }

  // 화면에 무엇을 그릴 것인가
  protected createGameObjects(): void {
    this.mapManager.createMap();
    this.uiManager.createGameUI();
    this.uiManager.createConsonantQuizUI();
    this.uiManager.createRankingBoardUI();

    const currentData = this.avatarDataManager.customization;
    this.player.createAvatar(
      this.spawnPoint.x,
      this.spawnPoint.y,
      currentData,
      false
    );

    const map = this.mapManager.getMap();
    if (map) this.arcadeManager.setGameObjects(map);

    this.mapManager.setupCollisions(this.player.getContainer());

    // 네트워크 게임 입장
    this.lobbyNetwork.joinGame(currentData, this.spawnPoint);

    // ------------------------------ 추후 지울 것
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-O", () => {
        console.log("오목 씬 테스트 이동");
        this.transitionTo("OmokScene");
      });
    }

    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-B", () => {
        this.transitionTo("StartScene");
      });
    }

    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-P", () => {
        this.transitionTo("PingPongScene");
      });
    }
    // ------------------------------ END 추후 지울 것

    // 인벤토리 HUD 토글 (I 키)
    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-I", () => {
        window.dispatchEvent(new CustomEvent("inventory-toggle"));
      });
    }

    // NPC 추가 및 상호작용 적용
    const merchant = new AvatarManager(this).createNPC(1545, 241, "MERCHANT");
    const villager = new AvatarManager(this).createNPC(1616, 592, "VILLAGER");
    const gambler = new AvatarManager(this).createNPC(1348, 592, "EVENT");

    this.npcManagers.push(merchant, villager, gambler);

    if (this.input.keyboard) {
      this.interactKey = this.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.E
      );
      this.interactKey.on("down", () => {
        this.player.tryInteract(this.npcManagers);
      });
    }

    this.events.on("shutdown", () => {
      this.lobbyNetwork.destroy();
    });

    this.events.on("destroy", () => {
      this.lobbyNetwork.destroy();
    });

    this.rankingSubscription = supabase
      .channel("realtime_rankings")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leaderboards" },
        (_payload) => {
          this.uiManager.showNotice("랭킹 게시판이 갱신되었습니다.");
        }
      )
      .subscribe();
  }

  update(): void {
    this.player.update();

    const playerPos = this.player.getPosition();
    const nearby = this.arcadeManager.update(playerPos);

    this.interactionManager.update(nearby);

    if (this.interactionManager.isInteracting() && nearby) {
      this.avatarDataManager.saveToStorage();
      this.transitionTo(nearby.game.sceneKey);
    }

    // 네트워크 위치/애니메이션 전송
    const playerAvatar = this.player.getContainer();
    if (playerAvatar) {
      const currentAnimation = playerAvatar.getAnimationState();
      this.lobbyNetwork.sendPositionUpdate(playerPos, currentAnimation);
    }

    this.npcManagers.forEach((npc) => npc.update());
  }

  // 메모리 누수 방지
  protected cleanupManagers(): void {
    this.avatarDataManager.destroy();
    this.player.destroy();
    this.arcadeManager.destroy();
    this.interactionManager.destroy();
    this.lobbyNetwork.destroy();

    if (this.rankingSubscription) {
      supabase.removeChannel(this.rankingSubscription);
      this.rankingSubscription = null;
    }
  }

  protected onGameReady(): void {
    console.log("✅ [메인씬] 로비 진입 - 채팅 표시");
    this.showChat();
  }

  wake(): void {
    console.log("✅ [메인씬] 씬 복귀 - 채팅 표시");
    this.showChat();
  }

  protected handleGameEnd(): void {}
  protected restartGame(): void {}
}
