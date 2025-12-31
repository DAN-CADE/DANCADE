// lib/socket.ts
import { io } from "socket.io-client";

// Socket.io 클라이언트 인스턴스 생성
export const socket = io("http://localhost:3001", {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
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
