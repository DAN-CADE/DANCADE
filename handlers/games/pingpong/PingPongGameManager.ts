// /* eslint-disable @typescript-eslint/no-require-imports */
// // server/handlers/games/pingpong/PingPongGameManager.js

// const {
//   validateRoomExists,
//   validateIsHost,
// } = require("../../base/utils/Validation");

// /**
//  * 핑퐁 게임 시작/종료 관리
//  */
// class PingPongGameManager {
//   /**
//    * @param {Object} io - Socket.IO 서버 인스턴스
//    * @param {Object} socket - 클라이언트 소켓
//    * @param {Map} rooms - 방 목록
//    */
//   constructor(io, socket, rooms) {
//     this.io = io;
//     this.socket = socket;
//     this.rooms = rooms;
//     this.gamePrefix = "pingpong";
//   }

//   /**
//    * 이벤트 핸들러 등록
//    */
//   registerHandlers() {
//     this.socket.on("pingpong:startGame", (data) => this.handleStartGame(data));
//     this.socket.on("pingpong:hit", (data) => this.handleHit(data));
//     this.socket.on("pingpong:paddleMove", (data) =>
//       this.handlePaddleMove(data)
//     );
//     this.socket.on("pingpong:gameOver", (data) => this.handleGameOver(data));
//   }

//   /**
//    * 게임 시작 핸들러
//    * @param {Object} data
//    * @param {string} data.roomId - 방 ID
//    */
//   handleStartGame(data) {
//     const { roomId } = data;
//     const room = this.rooms.get(roomId);

//     // 검증
//     if (!validateRoomExists(room, this.socket, this.gamePrefix)) return;
//     if (!validateIsHost(room, this.socket.id, this.socket, this.gamePrefix))
//       return;

//     if (room.players.length < 2) {
//       this.socket.emit("pingpong:error", {
//         message: "2명이 모여야 시작할 수 있습니다.",
//       });
//       return;
//     }

//     const allReady = room.players.every(
//       (p) => p.isReady || p.socketId === room.hostSocketId
//     );

//     if (!allReady) {
//       this.socket.emit("pingpong:error", {
//         message: "모든 플레이어가 준비해야 합니다.",
//       });
//       return;
//     }

//     // 게임 시작
//     this.startGame(room);
//   }

//   /**
//    * 게임 시작 실행
//    * @param {Object} room - 방 객체
//    */
//   startGame(room) {
//     room.status = "playing";
//     console.log(`[핑퐁][게임시작] ${room.roomId}`);

//     // 역할 할당 (left/right)
//     this.assignRoles(room);

//     // 게임 시작 알림
//     this.io.to(room.roomId).emit("pingpong:gameStart", {
//       roomData: room,
//       roomId: room.roomId,
//     });

//     console.log(`[핑퐁][게임시작완료] ${room.roomId}`);
//   }

//   /**
//    * 플레이어에게 역할 할당 (left/right)
//    * @param {Object} room - 방 객체
//    */
//   assignRoles(room) {
//     room.players.forEach((p, index) => {
//       p.side = index === 0 ? "left" : "right"; // left(왼쪽) 또는 right(오른쪽)
//       p.role = index + 1; // 1 or 2 (클라이언트 호환)

//       this.io.to(p.socketId).emit("pingpong:assigned", {
//         side: p.side,
//         role: p.role,
//         roomId: room.roomId,
//       });

//       console.log(
//         `[핑퐁][역할할당] ${p.username} → ${
//           p.side === "left" ? "왼쪽(선공)" : "오른쪽(후공)"
//         }`
//       );
//     });
//   }

//   /**
//    * 공 치기 핸들러
//    * @param {Object} data - 공 데이터
//    */
//   handleHit(data) {
//     const {
//       roomId,
//       ballX,
//       ballY,
//       ballVelocityX,
//       ballVelocityY,
//       ballSpeed,
//       paddleY,
//     } = data;

//     // 필수 데이터 체크
//     if (!roomId || ballX === undefined || ballY === undefined) {
//       this.socket.emit("pingpong:error", { message: "잘못된 데이터" });
//       return;
//     }

//     const room = this.rooms.get(roomId);
//     if (!validateRoomExists(room, this.socket, this.gamePrefix)) return;

//     // 상대방에게 공 상태 전송
//     this.socket.to(roomId).emit("pingpong:hit", {
//       socketId: this.socket.id,
//       ballX,
//       ballY,
//       ballVelocityX,
//       ballVelocityY,
//       ballSpeed,
//       paddleY,
//       timestamp: Date.now(),
//     });
//   }

//   /**
//    * 패들 이동 핸들러
//    * @param {Object} data - 패들 데이터
//    */
//   handlePaddleMove(data) {
//     const { roomId, paddleY } = data;

//     if (!roomId || paddleY === undefined) {
//       return;
//     }

//     const room = this.rooms.get(roomId);
//     if (!room) return;

//     // 상대방에게 패들 위치 전송
//     this.socket.to(roomId).emit("pingpong:paddleMove", {
//       socketId: this.socket.id,
//       paddleY,
//       timestamp: Date.now(),
//     });
//   }

//   /**
//    * 게임 종료 핸들러
//    * @param {Object} data
//    * @param {string} data.roomId - 방 ID
//    * @param {string} data.winner - 승자 ("left" 또는 "right")
//    */
//   handleGameOver(data) {
//     const { roomId, winner } = data;

//     const room = this.rooms.get(roomId);
//     if (room) {
//       room.status = "finished";
//       this.io.to(roomId).emit("pingpong:gameOver", { winner, roomData: room });

//       // 빠른 매칭 방은 삭제
//       if (roomId === "pingpong_quick_match") {
//         this.rooms.delete(roomId);
//       }
//     }
//   }
// }

// module.exports = PingPongGameManager;

// @/server/handlers/games/pingpong/PingPongGameManager.ts

import { GameIO, GameSocket } from "@/types/server/server.types";
import {
  validateRoomExists,
  validateIsHost,
} from "../../base/utils/Validation";
import { ServerRoom } from "@/game/types/multiplayer/room.types";

// =====================================================================
/**
 * 이벤트 데이터 타입들
 */
// =====================================================================

interface StartGameData {
  roomId: string;
}

interface HitData {
  roomId: string;
  ballX: number;
  ballY: number;
  ballVelocityX: number;
  ballVelocityY: number;
  ballSpeed: number;
  paddleY: number;
}

interface PaddleMoveData {
  roomId: string;
  paddleY: number;
}

interface GameOverData {
  roomId: string;
  winner: "left" | "right";
}

// =====================================================================
/**
 * 핑퐁 게임 시작/종료 관리
 */
// =====================================================================
export class PingPongGameManager {
  private io: GameIO;
  private socket: GameSocket;
  private rooms: Map<string, ServerRoom>;
  private gamePrefix: string;

  /**
   * @param io - Socket.IO 서버 인스턴스
   * @param socket - 클라이언트 소켓
   * @param rooms - 방 목록
   */
  constructor(io: GameIO, socket: GameSocket, rooms: Map<string, ServerRoom>) {
    this.io = io;
    this.socket = socket;
    this.rooms = rooms;
    this.gamePrefix = "pingpong";
  }

  // =====================================================================
  /**
   * 이벤트 핸들러 등록
   */
  // =====================================================================
  registerHandlers(): void {
    this.socket.on("pingpong:startGame", (data: StartGameData) =>
      this.handleStartGame(data)
    );
    this.socket.on("pingpong:hit", (data: HitData) => this.handleHit(data));
    this.socket.on("pingpong:paddleMove", (data: PaddleMoveData) =>
      this.handlePaddleMove(data)
    );
    this.socket.on("pingpong:gameOver", (data: GameOverData) =>
      this.handleGameOver(data)
    );
  }

  // =====================================================================
  /**
   * 게임 시작 핸들러
   */
  // =====================================================================
  private handleStartGame(data: StartGameData): void {
    const { roomId } = data;
    const room = this.rooms.get(roomId) ?? null;

    // 검증
    if (!validateRoomExists(room, this.socket, this.gamePrefix)) return;
    if (!validateIsHost(room, this.socket.id, this.socket, this.gamePrefix))
      return;

    if (room.players.length < 2) {
      this.socket.emit("pingpong:error", {
        message: "2명이 모여야 시작할 수 있습니다.",
      });
      return;
    }

    const allReady = room.players.every(
      (p) => p.isReady || p.socketId === room.hostSocketId
    );

    if (!allReady) {
      this.socket.emit("pingpong:error", {
        message: "모든 플레이어가 준비해야 합니다.",
      });
      return;
    }

    // 게임 시작
    this.startGame(room);
  }

  // =====================================================================
  /**
   * 게임 시작 실행
   */
  // =====================================================================
  private startGame(room: ServerRoom): void {
    room.status = "playing";
    console.log(`[핑퐁][게임시작] ${room.roomId}`);

    // 역할 할당 (left/right)
    this.assignRoles(room);

    // 게임 시작 알림
    this.io.to(room.roomId).emit("pingpong:gameStart", {
      roomData: room,
      roomId: room.roomId,
    });

    console.log(`[핑퐁][게임시작완료] ${room.roomId}`);
  }

  // =====================================================================
  /**
   * 플레이어에게 역할 할당 (left/right)
   */
  // =====================================================================
  private assignRoles(room: ServerRoom): void {
    room.players.forEach((p, index) => {
      p.side = index === 0 ? "left" : "right"; // left(왼쪽) 또는 right(오른쪽)
      p.role = index + 1; // 1 or 2 (클라이언트 호환)

      this.io.to(p.socketId).emit("pingpong:assigned", {
        side: p.side,
        role: p.role,
        roomId: room.roomId,
      });

      console.log(
        `[핑퐁][역할할당] ${p.username} → ${
          p.side === "left" ? "왼쪽(선공)" : "오른쪽(후공)"
        }`
      );
    });
  }

  // =====================================================================
  /**
   * 공 치기 핸들러
   */
  // =====================================================================
  private handleHit(data: HitData): void {
    const {
      roomId,
      ballX,
      ballY,
      ballVelocityX,
      ballVelocityY,
      ballSpeed,
      paddleY,
    } = data;

    // 필수 데이터 체크
    if (!roomId || ballX === undefined || ballY === undefined) {
      this.socket.emit("pingpong:error", { message: "잘못된 데이터" });
      return;
    }

    const room = this.rooms.get(roomId) ?? null;
    if (!validateRoomExists(room, this.socket, this.gamePrefix)) return;

    // 상대방에게 공 상태 전송
    this.socket.to(roomId).emit("pingpong:hit", {
      socketId: this.socket.id,
      ballX,
      ballY,
      ballVelocityX,
      ballVelocityY,
      ballSpeed,
      paddleY,
      timestamp: Date.now(),
    });
  }

  // =====================================================================
  /**
   * 패들 이동 핸들러
   */
  // =====================================================================
  private handlePaddleMove(data: PaddleMoveData): void {
    const { roomId, paddleY } = data;

    if (!roomId || paddleY === undefined) {
      return;
    }

    const room = this.rooms.get(roomId);
    if (!room) return;

    // 상대방에게 패들 위치 전송
    this.socket.to(roomId).emit("pingpong:paddleMove", {
      socketId: this.socket.id,
      paddleY,
      timestamp: Date.now(),
    });
  }

  // =====================================================================
  /**
   * 게임 종료 핸들러
   */
  // =====================================================================
  private handleGameOver(data: GameOverData): void {
    const { roomId, winner } = data;

    const room = this.rooms.get(roomId);
    if (room) {
      room.status = "finished";
      this.io.to(roomId).emit("pingpong:gameOver", { winner, roomData: room });

      // 빠른 매칭 방은 삭제
      if (roomId === "pingpong_quick_match") {
        this.rooms.delete(roomId);
      }
    }
  }
}
