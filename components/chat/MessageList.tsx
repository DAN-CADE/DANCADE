// components/chat/MessageList.tsx
// 채팅 메시지 리스트 컴포넌트

import { useRef, useEffect } from "react";
import styles from "./ChatFrame.module.css";
import type { ChatMessage } from "@/hooks/chat/useChatSocket";

interface MessageListProps {
  messages: ChatMessage[];
  currentUsername: string;
  onWaveClick: () => void;
}

/**
 * 채팅 메시지 리스트 컴포넌트
 */
export function MessageList({
  messages,
  currentUsername,
  onWaveClick,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 빈 상태
  if (messages.length === 0) {
    return (
      <div className={styles.messagesContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} onClick={onWaveClick}>
            👋
          </div>
          <div className={styles.emptyText}>
            손을 눌러서 사람들에게 인사하세요!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.messagesContainer}>
      {messages.map((msg, idx) => {
        const messageClass = getMessageClass(msg, currentUsername);

        return (
          <div key={msg.id || idx} className={messageClass}>
            {msg.messageType !== "system" && (
              <span className={styles.author}>{msg.username}</span>
            )}
            <span className={styles.content}>{msg.message}</span>
            <span className={styles.timestamp}>
              {formatTimestamp(msg.timestamp)}
            </span>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

/**
 * 메시지 타입에 따른 스타일 클래스 반환
 */
function getMessageClass(msg: ChatMessage, currentUsername: string): string {
  if (msg.messageType === "system") {
    return styles.messageSystem;
  }
  if (msg.messageType === "game") {
    return styles.messageGame;
  }
  if (msg.username === currentUsername) {
    return styles.messageOwn;
  }
  return styles.message;
}

/**
 * 타임스탬프 포맷팅
 */
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
