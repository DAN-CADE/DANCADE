// game/managers/base/multiplayer/room/BaseRoomManager.ts

import { Socket } from "socket.io-client";
import { getCurrentUser } from "@/lib/utils/auth";
import { BaseRoomNetworkManager } from "@/game/managers/base/multiplayer/room/BaseRoomNetworkManager";
import { BaseRoomUIManager } from "@/game/managers/base/multiplayer/room/BaseRoomUIManager";
import type { RoomData } from "@/game/types/multiplayer/room.types";

/**
 * BaseRoomManager
 * - 모든 게임의 방 시스템 통합 관리
 * - Network + UI 매니저 조합
 * - 게임별 차이는 팩토리 메서드로 해결
 */
export abstract class BaseRoomManager {
  protected scene: Phaser.Scene;
  protected socket: Socket;
  protected networkManager: BaseRoomNetworkManager;
  protected uiManager: BaseRoomUIManager;
  private onGameStartCallback?: () => void;
  private onGameAbortedCallback?: (
    reason: string,
    leavingPlayer: string
  ) => void;
  private onErrorCallback?: (message: string) => void;

  constructor(scene: Phaser.Scene, socket: Socket) {
    this.scene = scene;
    this.socket = socket;
    this.networkManager = this.createNetworkManager(socket);
    this.uiManager = this.createUIManager(scene, socket);
    this.setupCallbacks();
    this.setupUIEventHandlers();
  }

  /**
   * 팩토리 메서드: 네트워크 매니저 생성 (게임별 구현)
   */
  protected abstract createNetworkManager(
    socket: Socket
  ): BaseRoomNetworkManager;

  /**
   * 팩토리 메서드: UI 매니저 생성 (게임별 구현)
   */
  protected abstract createUIManager(
    scene: Phaser.Scene,
    socket: Socket
  ): BaseRoomUIManager;

  // =====================================================================
  // 콜백 설정
  // =====================================================================

  private setupCallbacks(): void {
    // 방 목록 업데이트 시 자동 렌더링
    this.networkManager.setOnRoomListUpdate((rooms: RoomData[]) => {
      const currentScreen = this.uiManager.getCurrentScreen();

      // 대기실이나 메뉴 화면에서는 무시
      if (currentScreen === "waiting" || currentScreen === "menu") {
        return;
      }

      this.uiManager.renderRoomList(rooms);
    });

    // 방 생성 성공 → 대기실로 이동
    this.networkManager.setOnRoomCreated(
      (roomId: string, roomData: RoomData) => {
        this.uiManager.renderWaitingRoom(roomData);
      }
    );

    // 방 입장 성공 → 대기실로 이동
    this.networkManager.setOnJoinSuccess((roomData: RoomData) => {
      this.uiManager.renderWaitingRoom(roomData);
    });

    // 방 입장 실패
    this.networkManager.setOnJoinError((message: string) => {
      alert(message);
      this.requestRoomList(); // 방 목록 다시 불러오기
    });

    // 플레이어 입장/퇴장/준비 → 대기실 갱신
    this.networkManager.setOnPlayerJoined((roomData: RoomData) => {
      this.uiManager.renderWaitingRoom(roomData);
    });

    this.networkManager.setOnPlayerLeft((roomData: RoomData) => {
      this.uiManager.renderWaitingRoom(roomData);
    });

    // 내가 방을 나감 → 온라인 메뉴로 복귀
    this.networkManager.setOnLeftRoom(() => {
      this.uiManager.clearUI();
      // ⭐ room:exit 이벤트 발생 (온라인 메뉴 표시)
      this.scene.events.emit("room:exit");
    });

    this.networkManager.setOnPlayerReady((roomData: RoomData) => {
      this.uiManager.renderWaitingRoom(roomData);
    });

    // 방장 변경 → 대기실 갱신
    this.networkManager.setOnHostChanged((roomData: RoomData) => {
      this.uiManager.renderWaitingRoom(roomData);
    });

    // 게임 시작
    this.networkManager.setOnGameStart(() => {
      this.onGameStartCallback?.();
    });

    // 게임 중단
    this.networkManager.setOnGameAborted(
      (reason: string, leavingPlayer: string) => {
        this.onGameAbortedCallback?.(reason, leavingPlayer);
      }
    );

    // 에러
    this.networkManager.setOnError((message: string) => {
      console.error("에러:", message);
      this.onErrorCallback?.(message);
    });
  }

  // =====================================================================
  // UI 이벤트 핸들러
  // =====================================================================

  private setupUIEventHandlers(): void {
    // 방 생성 요청
    this.scene.events.on("roomUI:createRoomRequested", async () => {
      const input = this.uiManager.showCreateRoomPrompt();
      if (!input) return;

      const user = await getCurrentUser();
      if (!user) {
        alert("유저 정보를 불러올 수 없습니다.");
        return;
      }

      // ⭐ uuid 사용 (없으면 userId로 대체)
      const userUUID = user.uuid || user.userId;

      console.log("[BaseRoomManager] 방 생성 데이터:", {
        userId: user.userId,
        nickname: user.nickname,
        uuid: userUUID,
      });

      this.networkManager.createRoom(
        input.roomName,
        user.userId, // "qwer1"
        user.nickname, // "qwer1"
        userUUID, // ⭐ UUID 또는 userId
        input.isPrivate,
        input.password
      );
    });

    // 방 입장 요청
    this.scene.events.on(
      "roomUI:joinRoomRequested",
      async (roomId: string, isPrivate: boolean) => {
        let password: string | undefined;

        if (isPrivate) {
          const input = this.uiManager.showJoinPasswordPrompt();
          if (!input) return;
          password = input;
        }

        const user = await getCurrentUser();
        if (!user) {
          alert("유저 정보를 불러올 수 없습니다.");
          return;
        }

        // ⭐ uuid 사용 (없으면 userId로 대체)
        const userUUID = user.uuid || user.userId;

        this.networkManager.joinRoom(
          roomId,
          user.userId, // "qwer1"
          user.nickname, // "qwer1"
          userUUID, // ⭐ UUID 또는 userId
          password
        );
      }
    );

    this.scene.events.on("roomUI:toggleReadyRequested", () => {
      this.networkManager.toggleReady();
    });

    this.scene.events.on("roomUI:startGameRequested", () => {
      this.networkManager.startGame();
    });

    this.scene.events.on("roomUI:leaveRoomRequested", () => {
      this.networkManager.leaveRoom();
      this.requestRoomList();
    });

    this.scene.events.on("roomUI:backRequested", () => {
      this.uiManager.clearUI();
      this.scene.events.emit("room:exit");
    });
  }

  // =====================================================================
  // 공개 API
  // =====================================================================

  /**
   * 방 목록 요청
   */
  public requestRoomList(): void {
    this.networkManager.requestRoomList();
  }

  /**
   * 방 목록 렌더링 (안전한 처리)
   */
  public renderRoomList(): void {
    const rooms = this.networkManager.getRoomList();

    // 배열이 아니거나 undefined면 빈 배열로 처리
    if (!Array.isArray(rooms)) {
      this.uiManager.renderRoomList([]);
      return;
    }

    this.uiManager.renderRoomList(rooms);
  }

  /**
   * 방 나가기
   */
  public leaveRoom(): void {
    this.networkManager.leaveRoom();
  }

  /**
   * UI 정리
   */
  public clearUI(): void {
    this.uiManager.clearUI();
  }

  /**
   * 게임 시작 콜백 등록
   */
  public setOnGameStart(callback: () => void): void {
    this.onGameStartCallback = callback;
  }

  /**
   * 게임 중단 콜백 등록
   */
  public setOnGameAborted(
    callback: (reason: string, leavingPlayer: string) => void
  ): void {
    this.onGameAbortedCallback = callback;
  }

  /**
   * 에러 콜백 등록
   */
  public setOnError(callback: (message: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * 정리
   */
  public cleanup(): void {
    this.networkManager.cleanup();
    this.uiManager.clearUI();
    this.scene.events.off("roomUI:createRoomRequested");
    this.scene.events.off("roomUI:joinRoomRequested");
    this.scene.events.off("roomUI:toggleReadyRequested");
    this.scene.events.off("roomUI:startGameRequested");
    this.scene.events.off("roomUI:leaveRoomRequested");
    this.scene.events.off("roomUI:backRequested");
  }
}
