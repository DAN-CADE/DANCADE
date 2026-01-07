export interface OnlinePlayerData<TRole = number> {
  socketId: string;
  userId: string;
  username: string;
  isReady?: boolean;
  role?: TRole;
  // x?: number;
  // y?: number;
}

export interface RoomData {
  roomId: string;
  roomName: string;
  hostUsername: string;
  playerCount: number;
  maxPlayers: number;
  isPrivate: boolean;
  status: "waiting" | "playing";
  players?: OnlinePlayerData[];
  hostSocketId?: string;
}
