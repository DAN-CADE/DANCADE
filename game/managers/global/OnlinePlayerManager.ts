// game/managers/global/OnlinePlayerManager.ts
import { Socket } from "socket.io-client";
import io from "socket.io-client";
import LpcCharacter from "@/components/avatar/core/LpcCharacter";
import { LpcSpriteManager } from "@/game/managers/global/LpcSpriteManager";
import { UIManager } from "@/game/managers/global/UIManager";
import {
  AnimationData,
  JoinGameData,
  OnlinePlayer,
  PlayerMoveData,
} from "@/types/onlinePlayer";

export class OnlinePlayerManager {
  private socket!: Socket;
  private onlinePlayers = new Map<string, OnlinePlayer>();
  private playerAvatars = new Map<string, LpcCharacter>();
  private playerNameTags = new Map<string, Phaser.GameObjects.Text>();
  private lpcSpriteManager: LpcSpriteManager;

  // 위치 최적화
  private lastSentPosition = { x: 0, y: 0 };
  private readonly positionUpdateThreshold = 5;
  private lastSentAnimation: {
    direction: "up" | "down" | "left" | "right";
    isMoving: boolean;
  } | null = null;

  constructor(private scene: Phaser.Scene, private uiManager: UIManager) {
    this.lpcSpriteManager = new LpcSpriteManager();
  }

  // =====================================================================
  // 초기화
  // =====================================================================

  initialize(): void {
    this.setupSocket();
    this.loadLpcConfig();
  }

  private loadLpcConfig(): void {
    this.scene.load.json("lpc_config", "/assets/lpc_assets.json");
    this.scene.load.once(
      "filecomplete-json-lpc_config",
      (key: string, type: string, data: any) => {
        if (data?.assets) {
          this.lpcSpriteManager.setLpcSprite(data);
        }
      }
    );
  }

  private setupSocket(): void {
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

    this.setupSocketEvents();
  }

  private setupSocketEvents(): void {
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
    this.socket.on("player:animationUpdate", (data: AnimationData) => {
      if (data.socketId !== this.socket.id) {
        this.updatePlayerAnimation(
          data.socketId,
          data.direction,
          data.isMoving
        );
      }
    });

    // 이벤트 게임 생성 알림
    this.socket.on("createEventGame", (data: any) => {
      this.uiManager.showNotice(data.title);
    });

    // 공지사항 알림
    this.socket.on("createNotice", (data: any) => {
      this.uiManager.showNotice(data.content);
    });

    // 연결 끊김
    this.socket.on("disconnect", () => {
      console.log("❌ Socket.io 연결 끊김");
    });
  }

  // =====================================================================
  // 게임 참가
  // =====================================================================

  joinGame(data: JoinGameData): void {
    // localStorage에서 사용자 정보 가져오기
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
      gender: data.customization?.gender || "female",
      avatarId: "default",
      customization: data.customization,
      x: data.spawnPoint.x,
      y: data.spawnPoint.y,
    });
  }

  // =====================================================================
  // 플레이어 동기화
  // =====================================================================

  updatePosition(x: number, y: number): void {
    if (!this.socket || !this.socket.connected) return;

    const distance = Phaser.Math.Distance.Between(
      this.lastSentPosition.x,
      this.lastSentPosition.y,
      x,
      y
    );

    // 일정 거리 이상 이동했을 때만 전송
    if (distance >= this.positionUpdateThreshold) {
      this.socket.emit("player:move", { x, y });
      this.lastSentPosition = { x, y };
    }
  }

  updateAnimation(
    direction: "up" | "down" | "left" | "right",
    isMoving: boolean
  ): void {
    if (!this.socket || !this.socket.connected) return;

    // 애니메이션 상태가 변경되었을 때만 전송
    if (
      !this.lastSentAnimation ||
      this.lastSentAnimation.direction !== direction ||
      this.lastSentAnimation.isMoving !== isMoving
    ) {
      this.socket.emit("player:animation", { direction, isMoving });
      this.lastSentAnimation = { direction, isMoving };
    }
  }

  // =====================================================================
  // 플레이어 관리
  // =====================================================================

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

  private createPlayerSprite(player: OnlinePlayer): void {
    if (!this.scene.physics || !this.scene.add) {
      console.warn("메인 씬의 물리 시스템이 아직 준비되지 않았습니다.");
      return;
    }

    // LpcCharacter를 사용하여 실제 아바타 생성
    const playerAvatar = new LpcCharacter(
      this.scene,
      player.x,
      player.y,
      player.username,
      this.lpcSpriteManager
    );

    // 아바타 커스텀 정보가 있으면 적용
    if (player.customization) {
      playerAvatar.setCustomPart(player.customization);
    } else {
      // 기본 아바타 (여캐)
      playerAvatar.setDefaultPart("female");
    }

    // 깊이 설정
    playerAvatar.setDepth(50);

    // 닉네임 텍스트 생성
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

  private movePlayerSprite(socketId: string, x: number, y: number): void {
    const avatar = this.playerAvatars.get(socketId);
    const nameTag = this.playerNameTags.get(socketId);

    if (avatar) {
      // 부드러운 이동
      this.scene.tweens.add({
        targets: avatar,
        x,
        y,
        duration: 100,
        ease: "Linear",
      });
    }

    if (nameTag) {
      // 닉네임도 함께 이동
      this.scene.tweens.add({
        targets: nameTag,
        x,
        y: y - 40,
        duration: 100,
        ease: "Linear",
      });
    }
  }

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

  // =====================================================================
  // 정리
  // =====================================================================

  cleanup(): void {
    if (this.socket) {
      console.log("Cleanup: Socket.io 연결 해제");
      this.socket.disconnect();
      this.socket.removeAllListeners();
    }

    // 온라인 플레이어 아바타 및 닉네임 제거
    this.playerAvatars.forEach((avatar) => avatar.destroy());
    this.playerAvatars.clear();

    this.playerNameTags.forEach((nameTag) => nameTag.destroy());
    this.playerNameTags.clear();

    this.onlinePlayers.clear();

    // 위치 최적화 상태 초기화
    this.lastSentPosition = { x: 0, y: 0 };
    this.lastSentAnimation = null;
  }

  // =====================================================================
  // Getters
  // =====================================================================

  isConnected(): boolean {
    return this.socket && this.socket.connected;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  getLpcSpriteManager(): LpcSpriteManager {
    return this.lpcSpriteManager;
  }
}
