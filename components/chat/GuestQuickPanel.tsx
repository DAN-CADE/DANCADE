// components/chat/GuestQuickPanel.tsx
// 게스트 사용자용 빠른 메시지 패널 컴포넌트

import styles from "./ChatFrame.module.css";

interface GuestQuickPanelProps {
  onQuickMessage: (message: string) => void;
  onRegisterClick: () => void;
}

const QUICK_MESSAGES = [
  { emoji: "👋", title: "인사" },
  { emoji: "👍", title: "좋아요" },
  { emoji: "❤️", title: "좋아합니다" },
  { emoji: "😂", title: "웃음" },
  { emoji: "🎉", title: "축하" },
];

/**
 * 게스트 사용자용 빠른 메시지 패널 컴포넌트
 */
export function GuestQuickPanel({
  onQuickMessage,
  onRegisterClick,
}: GuestQuickPanelProps) {
  return (
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
        <button onClick={onRegisterClick} className={styles.guestPromptBtn}>
          회원가입
        </button>
      </div>
      <div className={styles.guestQuickMessagePanel}>
        <div className={styles.quickMessageLabel}>퀵메시지</div>
        <div className={styles.guestQuickMessageContent}>
          {QUICK_MESSAGES.map(({ emoji, title }) => (
            <button
              key={emoji}
              className={styles.quickMessageBtn}
              onClick={() => onQuickMessage(emoji)}
              title={title}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
