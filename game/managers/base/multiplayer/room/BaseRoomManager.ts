// game/managers/base/multiplayer/room/BaseRoomManager.ts

import { Socket } from "socket.io-client";
import { BaseRoomNetworkManager } from "@/game/managers/base/multiplayer/room/BaseRoomNetworkManager";
import { BaseRoomUIManager } from "@/game/managers/base/multiplayer/room/BaseRoomUIManager";

/**
 * BaseRoomManager
 * - 네트워크와 UI 매니저를 조합하는 조율자
 * - 팩토리 메서드 패턴: 게임별로 적절한 매니저 생성
 * - 오목의 OmokRoomManager를 기반으로 일반화
 */
export abstract class BaseRoomManager {
  protected scene: Phaser.Scene;
  protected networkManager: BaseRoomNetworkManager;
  protected uiManager: BaseRoomUIManager;

  // 외부 콜백들
  protected onGameStartCallback?: () => void;
  protected onErrorCallback?: (message: string) => void;
  protected onGameAbortedCallback?: (
    reason: string,
    leavingPlayer: string
  ) => void;

  constructor(scene: Phaser.Scene, socket: Socket) {
    this.scene = scene;

    // 게임별 매니저 생성 (팩토리 패턴)
    this.networkManager = this.createNetworkManager(socket);
    this.uiManager = this.createUIManager(scene, socket);

    // 바인딩 설정
    this.setupNetworkToUIBindings();
    this.setupUIToNetworkBindings();
  }

  // =====================================================================
  // 팩토리 메서드 (게임별 구현 필요)
  // =====================================================================

  /**
   * 게임별 네트워크 매니저 생성
   * @example
   * protected createNetworkManager(socket: Socket): BaseRoomNetworkManager {
   *   return new BaseRoomNetworkManager(socket, "omok");
   * }
   */
  protected abstract createNetworkManager(
    socket: Socket
  ): BaseRoomNetworkManager;

  /**
   * 게임별 UI 매니저 생성
   * @example
   * protected createUIManager(scene: Phaser.Scene, socket: Socket): BaseRoomUIManager {
   *   return new OmokRoomUIManager(scene, socket);
   * }
   */
  protected abstract createUIManager(
    scene: Phaser.Scene,
    socket: Socket
  ): BaseRoomUIManager;

  // =====================================================================
  // 네트워크 → UI 바인딩 (완전 공통)
  // =====================================================================

  private setupNetworkToUIBindings(): void {
    // 방 목록 업데이트 시 UI 갱신
    this.networkManager.setOnRoomListUpdate((rooms) => {
      if (this.uiManager.getCurrentScreen() === "list") {
        this.uiManager.renderRoomList(rooms);
      }
    });

    // 방 생성 성공 시 대기실 표시
    this.networkManager.setOnRoomCreated((roomId, roomData) => {
      this.uiManager.renderWaitingRoom(roomData);
    });

    // 방 입장 성공 시 대기실 표시
    this.networkManager.setOnJoinSuccess((roomData) => {
      this.uiManager.renderWaitingRoom(roomData);
    });

    // 방 입장 실패 시 알림
    this.networkManager.setOnJoinError((message) => {
      alert(message);
    });

    // 플레이어 입장/준비 시 대기실 갱신
    this.networkManager.setOnPlayerJoined((roomData) => {
      this.uiManager.renderWaitingRoom(roomData);
    });

    this.networkManager.setOnPlayerReady((roomData) => {
      this.uiManager.renderWaitingRoom(roomData);
    });

    // 플레이어 퇴장 시 처리
    this.networkManager.setOnPlayerLeft((roomData, username) => {
      this.onErrorCallback?.(`${username}님이 방을 나갔습니다.`);
      this.uiManager.renderWaitingRoom(roomData);
    });

    // 방장 변경 시 처리
    this.networkManager.setOnHostChanged((roomData) => {
      this.onErrorCallback?.("방장이 나가서 새로운 방장이 지정되었습니다.");
      this.uiManager.renderWaitingRoom(roomData);
    });

    // 게임 시작 시 UI 정리
    this.networkManager.setOnGameStart(() => {
      this.uiManager.clearUI();
      this.onGameStartCallback?.();
    });

    // 게임 중단 시 처리
    this.networkManager.setOnGameAborted((reason, leavingPlayer) => {
      this.onGameAbortedCallback?.(reason, leavingPlayer);
    });

    // 에러 처리
    this.networkManager.setOnError((message) => {
      this.onErrorCallback?.(message);
    });
  }

  // =====================================================================
  // UI → 네트워크 바인딩 (완전 공통)
  // =====================================================================

  private setupUIToNetworkBindings(): void {
    // UI 이벤트 리스너 등록
    this.scene.events.on("roomUI:joinRoomRequested", (roomId: string) => {
      const username = this.getUsername();
      this.networkManager.joinRoom(roomId, username);
    });

    this.scene.events.on("roomUI:toggleReadyRequested", () => {
      this.networkManager.toggleReady();
    });

    this.scene.events.on("roomUI:startGameRequested", () => {
      this.networkManager.startGame();
    });

    this.scene.events.on("roomUI:leaveRoomRequested", () => {
      this.networkManager.leaveRoom();
      this.scene.scene.restart();
    });

    this.scene.events.on("roomUI:backRequested", () => {
      this.scene.scene.restart();
    });
  }

  // =====================================================================
  // Public API (Scene에서 호출)
  // =====================================================================

  /**
   * 방 목록 요청 및 표시
   */
  public requestRoomList(): void {
    this.networkManager.requestRoomList();
  }

  /**
   * 방 목록 렌더링
   */
  public renderRoomList(): void {
    const rooms = this.networkManager.getRoomList();
    this.uiManager.renderRoomList(rooms);
  }

  /**
   * 방 생성 프롬프트 및 요청
   */
  public showCreateRoomPrompt(onCancel?: () => void): void {
    const roomName = this.uiManager.showCreateRoomPrompt();

    // 취소 시 콜백
    if (!roomName || roomName.trim() === "") {
      if (onCancel) {
        onCancel();
      }
      return;
    }

    const username = this.getUsername();
    this.networkManager.createRoom(roomName, username);
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

  // =====================================================================
  // 콜백 설정 (완전 공통)
  // =====================================================================

  public setOnGameStart(callback: () => void): void {
    this.onGameStartCallback = callback;
  }

  public setOnError(callback: (message: string) => void): void {
    this.onErrorCallback = callback;
  }

  public setOnGameAborted(
    callback: (reason: string, leavingPlayer: string) => void
  ): void {
    this.onGameAbortedCallback = callback;
  }

  // =====================================================================
  // 유틸리티
  // =====================================================================

  /**
   * 사용자 이름 가져오기 (게임별로 오버라이드 가능)
   */
  protected getUsername(): string {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData).nickname : "플레이어";
    } catch {
      return "플레이어";
    }
  }

  /**
   * 정리
   */
  public cleanup(): void {
    this.networkManager.cleanup();
    this.uiManager.clearUI();

    // UI 이벤트 리스너 제거
    this.scene.events.off("roomUI:joinRoomRequested");
    this.scene.events.off("roomUI:toggleReadyRequested");
    this.scene.events.off("roomUI:startGameRequested");
    this.scene.events.off("roomUI:leaveRoomRequested");
    this.scene.events.off("roomUI:backRequested");
  }
}
