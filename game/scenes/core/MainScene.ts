// game/scenes/core/MainScene.ts
import { BaseGameScene } from "@/game/scenes/base/BaseGameScene";
import { MapManager } from "@/game/managers/global/MapManager";
import { AvatarManager } from "@/game/managers/global/AvatarManager";
import { ArcadeMachineManager } from "@/game/managers/global/ArcadeMachineManager";
import { InteractionManager } from "@/game/managers/global/InteractionManager";
import { AvatarDataManager } from "@/game/managers/global/AvatarDataManager";
import io, { Socket } from "socket.io-client";

// 플레이어 데이터 타입
interface OnlinePlayer {
  socketId: string;
  userId: string;
  username: string;
  avatarId: string;
  x: number;
  y: number;
  joinedAt: number;
}

// 플레이어 이동 데이터 타입
interface PlayerMoveData {
  socketId: string;
  x: number;
  y: number;
}

export class MainScene extends BaseGameScene {
  private mapManager!: MapManager;
  private avatarManager!: AvatarManager;
  private avatarDataManager!: AvatarDataManager;
  private arcadeManager!: ArcadeMachineManager;
  private interactionManager!: InteractionManager;
  private readonly spawnPoint = { x: 960, y: 544 };

  // Socket.io 관련
  private socket!: Socket;
  private onlinePlayers = new Map<string, OnlinePlayer>(); // socketId -> player data
  private playerSprites = new Map<string, Phaser.GameObjects.Container>(); // socketId -> sprite

  // 위치 최적화 (변경이 있을 때만 전송)
  private lastSentPosition = { x: 0, y: 0 };
  private readonly positionUpdateThreshold = 5; // 5픽셀 이상 이동했을 때만 전송

  constructor() {
    super({ key: "MainScene" });
  }

  // 무엇을 로드할 것인가
  protected loadAssets(): void {
    this.mapManager = new MapManager(this);
    this.mapManager.preloadMap();

    this.avatarManager = new AvatarManager(this);
    this.avatarManager.preloadAvatar();

    this.setupSocketIO();
  }

  // Socket.io 연결 및 이벤트 설정
  private setupSocketIO(): void {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    this.socket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // 연결 성공
    this.socket.on("connect", () => {
      console.log("✅ Socket.io 연결 성공:", this.socket.id);
      this.joinGame();
    });

    // 플레이어 목록 업데이트
    this.socket.on("players:update", (players: OnlinePlayer[]) => {
      console.log("👥 플레이어 업데이트:", players.length);
      this.updateOnlinePlayers(players);
    });

    // 다른 플레이어 위치 업데이트
    this.socket.on("player:moved", (data: PlayerMoveData) => {
      if (data.socketId !== this.socket.id) {
        this.movePlayerSprite(data.socketId, data.x, data.y);
      }
    });

    // 연결 끊김
    this.socket.on("disconnect", () => {
      console.log("❌ Socket.io 연결 끊김");
    });
  }

  // 게임에 입장
  private joinGame(): void {
    const customization = this.avatarDataManager.customization;
    const userId = "guest-" + Math.random().toString(36).substr(2, 9); // 테스트용

    this.socket.emit("player:join", {
      userId,
      username: customization?.gender || "Player",
      avatarId: "default",
      x: this.spawnPoint.x,
      y: this.spawnPoint.y,
    });
  }

  // 씬 기본 설정
  protected setupScene(): void {
    this.cameras.main.setBackgroundColor("#000000");
  }

  // 어떤 도구(매니저)들을 사용할 것인가
  protected initManagers(): void {
    this.avatarDataManager = new AvatarDataManager(this);
    this.avatarManager = new AvatarManager(this);
    this.arcadeManager = new ArcadeMachineManager(this);
    this.interactionManager = new InteractionManager(this);
  }

  // 화면에 무엇을 그릴 것인가
  protected createGameObjects(): void {
    this.mapManager.createMap();

    const currentData = this.avatarDataManager.customization;
    this.avatarManager.createAvatar(
      this.spawnPoint.x,
      this.spawnPoint.y,
      currentData
    );

    const map = this.mapManager.getMap();
    if (map) this.arcadeManager.setGameObjects(map);

    this.mapManager.setupCollisions(this.avatarManager.getContainer());
  }

  update(): void {
    // 플레이어의 현재 좌표를 가져오고
    this.avatarManager.update();

    const playerPos = this.avatarManager.getPosition();
    const nearby = this.arcadeManager.update(playerPos);

    // 좌표를 던져서 근처에 게임기가 있는지 확인
    this.interactionManager.update(nearby);

    // 그 결과를 interactionManager에 전달하여 "E를 눌러라"는 메시지 띄울지 결정
    if (this.interactionManager.isInteracting() && nearby) {
      // 씬 전환 전, 혹시 모르니 현재 상태 저장
      this.avatarDataManager.saveToStorage();
      // 상호작용 성공 시 transitionTo로 부드럽게 게임 전환
      this.transitionTo(nearby.sceneKey);
    }

    // 서버에 위치 전송 (변경이 있을 때만)
    if (this.socket && this.socket.connected) {
      const distance = Phaser.Math.Distance.Between(
        this.lastSentPosition.x,
        this.lastSentPosition.y,
        playerPos.x,
        playerPos.y
      );

      // positionUpdateThreshold 이상 이동했을 때만 전송
      if (distance >= this.positionUpdateThreshold) {
        this.socket.emit("player:move", {
          x: playerPos.x,
          y: playerPos.y,
        });
        this.lastSentPosition = { x: playerPos.x, y: playerPos.y };
      }
    }
  }

  // 온라인 플레이어 업데이트
  private updateOnlinePlayers(players: OnlinePlayer[]): void {
    const mySocketId = this.socket.id;

    // 새로운 플레이어 추가 또는 기존 플레이어 업데이트
    players.forEach((player) => {
      if (player.socketId === mySocketId) return; // 자신 제외

      const existing = this.onlinePlayers.get(player.socketId);
      this.onlinePlayers.set(player.socketId, player);

      if (!existing) {
        // 새로운 플레이어 - 스프라이트 생성
        this.createPlayerSprite(player);
      }
    });

    // 더 이상 없는 플레이어 제거
    this.onlinePlayers.forEach((player, socketId) => {
      const exists = players.some(
        (p) => p.socketId === socketId && p.socketId !== mySocketId
      );
      if (!exists) {
        this.removePlayerSprite(socketId);
        this.onlinePlayers.delete(socketId);
      }
    });
  }

  // 플레이어 스프라이트 생성
  private createPlayerSprite(player: OnlinePlayer): void {
    const container = this.add.container(player.x, player.y);

    // 간단한 원 모양으로 표현 (아바타 대신)
    const circle = this.add.circle(0, 0, 16, 0xff0000);
    container.add(circle);

    // 닉네임 텍스트
    const nameText = this.add
      .text(0, -24, player.username, {
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5);
    container.add(nameText);

    // 깊이 설정 (플레이어가 보이도록)
    container.setDepth(100);

    this.playerSprites.set(player.socketId, container);
  }

  // 플레이어 스프라이트 이동
  private movePlayerSprite(socketId: string, x: number, y: number): void {
    const sprite = this.playerSprites.get(socketId);
    if (sprite) {
      // 부드러운 이동
      this.tweens.add({
        targets: sprite,
        x,
        y,
        duration: 100, // 0.1초
        ease: "Linear",
      });
    }
  }

  // 플레이어 스프라이트 제거
  private removePlayerSprite(socketId: string): void {
    const sprite = this.playerSprites.get(socketId);
    if (sprite) {
      sprite.destroy();
      this.playerSprites.delete(socketId);
    }
  }

  // 메모리 누수 방지
  protected cleanupManagers(): void {
    // shutdown 시 호출될 정리 로직
    this.avatarDataManager.destroy();
    this.avatarManager.destroy();
    this.arcadeManager.destroy();
    this.interactionManager.destroy();

    // Socket.io 연결 종료
    if (this.socket) {
      this.socket.disconnect();
    }

    // 온라인 플레이어 스프라이트 제거
    this.playerSprites.forEach((sprite) => sprite.destroy());
    this.playerSprites.clear();
    this.onlinePlayers.clear();
  }

  // 게임 종료 처리 구현 필수.
  protected handleGameEnd(): void {}
  protected restartGame(): void {}
}
