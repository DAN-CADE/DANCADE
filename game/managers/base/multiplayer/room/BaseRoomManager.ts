import { Socket } from "socket.io-client";
import {
  BaseRoomNetworkManager,
  BaseRoomUIManager,
} from "@/game/managers/base/multiplayer";
import { RoomData } from "@/game/types/multiplayer/room.types";
import { getCurrentUser } from "@/lib/utils/auth";
import { RoomUIEvent } from "@/game/types/common/common.network.types";

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
  private onRematchRequestedCallback?: (requester: string) => void;
  private onRematchAcceptedCallback?: (accepter: string) => void;
  private onRematchDeclinedCallback?: (decliner: string) => void;
  private onRematchStartCallback?: () => void;

  constructor(scene: Phaser.Scene, socket: Socket) {
    this.scene = scene;
    this.socket = socket;

    this.networkManager = this.createNetworkManager(socket);
    this.uiManager = this.createUIManager(scene, socket);

    this.setupCallbacks();
    this.setupUIEventHandlers();
  }

  // =====================================================================
  // 추상 메서드 (자식 클래스에서 구현)
  // =====================================================================

  protected abstract createNetworkManager(
    socket: Socket
  ): BaseRoomNetworkManager;
  protected abstract createUIManager(
    scene: Phaser.Scene,
    socket: Socket
  ): BaseRoomUIManager;

  // =====================================================================
  // 내부 유틸리티
  // =====================================================================

  /**
   * 공통 유저 정보 획득 및 UUID 처리 로직
   */
  private async getValidUser() {
    const user = await getCurrentUser();
    if (!user) {
      alert("유저 정보를 불러올 수 없습니다.");
      return null;
    }
    return {
      ...user,
      userUUID: user.uuid || user.userId,
    };
  }

  // =====================================================================
  // 네트워크 이벤트 -> UI 업데이트 연동
  // =====================================================================

  private setupCallbacks(): void {
    // 1. 방 목록 업데이트
    this.networkManager.setOnRoomListUpdate((rooms: RoomData[]) => {
      const currentScreen = this.uiManager.getCurrentScreen();
      if (currentScreen === "waiting" || currentScreen === "menu") return;
      this.uiManager.renderRoomList(rooms);
    });

    // 2. 대기실 상태 업데이트 (반복되는 콜백 등록 자동화)
    const updateWaitingRoom = (roomData: RoomData) =>
      this.uiManager.renderWaitingRoom(roomData);

    // 호스트 정보, 입장, 준비 상태 등이 바뀔 때 공통적으로 실행될 세터들
    const roomUpdateSetters = [
      this.networkManager.setOnJoinSuccess.bind(this.networkManager),
      this.networkManager.setOnPlayerJoined.bind(this.networkManager),
      this.networkManager.setOnPlayerLeft.bind(this.networkManager),
      this.networkManager.setOnPlayerReady.bind(this.networkManager),
      this.networkManager.setOnHostChanged.bind(this.networkManager),
    ];
    roomUpdateSetters.forEach((setter) => setter(updateWaitingRoom));

    // 방 생성 시에도 동일하게 업데이트
    this.networkManager.setOnRoomCreated((_, roomData) =>
      updateWaitingRoom(roomData)
    );

    // 3. 기타 상태 및 에러 콜백
    this.networkManager.setOnJoinError((message: string) => {
      alert(message);
      this.requestRoomList();
    });

    this.networkManager.setOnLeftRoom(() => {
      this.uiManager.cleanup();
      this.scene.events.emit("room:exit");
    });

    this.networkManager.setOnGameStart(() => this.onGameStartCallback?.());
    this.networkManager.setOnGameAborted((reason, player) =>
      this.onGameAbortedCallback?.(reason, player)
    );
    this.networkManager.setOnError((msg) => this.onErrorCallback?.(msg));

    // 재대결
    this.networkManager.setOnRematchRequested((requester) => {
      this.onRematchRequestedCallback?.(requester);
    });

    this.networkManager.setOnRematchAccepted((accepter) => {
      this.onRematchAcceptedCallback?.(accepter);
    });

    this.networkManager.setOnRematchDeclined((decliner) => {
      this.onRematchDeclinedCallback?.(decliner);
    });

    this.networkManager.setOnRematchStart(() => {
      this.onRematchStartCallback?.();
    });
  }

  // =====================================================================
  // UI 이벤트 -> 네트워크 요청 연동
  // =====================================================================

  private setupUIEventHandlers(): void {
    // [비동기 로직 핸들러] 별도 메서드로 분리하여 가독성 확보
    this.scene.events.on(
      RoomUIEvent.CREATE_ROOM,
      this.handleCreateRoom.bind(this)
    );
    this.scene.events.on(RoomUIEvent.JOIN_ROOM, this.handleJoinRoom.bind(this));

    // [단순 실행 핸들러 매핑]
    const actionMap: Record<string, () => void> = {
      [RoomUIEvent.TOGGLE_READY]: () => this.networkManager.toggleReady(),
      [RoomUIEvent.START_GAME]: () => this.networkManager.startGame(),
      [RoomUIEvent.LEAVE_ROOM]: () => {
        this.networkManager.leaveRoom();
        this.requestRoomList();
      },
      [RoomUIEvent.BACK]: () => {
        this.uiManager.cleanup();
        this.scene.events.emit("room:exit");
      },
    };

    // 매핑된 액션들을 일괄 등록
    Object.entries(actionMap).forEach(([event, action]) => {
      this.scene.events.on(event, action);
    });
  }

  private async handleCreateRoom() {
    const input = this.uiManager.showCreateRoomPrompt();
    if (!input) return;

    const user = await this.getValidUser();
    if (!user) return;

    this.networkManager.createRoom(
      input.roomName,
      user.userId,
      user.nickname,
      user.userUUID,
      input.isPrivate,
      input.password
    );
  }

  private async handleJoinRoom(roomId: string, isPrivate: boolean) {
    let password;
    if (isPrivate) {
      password = this.uiManager.showJoinPasswordPrompt();
      if (!password) return;
    }

    const user = await this.getValidUser();
    if (!user) return;

    this.networkManager.joinRoom(
      roomId,
      user.userId,
      user.nickname,
      user.userUUID,
      password
    );
  }

  // =====================================================================
  // 공개 메서드 및 자원 정리
  // =====================================================================

  public requestRoomList(): void {
    this.networkManager.requestRoomList();
  }

  public renderRoomList(): void {
    const rooms = this.networkManager.getRoomList();
    this.uiManager.renderRoomList(Array.isArray(rooms) ? rooms : []);
  }

  public leaveRoom(): void {
    this.networkManager.leaveRoom();
  }

  public setOnGameStart(cb: () => void) {
    this.onGameStartCallback = cb;
  }
  public setOnGameAborted(cb: (r: string, p: string) => void) {
    this.onGameAbortedCallback = cb;
  }
  public setOnError(cb: (m: string) => void) {
    this.onErrorCallback = cb;
  }

  public requestRematch(roomId?: string): void {
    this.networkManager.requestRematch(roomId);
  }

  public acceptRematch(roomId?: string): void {
    this.networkManager.acceptRematch(roomId);
  }

  public declineRematch(roomId?: string): void {
    this.networkManager.declineRematch(roomId);
  }

  public setOnRematchRequested(cb: (requester: string) => void): void {
    this.onRematchRequestedCallback = cb;
  }

  public setOnRematchAccepted(cb: (accepter: string) => void): void {
    this.onRematchAcceptedCallback = cb;
  }

  public setOnRematchDeclined(cb: (decliner: string) => void): void {
    this.onRematchDeclinedCallback = cb;
  }

  public setOnRematchStart(cb: () => void): void {
    this.onRematchStartCallback = cb;
  }

  public cleanup(): void {
    this.networkManager.clear?.();
    this.uiManager.cleanup?.();

    // [중요] RoomUIEvent에 정의된 모든 상수를 순회하며 리스너 자동 해제
    Object.values(RoomUIEvent).forEach((event) => {
      this.scene.events.off(event);
    });
  }
}
