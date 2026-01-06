import { RoomData } from "@/game/types/multiplayer/room.types";

export type RoomListResponse = RoomData[] | { rooms: RoomData[] };

export interface RoomNetworkCallbacks {
  // 방 목록 관련
  onRoomListUpdate?: (rooms: RoomData[]) => void;

  // 방 생성/입장
  onRoomCreated?: (roomId: string, roomData: RoomData) => void;
  onJoinSuccess?: (roomData: RoomData) => void;
  onJoinError?: (message: string) => void;

  // 플레이어 상태 변화
  onPlayerJoined?: (roomData: RoomData) => void;
  onPlayerLeft?: (roomData: RoomData, username: string) => void;
  onLeftRoom?: (roomId: string) => void;
  onPlayerReady?: (roomData: RoomData) => void;

  // 방장/게임 상태
  onHostChanged?: (roomData: RoomData) => void;
  onGameStart?: () => void;
  onGameAborted?: (reason: string, leavingPlayer: string) => void;

  // 에러
  onError?: (message: string) => void;

  // 재대결
  onRematchRequested?: (requester: string) => void;
  onRematchAccepted?: (accepter: string) => void;
  onRematchDeclined?: (decliner: string) => void;
  onRematchStart?: () => void;
}

export interface GameNetworkCallbacks<TGameAction, TRole>
  extends RoomNetworkCallbacks {
  // 매칭 대기중
  onWaiting?: (message: string) => void;

  // 내 역할과 방 번호
  onRoleAssigned?: (role: TRole, roomId?: string) => void;

  // 상대방 액션
  onOpponentAction?: (action: TGameAction) => void;

  // 누군가 승리했을 때
  onWin?: (winner: TRole) => void;

  // 게임이 종료됐을 때
  onGameOver?: (winner: TRole) => void;
}
