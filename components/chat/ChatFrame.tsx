"use client";

// =================================================================
// ChatFrame.tsx - 채팅 프레임 컴포넌트 (리팩토링 버전)
// =================================================================
// 기존 475줄 → 리팩토링 후 약 175줄
// 추출된 모듈:
// - hooks/chat/useChatSocket.ts (소켓 연결 및 메시지 관리)
// - components/chat/MessageList.tsx (메시지 목록 렌더링)
// - components/chat/ChatInput.tsx (채팅 입력 영역)
// - components/chat/GuestQuickPanel.tsx (게스트 퀵메시지 패널)
// =================================================================

import { useState, useEffect } from "react";
import RegisterModal from "@/components/auth/RegisterModal";
import { useToast } from "@/components/common/ToastProvider";
import { useChatSocket } from "@/hooks/chat/useChatSocket";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { GuestQuickPanel } from "./GuestQuickPanel";
import styles from "./ChatFrame.module.css";

interface ChatFrameProps {
  onClose?: () => void;
}

export default function ChatFrame({ onClose }: ChatFrameProps) {
  const { showToast } = useToast();

  // 소켓 및 메시지 관리 훅
  const {
    messages,
    username,
    isGuestUser,
    isAnalyzing,
    sendMessage,
    sendQuickMessage,
    checkUserStatus,
  } = useChatSocket();

  // UI 상태
  const [isFullHeight, setIsFullHeight] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // 게임 씬 이벤트 리스너 (채팅창 표시/숨김)
  useEffect(() => {
    const handleChatShow = () => setIsHidden(false);
    const handleChatHide = () => setIsHidden(true);

    window.addEventListener("chat:show", handleChatShow);
    window.addEventListener("chat:hide", handleChatHide);

    return () => {
      window.removeEventListener("chat:show", handleChatShow);
      window.removeEventListener("chat:hide", handleChatHide);
    };
  }, []);

  // 메시지 전송 핸들러
  const handleSendMessage = async (message: string) => {
    if (isGuestUser) {
      alert("채팅은 회원가입 후 사용할 수 있습니다.");
      return;
    }
    await sendMessage(message);
  };

  // 인사 클릭 핸들러
  const handleWaveClick = () => {
    sendQuickMessage("👋");
  };

  // 회원가입 성공 핸들러
  const handleRegisterSuccess = () => {
    setShowRegisterModal(false);
    checkUserStatus();
    showToast({
      type: "success",
      message: "환영합니다! 회원가입이 완료되었습니다.",
    });
  };

  return (
    <>
      <div
        className={styles.chatFrame}
        style={{
          height: isFullHeight ? "calc(100vh - 50px)" : "415px",
          display: isHidden ? "none" : "flex",
        }}
      >
        {/* 헤더 */}
        <ChatHeader
          isFullHeight={isFullHeight}
          onToggleHeight={() => setIsFullHeight(!isFullHeight)}
          onHide={() => setIsHidden(true)}
          onClose={onClose}
        />

        {/* 메시지 목록 */}
        <MessageList
          messages={messages}
          currentUsername={username}
          onWaveClick={handleWaveClick}
        />

        {/* 입력 영역 */}
        {isGuestUser ? (
          <GuestQuickPanel
            onQuickMessage={sendQuickMessage}
            onRegisterClick={() => setShowRegisterModal(true)}
          />
        ) : (
          <ChatInput onSend={handleSendMessage} isAnalyzing={isAnalyzing} />
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

      {/* 회원가입 모달 */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={handleRegisterSuccess}
      />
    </>
  );
}

// =================================================================
// 내부 컴포넌트: 채팅 헤더
// =================================================================
interface ChatHeaderProps {
  isFullHeight: boolean;
  onToggleHeight: () => void;
  onHide: () => void;
  onClose?: () => void;
}

function ChatHeader({
  isFullHeight,
  onToggleHeight,
  onHide,
  onClose,
}: ChatHeaderProps) {
  return (
    <div className={styles.header}>
      <span className={styles.title}>채팅</span>
      <div className={styles.headerButtons}>
        <button
          onClick={onToggleHeight}
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
        <button onClick={onHide} className={styles.hideBtn} title="채팅창 숨기기">
          −
        </button>
      </div>
      {onClose && (
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      )}
    </div>
  );
}
