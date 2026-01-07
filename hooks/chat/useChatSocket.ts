// hooks/chat/useChatSocket.ts
// 채팅 소켓 연결 및 메시지 관리 훅

import { useState, useEffect, useCallback } from "react";
import { socket } from "@/lib/socket";

export type MessageType = "chat" | "system" | "game" | "invite";

export interface ChatMessage {
  id?: string;
  username: string;
  message: string;
  timestamp: number;
  messageType?: MessageType;
}

interface UseChatSocketReturn {
  messages: ChatMessage[];
  username: string;
  isGuestUser: boolean;
  isAnalyzing: boolean;
  sendMessage: (message: string) => Promise<void>;
  sendQuickMessage: (emoji: string) => void;
  checkUserStatus: () => void;
}

/**
 * 채팅 소켓 연결 및 메시지 관리 훅
 */
export function useChatSocket(): UseChatSocketReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [username, setUsername] = useState("익명");
  const [isGuestUser, setIsGuestUser] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 유저 상태 확인
  const checkUserStatus = useCallback(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUsername(user.nickname || "익명");
        setIsGuestUser(user.isGuest === true);
      } catch (error) {
        console.error("사용자 데이터 파싱 오류:", error);
        setUsername("익명");
      }
    }
  }, []);

  // 소켓 연결 및 이벤트 설정
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    checkUserStatus();

    // 채팅 메시지 수신
    const handleMessage = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("lobby:chatMessage", handleMessage);

    return () => {
      socket.off("lobby:chatMessage", handleMessage);
    };
  }, [checkUserStatus]);

  // 메시지 전송 (분석 포함)
  const sendMessage = async (message: string): Promise<void> => {
    if (isGuestUser) {
      alert("채팅은 회원가입 후 사용할 수 있습니다.");
      return;
    }

    if (!message.trim() || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);

    try {
      // Perspective API로 메시지 분석
      const analyzeResponse = await fetch("/api/chat/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: message }),
      });

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || "분석 실패");
      }

      const analysisResult = await analyzeResponse.json();

      if (analysisResult.isBlocked) {
        alert(analysisResult.reason || "부적절한 내용이 감지되었습니다.");
        return;
      }

      // 소켓으로 전송
      socket.emit("lobby:chat", { username, message });
    } catch (error) {
      console.error("메시지 분석 중 오류:", error);
      // 오류 시에도 전송
      socket.emit("lobby:chat", { username, message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 퀵메시지 전송 (분석 없이)
  const sendQuickMessage = (emoji: string): void => {
    socket.emit("lobby:chat", { username, message: emoji });
  };

  return {
    messages,
    username,
    isGuestUser,
    isAnalyzing,
    sendMessage,
    sendQuickMessage,
    checkUserStatus,
  };
}
