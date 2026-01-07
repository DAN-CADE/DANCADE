export const CommonEvent = {
  CONNECT: "connect",
  DISCONNECT: "disconnect",
  CONNECT_ERROR: "connect_error",
  RECONNECT: "reconnect",
  RECONNECT_ATTEMPT: "reconnect_attempt",

  JOIN_ROOM: "room:join",
  LEAVE_ROOM: "room:leave",
  ROOM_DATA: "room:data",

  CHAT_MESSAGE: "chat:message",
  CHAT_SYSTEM: "chat:system",

  ERROR: "system:error",
  NOTIFICATION: "system:notification",
  HEARTBEAT: "system:ping",
} as const;

export const RoomUIEvent = {
  CREATE_ROOM: "roomUI:createRoomRequested",
  JOIN_ROOM: "roomUI:joinRoomRequested",
  TOGGLE_READY: "roomUI:toggleReadyRequested",
  START_GAME: "roomUI:startGameRequested",
  LEAVE_ROOM: "roomUI:leaveRoomRequested",
  BACK: "roomUI:backRequested",
} as const;

export interface CommonEventPayloads {
  [CommonEvent.CONNECT]: void;
  [CommonEvent.DISCONNECT]: string;
  [CommonEvent.ERROR]: {
    code: string;
    message: string;
    fatal: boolean;
  };
  [CommonEvent.NOTIFICATION]: {
    type: "info" | "success" | "warning";
    message: string;
    duration?: number;
  };
  [CommonEvent.HEARTBEAT]: {
    timestamp: number;
  };
}

// 타입 추론을 위한 유틸리티 (선택 사항)
export type CommonEventPayload<T extends keyof CommonEventPayloads> =
  CommonEventPayloads[T];
