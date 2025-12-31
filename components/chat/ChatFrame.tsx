"use client";

import React, { useState, useRef, useEffect } from "react";
import styles from "./ChatFrame.module.css";

interface Message {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
}

interface ChatFrameProps {
  onClose?: () => void;
}

export default function ChatFrame({ onClose }: ChatFrameProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isFullHeight, setIsFullHeight] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        author: "Player",
        content: inputValue,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
            <div
              className={styles.emptyIcon}
              onClick={() => {
                const newMessage: Message = {
                  id: Date.now().toString(),
                  author: "Player",
                  content: "👋",
                  timestamp: new Date(),
                };
                setMessages([...messages, newMessage]);
              }}
            >
              👋
            </div>
            <div className={styles.emptyText}>
              손을 눌러서 사람들에게 인사하세요!
            </div>
            <div className={styles.emojiContainer}></div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={styles.message}>
              <span className={styles.author}>{msg.author}</span>
              <span className={styles.content}>{msg.content}</span>
              <span className={styles.timestamp}>
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputContainer}>
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
