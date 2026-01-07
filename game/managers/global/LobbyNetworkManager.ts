// game/managers/global/LobbyNetworkManager.ts
import io, { Socket } from "socket.io-client";
import LpcCharacter from "@/components/avatar/core/LpcCharacter";
import { LpcSpriteManager } from "@/game/managers/global/LpcSpriteManager";
import type { CharacterState } from "@/components/avatar/utils/LpcTypes";

// 플레이어 데이터 타입
export interface OnlinePlayer {
  socketId: string;
  userId: string;
  username: string;
  gender?: string;
  avatarId: string;
  x: number;
  y: number;
  joinedAt: number;
  customization?: CharacterState;
}

// 플레이어 이동 데이터 타입
interface PlayerMoveData {
  socketId: string;
  x: number;
  y: number;
}

// 이벤트 게임 데이터 타입
interface EventGameData {
  title: string;
}

// 공지 데이터 타입
interface NoticeData {
  content: string;
}

// 콜백 타입
interface LobbyNetworkCallbacks {
  onNotice?: (message: string) => void;
}

export class LobbyNetworkManager {
  private scene: Phaser.Scene;
  private socket!: Socket;
  private lpcSpriteManager: LpcSpriteManager;
  private callbacks: LobbyNetworkCallbacks;

  // 온라인 플레이어 관리
  private onlinePlayers = new Map<string, OnlinePlayer>();
  private playerAvatars = new Map<string, LpcCharacter>();
  private playerNameTags = new Map<string, Phaser.GameObjects.Text>();

  // 위치 최적화
  private lastSentPosition = { x: 0, y: 0 };
  private readonly positionUpdateThreshold = 5;
  private lastSentAnimation: {
    direction: "up" | "down" | "left" | "right";
    isMoving: boolean;
  } | null = null;

  constructor(
    scene: Phaser.Scene,
    lpcSpriteManager: LpcSpriteManager,
    callbacks: LobbyNetworkCallbacks = {}
  ) {
    this.scene = scene;
    this.lpcSpriteManager = lpcSpriteManager;
    this.callbacks = callbacks;
  }

  // Socket.io 연결 및 이벤트 설정
  connect(): void {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    this.socket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      withCredentials: true,
      transports: ["websocket"],
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 연결 성공
    this.socket.on("connect", () => {
      console.log("✅ Socket.io 연결 성공:", this.socket.id);
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

    // 다른 플레이어 애니메이션 상태 업데이트
    this.socket.on(
      "player:animationUpdate",
      (data: {
        socketId: string;
        direction: "up" | "down" | "left" | "right";
        isMoving: boolean;
      }) => {
        if (data.socketId !== this.socket.id) {
          this.updatePlayerAnimation(
            data.socketId,
            data.direction,
            data.isMoving
          );
        }
      }
    );

    this.socket.on("createEventGame", (data: EventGameData) => {
      this.callbacks.onNotice?.(data.title);
    });

    this.socket.on("createNotice", (data: NoticeData) => {
      this.callbacks.onNotice?.(data.content);
    });

    // 연결 끊김
    this.socket.on("disconnect", () => {
      console.log("❌ Socket.io 연결 끊김");
    });
  }

  // 게임에 입장
  joinGame(
    customization: CharacterState | null,
    spawnPoint: { x: number; y: number }
  ): void {
    let nickname = "Player";
    let userId = "guest-" + Math.random().toString(36).substr(2, 9);

    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        nickname = parsedUser.nickname || "Player";
        userId = parsedUser.userId || userId;
      }
    } catch (error) {
      console.error("사용자 정보 로드 오류:", error);
    }

    this.socket.emit("player:join", {
      userId,
      username: nickname,
      gender: customization?.gender || "female",
      avatarId: "default",
      customization: customization,
      x: spawnPoint.x,
      y: spawnPoint.y,
    });
  }

  // 위치 및 애니메이션 전송 (update에서 호출)
  sendPositionUpdate(
    position: { x: number; y: number },
    animation: {
      direction: "up" | "down" | "left" | "right";
      isMoving: boolean;
    }
  ): void {
    if (!this.socket || !this.socket.connected) return;

    // 위치 전송 (threshold 이상 이동했을 때만)
    const distance = Phaser.Math.Distance.Between(
      this.lastSentPosition.x,
      this.lastSentPosition.y,
      position.x,
      position.y
    );

    if (distance >= this.positionUpdateThreshold) {
      this.socket.emit("player:move", {
        x: position.x,
        y: position.y,
      });
      this.lastSentPosition = { x: position.x, y: position.y };
    }

    // 애니메이션 상태 전송 (변경이 있을 때만)
    if (
      !this.lastSentAnimation ||
      this.lastSentAnimation.direction !== animation.direction ||
      this.lastSentAnimation.isMoving !== animation.isMoving
    ) {
      this.socket.emit("player:animation", {
        direction: animation.direction,
        isMoving: animation.isMoving,
      });
      this.lastSentAnimation = { ...animation };
    }
  }

  // 온라인 플레이어 업데이트
  private updateOnlinePlayers(players: OnlinePlayer[]): void {
    const mySocketId = this.socket.id;

    players.forEach((player) => {
      if (player.socketId === mySocketId) return;

      const existing = this.onlinePlayers.get(player.socketId);
      this.onlinePlayers.set(player.socketId, player);

      if (!existing) {
        this.createPlayerSprite(player);
      }
    });

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
    if (!this.scene.physics || !this.scene.add) {
      console.warn("씬의 물리 시스템이 아직 준비되지 않았습니다.");
      return;
    }

    const playerAvatar = new LpcCharacter(
      this.scene,
      player.x,
      player.y,
      player.username,
      this.lpcSpriteManager
    );

    if (player.customization) {
      playerAvatar.setCustomPart(player.customization);
    } else {
      playerAvatar.setDefaultPart("female");
    }

    playerAvatar.setDepth(50);

    const nameText = this.scene.add
      .text(player.x, player.y - 40, player.username, {
        fontSize: "14px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(51);

    this.playerAvatars.set(player.socketId, playerAvatar);
    this.playerNameTags.set(player.socketId, nameText);
  }

  // 플레이어 스프라이트 이동
  private movePlayerSprite(socketId: string, x: number, y: number): void {
    const avatar = this.playerAvatars.get(socketId);
    const nameTag = this.playerNameTags.get(socketId);

    if (avatar) {
      this.scene.tweens.add({
        targets: avatar,
        x,
        y,
        duration: 100,
        ease: "Linear",
      });
    }

    if (nameTag) {
      this.scene.tweens.add({
        targets: nameTag,
        x,
        y: y - 40,
        duration: 100,
        ease: "Linear",
      });
    }
  }

  // 플레이어 애니메이션 상태 업데이트
  private updatePlayerAnimation(
    socketId: string,
    direction: "up" | "down" | "left" | "right",
    isMoving: boolean
  ): void {
    const avatar = this.playerAvatars.get(socketId);
    if (avatar) {
      avatar.setAnimationState(direction, isMoving);
    }
  }

  // 플레이어 스프라이트 제거
  private removePlayerSprite(socketId: string): void {
    const avatar = this.playerAvatars.get(socketId);
    const nameTag = this.playerNameTags.get(socketId);

    if (avatar) {
      avatar.destroy();
      this.playerAvatars.delete(socketId);
    }

    if (nameTag) {
      nameTag.destroy();
      this.playerNameTags.delete(socketId);
    }
  }

  // 소켓 연결 상태 확인
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // 정리
  destroy(): void {
    if (this.socket) {
      console.log("Cleanup: Socket.io 연결 해제");
      this.socket.disconnect();
      this.socket.removeAllListeners();
    }

    this.playerAvatars.forEach((avatar) => avatar.destroy());
    this.playerAvatars.clear();

    this.playerNameTags.forEach((nameTag) => nameTag.destroy());
    this.playerNameTags.clear();

    this.onlinePlayers.clear();
  }
}
