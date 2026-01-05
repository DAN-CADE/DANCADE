// lib/socket.ts
import { io } from "socket.io-client";

// Socket.io 클라이언트 인스턴스 생성
const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
export const socket = io(socketUrl, {
  autoConnect: false, // ✅ 기본은 연결 안 함 (멀티플레이 게임에서만 수동 연결)
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  withCredentials: true,
  transports: ["websocket"]
});

// 연결 상태 로깅 (개발 시 유용)
socket.on("connect", () => {
  console.log("✅ Socket 연결됨:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Socket 연결 끊김");
});

socket.on("connect_error", (error) => {
  console.error("🔴 Socket 연결 오류:", error);
});
