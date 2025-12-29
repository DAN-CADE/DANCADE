// game/managers/base/multiplayer/room/BaseRoomUIManager.ts

import { Socket } from "socket.io-client";
import { ButtonFactory } from "@/utils/ButtonFactory";
import type {
  RoomData,
  RoomUIConfig,
} from "@/game/types/multiplayer/room.types";
import { OMOK_CONFIG } from "@/game/types/omok";

/**
 * BaseRoomUIManager
 * - 방 UI 렌더링의 공통 구조 제공
 * - 템플릿 메서드 패턴: 구조는 공통, 스타일은 게임별 커스터마이징
 * - 오목의 OmokRoomUIManager를 기반으로 템플릿화
 */
export abstract class BaseRoomUIManager {
  protected scene: Phaser.Scene;
  protected socket: Socket;
  protected config: RoomUIConfig;
  protected currentScreen: "menu" | "list" | "waiting" = "menu";
  protected readonly UI_DEPTH: number;

  constructor(scene: Phaser.Scene, socket: Socket, config: RoomUIConfig) {
    this.scene = scene;
    this.socket = socket;
    this.config = config;
    this.UI_DEPTH = 500; // 게임별로 오버라이드 가능
  }

  // =====================================================================
  // 방 목록 UI (구조 공통)
  // =====================================================================

  /**
   * 방 목록 렌더링 (공통 구조)
   */
  public renderRoomList(rooms: RoomData[]): void {
    this.clearUI();
    this.currentScreen = "list";

    const { width, height } = this.scene.scale;
    const centerX = width / 2;

    // 배경 패널
    this.createPanel(
      centerX,
      height / 2,
      this.config.layout.panelWidth,
      this.config.layout.panelHeight
    );

    // 타이틀
    this.createText(centerX, 120, "ROOM LIST", this.config.textStyle.title);

    // 방 목록
    if (rooms.length === 0) {
      this.createText(centerX, height / 2, "생성된 방이 없습니다.", {
        color: this.config.colors.subText,
      });
    } else {
      this.renderRoomCards(rooms, centerX);
    }

    // 뒤로가기 버튼
    this.createBackButton(centerX, height - 120);
  }

  /**
   * 방 카드 렌더링 (게임별 커스터마이징 가능)
   */
  protected renderRoomCards(rooms: RoomData[], centerX: number): void {
    const { roomCardHeight, roomCardSpacing } = this.config.layout;
    let yPos = 220;

    rooms.forEach((room) => {
      const roomInfo = `${room.roomName}\n방장: ${room.hostUsername} | ${room.playerCount}/${room.maxPlayers}명`;

      const btn = ButtonFactory.createButton(
        this.scene,
        centerX,
        yPos,
        roomInfo,
        () => this.emit("joinRoomRequested", room.roomId),
        {
          width: this.config.layout.roomCardWidth,
          height: roomCardHeight,
          color: this.config.colors.cardInactive,
          textColor: "#ffffff",
          fontSize: "14px",
        }
      );
      btn.setDepth(this.UI_DEPTH);
      yPos += roomCardSpacing;
    });
  }

  // =====================================================================
  // 대기실 UI (구조 공통)
  // =====================================================================

  /**
   * 대기실 렌더링 (공통 구조)
   */
  public renderWaitingRoom(roomData: RoomData): void {
    this.clearUI();
    this.currentScreen = "waiting";

    const { width, height } = this.scene.scale;
    const centerX = width / 2;

    // 배경 패널
    this.createPanel(
      centerX,
      height / 2,
      this.config.layout.panelWidth,
      750 // 대기실은 높이 고정
    );

    // 방 제목
    this.createText(
      centerX,
      120,
      roomData.roomName,
      this.config.textStyle.title
    );

    // 플레이어 목록
    this.renderPlayerCards(roomData, centerX);

    // 버튼들
    this.renderWaitingRoomButtons(roomData, centerX, height);
  }

  /**
   * 플레이어 카드 렌더링 (게임별 커스터마이징 가능)
   */
  protected renderPlayerCards(roomData: RoomData, centerX: number): void {
    const { playerCardHeight, playerCardSpacing } = this.config.layout;
    let yPos = 250;

    roomData.players?.forEach((player) => {
      const isHost = player.socketId === roomData.hostSocketId;
      const isMe = player.socketId === this.socket.id;

      // 플레이어 카드 배경
      this.scene.add
        .rectangle(
          centerX,
          yPos,
          500,
          playerCardHeight,
          isMe ? this.config.colors.cardActive : this.config.colors.cardInactive
        )
        .setDepth(this.UI_DEPTH);

      // 이름
      this.createText(centerX - 220, yPos, player.username, {
        fontSize: "24px",
      }).setOrigin(0, 0.5);

      // 상태
      const isReady = player.isReady;
      let statusText = isReady ? "READY" : "WAITING";
      if (isHost) statusText = "HOST 👑";

      this.createText(centerX + 220, yPos, statusText, {
        color: isReady ? this.config.colors.gold : "#ffffff",
      }).setOrigin(1, 0.5);

      yPos += playerCardSpacing;
    });
  }

  /**
   * 대기실 버튼 렌더링 (게임별 커스터마이징 가능)
   */
  protected renderWaitingRoomButtons(
    roomData: RoomData,
    centerX: number,
    height: number
  ): void {
    const isHost = this.socket.id === roomData.hostSocketId;
    const btnY = height - 180;

    if (isHost) {
      // 모든 플레이어가 준비되었는지 확인
      const allPlayersReady = this.checkAllPlayersReady(roomData);

      // 호스트: 게임 시작 버튼
      const startBtn = ButtonFactory.createButton(
        this.scene,
        centerX,
        btnY,
        allPlayersReady ? "START GAME" : "WAITING FOR PLAYERS...",
        () => {
          // 모두 준비된 경우에만 게임 시작
          if (allPlayersReady) {
            this.emit("startGameRequested");
          }
        },
        {
          width: 350,
          color: OMOK_CONFIG.COLORS.PRIMARY,
          textColor: "#ffffff",
        }
      );

      // 준비 안 된 경우 반투명 처리
      if (!allPlayersReady) {
        startBtn.setAlpha(0.5);
      }

      startBtn.setDepth(this.UI_DEPTH);
    } else {
      // 일반 플레이어: 준비 버튼
      const me = roomData.players?.find((p) => p.socketId === this.socket.id);
      const myReadyStatus = me?.isReady;

      const readyBtn = ButtonFactory.createButton(
        this.scene,
        centerX,
        btnY,
        myReadyStatus ? "CANCEL READY" : "READY",
        () => this.emit("toggleReadyRequested"),
        {
          width: 350,
          color: myReadyStatus
            ? this.config.colors.danger
            : this.config.colors.primary,
          textColor: "#ffffff",
        }
      );
      readyBtn.setDepth(this.UI_DEPTH);
    }

    // 나가기 버튼
    const exitBtn = ButtonFactory.createButton(
      this.scene,
      centerX,
      height - 90,
      "EXIT",
      () => this.emit("leaveRoomRequested"),
      { width: 200, height: 60, color: 0x333333, textColor: "#ffffff" }
    );
    exitBtn.setDepth(this.UI_DEPTH);
  }

  /**
   * 모든 플레이어가 준비되었는지 확인
   */
  private checkAllPlayersReady(roomData: RoomData): boolean {
    // 플레이어가 없으면 false
    if (!roomData.players || roomData.players.length === 0) {
      return false;
    }

    // 호스트를 제외한 플레이어들
    const nonHostPlayers = roomData.players.filter(
      (p) => p.socketId !== roomData.hostSocketId
    );

    // 호스트 혼자면 false (상대가 없음)
    if (nonHostPlayers.length === 0) {
      return false;
    }

    // 모든 비호스트 플레이어가 준비 상태인지 확인
    return nonHostPlayers.every((p) => (p as any).isReady === true);
  }

  // =====================================================================
  // 방 생성 프롬프트 (공통)
  // =====================================================================

  /**
   * 방 생성 프롬프트 표시
   */
  public showCreateRoomPrompt(): string | null {
    const roomName = prompt("방 제목을 입력하세요");
    if (!roomName || roomName.trim() === "") {
      return null;
    }
    return roomName;
  }

  // =====================================================================
  // 공통 UI 요소
  // =====================================================================

  /**
   * 패널 생성
   */
  protected createPanel(
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    this.scene.add
      .rectangle(x, y, width, height, this.config.colors.panel, 0.95)
      .setStrokeStyle(4, 0xffffff, 0.1)
      .setDepth(this.UI_DEPTH - 1);
  }

  /**
   * 텍스트 생성
   */
  protected createText(
    x: number,
    y: number,
    text: string,
    style: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {}
  ): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, text, {
        ...this.config.textStyle.normal,
        ...style,
      })
      .setOrigin(0.5)
      .setDepth(this.UI_DEPTH);
  }

  /**
   * 뒤로가기 버튼 생성
   */
  protected createBackButton(x: number, y: number): void {
    const backBtn = ButtonFactory.createButton(
      this.scene,
      x,
      y,
      "BACK",
      () => this.emit("backRequested"),
      {
        width: 200,
        height: 60,
        color: this.config.colors.danger,
        textColor: "#ffffff",
      }
    );
    backBtn.setDepth(this.UI_DEPTH);
  }

  // =====================================================================
  // 유틸리티
  // =====================================================================

  /**
   * UI 전체 정리
   */
  public clearUI(): void {
    const targets = this.scene.children.list.filter(
      (child: any) => child.depth >= this.UI_DEPTH - 1
    );
    targets.forEach((child) => child.destroy());
  }

  /**
   * 현재 화면 상태 반환
   */
  public getCurrentScreen(): string {
    return this.currentScreen;
  }

  /**
   * 이벤트 발생 (Scene에서 처리)
   */
  protected emit(eventName: string, ...args: any[]): void {
    this.scene.events.emit(`roomUI:${eventName}`, ...args);
  }
}
