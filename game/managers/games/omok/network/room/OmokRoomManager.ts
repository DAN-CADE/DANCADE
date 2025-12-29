// // game/managers/games/Omok/OmokRoomManager.ts
// import { Socket } from "socket.io-client";
// import { OmokRoomNetworkManager } from "@/game/managers/games/omok/network/room/OmokRoomNetworkManager";
// import { OmokRoomUIManager } from "@/game/managers/games/omok/network/room/OmokRoomUIManager";

// /**
//  * OmokRoomManager
//  * - 네트워크 매니저와 UI 매니저를 조합
//  * - Scene과 네트워크/UI 간의 중재자 역할
//  * - 실제 로직은 각 매니저에 위임
//  */
// export class OmokRoomManager {
//   private scene: Phaser.Scene;
//   private networkManager: OmokRoomNetworkManager;
//   private uiManager: OmokRoomUIManager;

//   // 외부 콜백들
//   private onGameStartCallback?: () => void;
//   private onErrorCallback?: (message: string) => void;
//   private onGameAbortedCallback?: (
//     reason: string,
//     leavingPlayer: string
//   ) => void;

//   constructor(scene: Phaser.Scene, socket: Socket) {
//     this.scene = scene;

//     // 매니저 생성
//     this.networkManager = new OmokRoomNetworkManager(socket);
//     this.uiManager = new OmokRoomUIManager(scene, socket);

//     // 네트워크 → UI 연결
//     this.setupNetworkToUIBindings();

//     // UI → 네트워크 연결
//     this.setupUIToNetworkBindings();
//   }

//   // =====================================================================
//   // 네트워크 → UI 바인딩
//   // =====================================================================

//   private setupNetworkToUIBindings(): void {
//     // 방 목록 업데이트 시 UI 갱신
//     this.networkManager.setOnRoomListUpdate((rooms) => {
//       if (this.uiManager.getCurrentScreen() === "list") {
//         this.uiManager.renderRoomList(rooms);
//       }
//     });

//     // 방 생성 성공 시 대기실 표시
//     this.networkManager.setOnRoomCreated((roomId, roomData) => {
//       this.uiManager.renderWaitingRoom(roomData);
//     });

//     // 방 입장 성공 시 대기실 표시
//     this.networkManager.setOnJoinSuccess((roomData) => {
//       this.uiManager.renderWaitingRoom(roomData);
//     });

//     // 방 입장 실패 시 알림
//     this.networkManager.setOnJoinError((message) => {
//       alert(message);
//     });

//     // 플레이어 입장/준비 시 대기실 갱신
//     this.networkManager.setOnPlayerJoined((roomData) => {
//       this.uiManager.renderWaitingRoom(roomData);
//     });

//     this.networkManager.setOnPlayerReady((roomData) => {
//       this.uiManager.renderWaitingRoom(roomData);
//     });

//     // 플레이어 퇴장 시 처리
//     this.networkManager.setOnPlayerLeft((roomData, username) => {
//       this.onErrorCallback?.(`${username}님이 방을 나갔습니다.`);
//       this.uiManager.renderWaitingRoom(roomData);
//     });

//     // 방장 변경 시 처리
//     this.networkManager.setOnHostChanged((roomData) => {
//       this.onErrorCallback?.("방장이 나가서 새로운 방장이 지정되었습니다.");
//       this.uiManager.renderWaitingRoom(roomData);
//     });

//     // 게임 시작 시 UI 정리
//     this.networkManager.setOnGameStart(() => {
//       this.uiManager.clearUI();
//       this.onGameStartCallback?.();
//     });

//     // 게임 중단 시 처리
//     this.networkManager.setOnGameAborted((reason, leavingPlayer) => {
//       this.onGameAbortedCallback?.(reason, leavingPlayer);
//     });

//     // 에러 처리
//     this.networkManager.setOnError((message) => {
//       this.onErrorCallback?.(message);
//     });
//   }

//   // =====================================================================
//   // UI → 네트워크 바인딩
//   // =====================================================================

//   private setupUIToNetworkBindings(): void {
//     // UI 이벤트 리스너 등록
//     this.scene.events.on("omokRoomUI:joinRoomRequested", (roomId: string) => {
//       const username = this.getUsername();
//       this.networkManager.joinRoom(roomId, username);
//     });

//     this.scene.events.on("omokRoomUI:toggleReadyRequested", () => {
//       this.networkManager.toggleReady();
//     });

//     this.scene.events.on("omokRoomUI:startGameRequested", () => {
//       this.networkManager.startGame();
//     });

//     this.scene.events.on("omokRoomUI:leaveRoomRequested", () => {
//       this.networkManager.leaveRoom();
//       this.scene.scene.restart();
//     });

//     this.scene.events.on("omokRoomUI:backRequested", () => {
//       this.scene.scene.restart();
//     });
//   }

//   // =====================================================================
//   // Public API (Scene에서 호출)
//   // =====================================================================

//   /**
//    * 방 목록 요청 및 표시
//    */
//   public requestRoomList(): void {
//     this.networkManager.requestRoomList();
//   }

//   /**
//    * 방 목록 렌더링
//    */
//   public renderRoomList(): void {
//     const rooms = this.networkManager.getRoomList();
//     this.uiManager.renderRoomList(rooms);
//   }

//   /**
//    * 방 생성 프롬프트 및 요청
//    */
//   public showCreateRoomPrompt(onCancel?: () => void): void {
//     const roomName = this.uiManager.showCreateRoomPrompt();

//     // 취소 시 콜백
//     if (!roomName || roomName.trim() === "") {
//       if (onCancel) {
//         onCancel();
//       }
//       return;
//     }

//     const username = this.getUsername();
//     this.networkManager.createRoom(roomName, username);
//   }

//   /**
//    * 방 나가기
//    */
//   public leaveRoom(): void {
//     this.networkManager.leaveRoom();
//   }

//   /**
//    * UI 정리
//    */
//   public clearUI(): void {
//     this.uiManager.clearUI();
//   }

//   // =====================================================================
//   // 콜백 설정
//   // =====================================================================

//   public setOnGameStart(callback: () => void): void {
//     this.onGameStartCallback = callback;
//   }

//   public setOnError(callback: (message: string) => void): void {
//     this.onErrorCallback = callback;
//   }

//   public setOnGameAborted(
//     callback: (reason: string, leavingPlayer: string) => void
//   ): void {
//     this.onGameAbortedCallback = callback;
//   }

//   // =====================================================================
//   // 유틸리티
//   // =====================================================================

//   /**
//    * 사용자 이름 가져오기
//    */
//   private getUsername(): string {
//     try {
//       const userData = localStorage.getItem("user");
//       return userData ? JSON.parse(userData).nickname : "플레이어";
//     } catch {
//       return "플레이어";
//     }
//   }

//   /**
//    * 정리
//    */
//   public cleanup(): void {
//     this.networkManager.cleanup();
//     this.uiManager.clearUI();

//     // UI 이벤트 리스너 제거
//     this.scene.events.off("omokRoomUI:joinRoomRequested");
//     this.scene.events.off("omokRoomUI:toggleReadyRequested");
//     this.scene.events.off("omokRoomUI:startGameRequested");
//     this.scene.events.off("omokRoomUI:leaveRoomRequested");
//     this.scene.events.off("omokRoomUI:backRequested");
//   }
// }

// game/managers/games/omok/network/room/OmokRoomManager.ts

import { Socket } from "socket.io-client";
import {
  BaseRoomManager,
  BaseRoomNetworkManager,
  BaseRoomUIManager,
} from "@/game/managers/base/multiplayer";
import { OmokRoomNetworkManager } from "./OmokRoomNetworkManager";
import { OmokRoomUIManager } from "./OmokRoomUIManager";

/**
 * OmokRoomManager
 * - BaseRoomManager를 상속받아 오목 전용 매니저 조합
 * - 팩토리 메서드만 구현하면 모든 로직은 Base에서 상속받음
 */
export class OmokRoomManager extends BaseRoomManager {
  /**
   * 오목 네트워크 매니저 생성
   */
  protected createNetworkManager(socket: Socket): BaseRoomNetworkManager {
    return new OmokRoomNetworkManager(socket);
  }

  /**
   * 오목 UI 매니저 생성
   */
  protected createUIManager(
    scene: Phaser.Scene,
    socket: Socket
  ): BaseRoomUIManager {
    return new OmokRoomUIManager(scene, socket);
  }

  // 모든 로직은 BaseRoomManager에서 상속받음
  // - requestRoomList()
  // - renderRoomList()
  // - showCreateRoomPrompt()
  // - leaveRoom()
  // - setOnGameStart()
  // - setOnError()
  // - cleanup()
}
