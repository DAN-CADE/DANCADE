"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Inventory from "@/components/inventory/Inventory";

const PhaserGame = dynamic(() => import("@/components/game/PhaserGame"), {
  ssr: false,
});

export default function GamePage() {
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    // 클라이언트 사이드에서만 localStorage 접근
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const { nickname } = JSON.parse(userData);
        setNickname(nickname || "");
      } catch (error) {
        console.error("사용자 데이터 파싱 오류:", error);
        setNickname("");
      }
    } else {
      setNickname("");
    }

    // 게임 페이지에서 스크롤 비활성화
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      // 페이지 이동 시 스크롤 복구
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="min-h-screen overflow-hidden">
      <main className="container mx-auto px-4">
        {nickname && (
          <div
            className="text-white text-right mb-4 absolute top-10 z-10 right-10"
            suppressHydrationWarning
          >
            환영합니다, <strong>{nickname}</strong>님! 🎮
          </div>
        )}

        <div className="flex justify-center mb-8">
          <PhaserGame />
          {/* 인벤토리 컴포넌트 추가*/}
          <Inventory />
        </div>
      </main>
    </div>
  );
}
