"use client";

import React, { useState, useRef, useEffect } from "react";
import { socket } from "@/lib/socket";
import styles from "./ChatFrame.module.css";

type MessageType = "chat" | "system" | "game" | "invite";

interface Message {
  id?: string;
  username: string; // author → username으로 변경
  message: string; // content → message로 변경
  timestamp: number; // Date → number로 변경
  messageType?: MessageType; // 메시지 타입 추가
}

interface ChatFrameProps {
  onClose?: () => void;
}

export default function ChatFrame({ onClose }: ChatFrameProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [username, setUsername] = useState("익명"); // 추가
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ✅ Socket 로직 추가
  useEffect(() => {
    // localStorage에서 유저명 가져오기
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const { nickname } = JSON.parse(userData);
        setUsername(nickname || "익명");
      } catch (error) {
        console.error("사용자 데이터 파싱 오류:", error);
        setUsername("익명");
      }
    }

    // 채팅 메시지 수신
    socket.on("lobby:chatMessage", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    // 클린업
    return () => {
      socket.off("lobby:chatMessage");
    };
  }, []);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      // ✅ Socket으로 전송
      socket.emit("lobby:chat", {
        username,
        message: inputValue,
      });

      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ✅ 인사 메시지도 socket으로 전송
  const handleWaveClick = () => {
    socket.emit("lobby:chat", {
      username,
      message: "👋",
    });
  };

  // ✅ 이모지 추가
  const handleEmojiClick = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // ✅ 외부 클릭 시 이모지 피커 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  return (
    <div
      className={styles.chatFrame}
      style={{ height: isFullHeight ? "calc(100vh - 50px)" : "415px" }}
    >
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>채팅</span>
        <button
          onClick={() => setIsFullHeight(!isFullHeight)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <img src="/assets/ui/chevrons-vertical.png" alt="expand" />
        </button>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        )}
      </div>
      {/* Messages Container */}

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} onClick={handleWaveClick}>
              👋
            </div>
            <div className={styles.emptyText}>
              손을 눌러서 사람들에게 인사하세요!
            </div>
            <div className={styles.emojiContainer}></div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            // 메시지 타입에 따른 className 결정
            let messageClass = styles.message; // 기본: 상대방 메시지

            if (msg.messageType === "system") {
              messageClass = styles.messageSystem;
            } else if (msg.messageType === "game") {
              messageClass = styles.messageGame;
            } else if (msg.username === username) {
              messageClass = styles.messageOwn; // 내 메시지
            }

            return (
              <div key={msg.id || idx} className={messageClass}>
                {msg.messageType !== "system" && (
                  <span className={styles.author}>{msg.username}</span>
                )}
                <span className={styles.content}>{msg.message}</span>
                <span className={styles.timestamp}>
                  {new Date(msg.timestamp).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      {/* Input Area */}
      <div className={styles.inputContainer}>
        {/* 이모지 버튼 */}
        <div className={styles.emojiPickerContainer} ref={emojiPickerRef}>
          <button
            className={styles.emojiPickerBtn}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="이모지 추가"
          >
            😊
          </button>
          {showEmojiPicker && (
            <div className={styles.emojiPanel}>
              {["😀", "😂", "😍", "🥰", "😎", "🤔", "😅", "😇"].map((emoji) => (
                <button
                  key={emoji}
                  className={styles.emojiOption}
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.inputWrapper}>
          <input
            type="text"
            className={styles.input}
            placeholder="바르고 고운말을 씁시다"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            onClick={handleSendMessage}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 20H8V18H10V20ZM20 16H8V18H6V16H4V14H6V12H8V14H18V4H20V16ZM10 12H8V10H10V12Z"
              fill="white"
              fillOpacity="0.7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
