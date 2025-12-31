"use client";

import ChatFrame from "@/components/chat/ChatFrame";

export default function ChatPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#0f0f1e",
      }}
    >
      <ChatFrame />
    </div>
  );
}
