// // handlers/games/omok/OmokGameManager.js

// const {
//   validateRoomExists,
//   validateIsHost,
// } = require("../../base/utils/Validation");
// const GameOverHandler = require("../../base/utils/GameOverHandler");

// // =====================================================================
// /**
//  * 오목 게임 시작/종료 관리
//  */
// // =====================================================================
// class OmokGameManager {
//   /**
//    * @param {Object} io - Socket.IO 서버 인스턴스
//    * @param {Object} socket - 클라이언트 소켓
//    * @param {Map} rooms - 방 목록
//    */
//   constructor(io, socket, rooms) {
//     this.io = io;
//     this.socket = socket;
//     this.rooms = rooms;
//     this.gamePrefix = "omok";
//     this.gameOverHandler = new GameOverHandler(io, rooms, "omok");
//   }

//   // =====================================================================
//   /**
//    * 이벤트 핸들러 등록
//    */
//   // =====================================================================

//   registerHandlers() {
//     this.socket.on("omok:startGame", (data) => this.handleStartGame(data));
//     this.socket.on("omok:move", (data) => this.handleMove(data));
//     this.socket.on("omok:gameOver", (data) => this.handleGameOver(data));
//     this.socket.on("omok:rematchStart", (data) => {
//       const { roomId } = data;
//       const room = this.rooms.get(roomId);
//       if (room) {
//         this.assignsides(room);
//       }
//     });
//   }

//   // =====================================================================
//   /**
//    * 게임 시작 핸들러
//    * @param {Object} data
//    * @param {string} data.roomId - 방 ID
//    */
//   // =====================================================================

//   handleStartGame(data) {
//     const { roomId } = data;
//     console.log(`[서버] 게임 시작 요청 수신: ${roomId}`);
//     const room = this.rooms.get(roomId);

//     // 검증
//     if (!validateRoomExists(room, this.socket, this.gamePrefix)) return;
//     if (!validateIsHost(room, this.socket.id, this.socket, this.gamePrefix))
//       return;

//     if (room.players.length < 2) {
//       this.socket.emit("omok:error", {
//         message: "2명이 모여야 시작할 수 있습니다.",
//       });
//       return;
//     }

//     const allReady = room.players.every(
//       (p) => p.isReady || p.socketId === room.hostSocketId
//     );

//     if (!allReady) {
//       this.socket.emit("omok:error", {
//         message: "모든 플레이어가 준비해야 합니다.",
//       });
//       return;
//     }

//     // 게임 시작
//     this.startGame(room);
//   }

//   // =====================================================================
//   /**
//    * 게임 시작 실행
//    * @param {Object} room - 방 객체
//    */
//   // =====================================================================

//   startGame(room) {
//     room.status = "playing";
//     console.log(`[오목][게임시작] ${room.roomId}`);

//     // 게임 시작 시점 기록
//     room.startTime = Date.now();

//     // 색깔 할당
//     this.assignsides(room);

//     // 게임 시작 알림
//     this.io.to(room.roomId).emit("omok:gameStart", {
//       roomData: room,
//       roomId: room.roomId,
//     });

//     console.log(`[오목][게임시작완료] ${room.roomId}`);
//   }

//   // =====================================================================
//   /**
//    * 플레이어에게 색깔 할당 (방장=흑돌, 입장자=백돌)
//    * @param {Object} room - 방 객체
//    */
//   // =====================================================================

//   assignsides(room) {
//     room.players.forEach((p) => {
//       const isHost = p.socketId === room.hostSocketId;
//       p.side = isHost ? 1 : 2; // 방장=흑돌(1), 입장자=백돌(2)

//       this.io.to(p.socketId).emit("omok:assigned", {
//         side: p.side,
//         roomId: room.roomId,
//       });

//       console.log(
//         `[오목][색깔할당] ${p.username} → ${
//           p.side === 1 ? "흑돌(선공)" : "백돌(후공)"
//         } ${isHost ? "(방장)" : ""}`
//       );
//     });
//   }

//   // =====================================================================
//   /**
//    * 수 전송 핸들러
//    * @param {Object} data
//    * @param {string} data.roomId - 방 ID
//    * @param {number} data.row - 행
//    * @param {number} data.col - 열
//    * @param {number} data.side - 돌 색깔
//    */
//   // =====================================================================

//   handleMove(data) {
//     const { roomId, row, col, side } = data;

//     // 필수 데이터 체크
//     if (
//       !roomId ||
//       row === undefined ||
//       col === undefined ||
//       side === undefined
//     ) {
//       this.socket.emit("omok:error", { message: "잘못된 수 데이터" });
//       return;
//     }

//     const room = this.rooms.get(roomId);
//     if (!validateRoomExists(room, this.socket, this.gamePrefix)) return;

//     // 상대방에게 수 전송
//     this.socket.to(roomId).emit("omok:moved", {
//       socketId: this.socket.id,
//       row,
//       col,
//       side,
//     });
//   }

//   // =====================================================================
//   /**
//    * 게임 종료 핸들러
//    * @param {Object} data
//    * @param {string} data.roomId - 방 ID
//    * @param {number} data.winner - 승자 (1: 흑, 2: 백)
//    */
//   // =====================================================================

//   async handleGameOver(data) {
//     const { roomId, winner } = data;

//     const scoreOptions = {
//       winnerScore: 20,
//       loserScore: -10,
//     };

//     console.log(
//       `[오목][게임종료] 방 ID: ${roomId}, 승자: ${
//         winner === 1 ? "흑(방장)" : "백(참가자)"
//       }, 점수: +${scoreOptions.winnerScore} / ${scoreOptions.loserScore}`
//     );

//     // 공통 핸들러로 위임
//     await this.gameOverHandler.handleGameOver(roomId, winner, scoreOptions);
//   }
// }

// module.exports = OmokGameManager;

// @/server/handlers/games/omok/OmokGameManager.ts

import {
  validateRoomExists,
  validateIsHost,
} from "../../base/utils/Validation";
import { GameOverHandler } from "../../base/utils/GameOverHandler";
import { GameIO, GameSocket } from "@/types/server/server.types";
import { ServerRoom } from "@/game/types/multiplayer/room.types";

// =====================================================================
/**
 * 이벤트 데이터 타입들
 */
// =====================================================================

interface StartGameData {
  roomId: string;
}

interface MoveData {
  roomId: string;
  row: number;
  col: number;
  side: number;
}

interface GameOverData {
  roomId: string;
  winner: number; // 1: 흑돌, 2: 백돌
}

interface RematchStartData {
  roomId: string;
}

// =====================================================================
/**
 * 오목 게임 시작/종료 관리
 */
// =====================================================================
export class OmokGameManager {
  private io: GameIO;
  private socket: GameSocket;
  private rooms: Map<string, ServerRoom>;
  private gamePrefix: string;
  private gameOverHandler: GameOverHandler;

  /**
   * @param io - Socket.IO 서버 인스턴스
   * @param socket - 클라이언트 소켓
   * @param rooms - 방 목록
   */
  constructor(io: GameIO, socket: GameSocket, rooms: Map<string, ServerRoom>) {
    this.io = io;
    this.socket = socket;
    this.rooms = rooms;
    this.gamePrefix = "omok";
    this.gameOverHandler = new GameOverHandler(io, rooms, "omok");
  }

  // =====================================================================
  /**
   * 이벤트 핸들러 등록
   */
  // =====================================================================
  registerHandlers(): void {
    this.socket.on("omok:startGame", (data: StartGameData) =>
      this.handleStartGame(data)
    );
    this.socket.on("omok:move", (data: MoveData) => this.handleMove(data));
    this.socket.on("omok:gameOver", (data: GameOverData) =>
      this.handleGameOver(data)
    );
    this.socket.on("omok:rematchStart", (data: RematchStartData) => {
      const { roomId } = data;
      const room = this.rooms.get(roomId) ?? null;
      if (room) {
        this.assignSides(room);
      }
    });
  }

  // =====================================================================
  /**
   * 게임 시작 핸들러
   */
  // =====================================================================
  private handleStartGame(data: StartGameData): void {
    const { roomId } = data;
    console.log(`[서버] 게임 시작 요청 수신: ${roomId}`);

    const room = this.rooms.get(roomId) ?? null;

    // 검증
    if (!validateRoomExists(room, this.socket, this.gamePrefix)) return;
    if (!validateIsHost(room, this.socket.id, this.socket, this.gamePrefix))
      return;

    if (room.players.length < 2) {
      this.socket.emit("omok:error", {
        message: "2명이 모여야 시작할 수 있습니다.",
      });
      return;
    }

    const allReady = room.players.every(
      (p) => p.isReady || p.socketId === room.hostSocketId
    );

    if (!allReady) {
      this.socket.emit("omok:error", {
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
    console.log(`[오목][게임시작] ${room.roomId}`);

    // 게임 시작 시점 기록
    room.startTime = Date.now();

    // 색깔 할당
    this.assignSides(room);

    // 게임 시작 알림
    this.io.to(room.roomId).emit("omok:gameStart", {
      roomData: room,
      roomId: room.roomId,
    });

    console.log(`[오목][게임시작완료] ${room.roomId}`);
  }

  // =====================================================================
  /**
   * 플레이어에게 색깔 할당 (방장=흑돌, 입장자=백돌)
   */
  // =====================================================================
  private assignSides(room: ServerRoom): void {
    room.players.forEach((p) => {
      const isHost = p.socketId === room.hostSocketId;
      p.side = isHost ? 1 : 2; // 방장=흑돌(1), 입장자=백돌(2)

      this.io.to(p.socketId).emit("omok:assigned", {
        side: p.side,
        roomId: room.roomId,
      });

      console.log(
        `[오목][색깔할당] ${p.username} → ${
          p.side === 1 ? "흑돌(선공)" : "백돌(후공)"
        } ${isHost ? "(방장)" : ""}`
      );
    });
  }

  // =====================================================================
  /**
   * 수 전송 핸들러
   */
  // =====================================================================
  private handleMove(data: MoveData): void {
    const { roomId, row, col, side } = data;

    // 필수 데이터 체크
    if (
      !roomId ||
      row === undefined ||
      col === undefined ||
      side === undefined
    ) {
      this.socket.emit("omok:error", { message: "잘못된 수 데이터" });
      return;
    }

    const room = this.rooms.get(roomId) ?? null;
    if (!validateRoomExists(room, this.socket, this.gamePrefix)) return;

    // 상대방에게 수 전송
    this.socket.to(roomId).emit("omok:moved", {
      socketId: this.socket.id,
      row,
      col,
      side,
    });
  }

  // =====================================================================
  /**
   * 게임 종료 핸들러
   */
  // =====================================================================
  private async handleGameOver(data: GameOverData): Promise<void> {
    const { roomId, winner } = data;

    const scoreOptions = {
      winnerScore: 20,
      loserScore: -10,
    };

    console.log(
      `[오목][게임종료] 방 ID: ${roomId}, 승자: ${
        winner === 1 ? "흑(방장)" : "백(참가자)"
      }, 점수: +${scoreOptions.winnerScore} / ${scoreOptions.loserScore}`
    );

    // 공통 핸들러로 위임
    await this.gameOverHandler.handleGameOver(roomId, winner, scoreOptions);
  }
}
