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
  const [isHidden, setIsHidden] = useState(false); // 채팅창 숨기기
  const [isGuestUser, setIsGuestUser] = useState(false); // 게스트 여부
  const [isAnalyzing, setIsAnalyzing] = useState(false); // 분석 중 상태
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // =====================================================
  // 🎯 게임 씬 이벤트 리스너 추가
  // =====================================================
  useEffect(() => {
    const handleChatShow = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log("📢 [React] 채팅 표시:", customEvent.detail?.sceneName);
      setIsHidden(false); // 채팅 표시
    };

    const handleChatHide = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log("📢 [React] 채팅 숨김:", customEvent.detail?.sceneName);
      setIsHidden(true); // 채팅 숨김
    };

    // 이벤트 리스너 등록
    window.addEventListener("chat:show", handleChatShow);
    window.addEventListener("chat:hide", handleChatHide);

    // 클린업
    return () => {
      window.removeEventListener("chat:show", handleChatShow);
      window.removeEventListener("chat:hide", handleChatHide);
    };
  }, []);

  // ✅ Socket 로직 추가
  useEffect(() => {
    // localStorage에서 유저명 가져오기
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUsername(user.nickname || "익명");
        // 게스트 사용자 확인
        setIsGuestUser(user.isGuest === true);
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

  const handleSendMessage = async () => {
    if (isGuestUser) {
      alert("채팅은 회원가입 후 사용할 수 있습니다.");
      return;
    }

    if (!inputValue.trim()) {
      return;
    }

    // 분석 중 중복 전송 방지
    if (isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);

    try {
      // Perspective API로 메시지 분석
      const analyzeResponse = await fetch("/api/chat/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: inputValue }),
      });

      console.log("📤 분석 응답 상태:", analyzeResponse.status);

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        console.error("❌ 분석 실패 응답:", errorData);
        throw new Error(errorData.error || "분석 실패");
      }

      const analysisResult = await analyzeResponse.json();
      console.log("✅ 분석 결과:", analysisResult);

      if (analysisResult.isBlocked) {
        // 부적절한 내용 차단
        alert(analysisResult.reason || "부적절한 내용이 감지되었습니다.");
        setIsAnalyzing(false);
        return;
      }

      // ✅ Socket으로 전송
      socket.emit("lobby:chat", {
        username,
        message: inputValue,
      });

      setInputValue("");
    } catch (error) {
      console.error("메시지 분석 중 오류:", error);
      // 오류 발생 시에도 메시지 전송 (선택사항)
      socket.emit("lobby:chat", {
        username,
        message: inputValue,
      });
      setInputValue("");
    } finally {
      setIsAnalyzing(false);
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

  // ✅ 퀵메시지 전송
  const sendQuickMessage = (emoji: string) => {
    socket.emit("lobby:chat", {
      username,
      message: emoji,
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
    <>
      <div
        className={styles.chatFrame}
        style={{
          height: isFullHeight ? "calc(100vh - 50px)" : "415px",
          display: isHidden ? "none" : "flex",
        }}
      >
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>채팅</span>
          <div className={styles.headerButtons}>
            <button
              onClick={() => setIsFullHeight(!isFullHeight)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              title={isFullHeight ? "원래 크기" : "전체 확대"}
            >
              <img src="/assets/ui/chevrons-vertical.png" alt="expand" />
            </button>
            <button
              onClick={() => setIsHidden(true)}
              className={styles.hideBtn}
              title="채팅창 숨기기"
            >
              −
            </button>
          </div>
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
        {isGuestUser ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              padding: "10px",
            }}
          >
            <div className={styles.guestUpgradePrompt}>
              <span>전체 채팅 기능을 원하시나요?</span>
              <a href="/auth/login" className={styles.guestPromptBtn}>
                회원가입
              </a>
            </div>
            <div className={styles.guestQuickMessagePanel}>
              <div className={styles.quickMessageLabel}>퀵메시지</div>
              <div className={styles.guestQuickMessageContent}>
                <button
                  className={styles.quickMessageBtn}
                  onClick={() => sendQuickMessage("👋")}
                  title="인사"
                >
                  👋
                </button>
                <button
                  className={styles.quickMessageBtn}
                  onClick={() => sendQuickMessage("👍")}
                  title="좋아요"
                >
                  👍
                </button>
                <button
                  className={styles.quickMessageBtn}
                  onClick={() => sendQuickMessage("❤️")}
                  title="좋아합니다"
                >
                  ❤️
                </button>
                <button
                  className={styles.quickMessageBtn}
                  onClick={() => sendQuickMessage("😂")}
                  title="웃음"
                >
                  😂
                </button>
                <button
                  className={styles.quickMessageBtn}
                  onClick={() => sendQuickMessage("🎉")}
                  title="축하"
                >
                  🎉
                </button>
              </div>
            </div>
          </div>
        ) : (
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
                  {["😀", "😂", "😍", "🥰", "😎", "🤔", "😅", "😇"].map(
                    (emoji) => (
                      <button
                        key={emoji}
                        className={styles.emojiOption}
                        onClick={() => handleEmojiClick(emoji)}
                      >
                        {emoji}
                      </button>
                    )
                  )}
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
                disabled={isAnalyzing}
              />

              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                onClick={handleSendMessage}
                style={{
                  cursor: isAnalyzing ? "not-allowed" : "pointer",
                  opacity: isAnalyzing ? 0.5 : 1,
                }}
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
        )}
      </div>

      {/* 최소화된 채팅창 버튼 */}
      {isHidden && (
        <button
          className={styles.minimizedChatBtn}
          onClick={() => setIsHidden(false)}
          title="채팅창 표시"
        >
          💬
        </button>
      )}
    </>
  );
}
