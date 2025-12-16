"use client";

import { useEffect, useState } from "react";
import RankingBoard from "@/components/RankingBoard";
import PhaserGame from "@/components/game/PhaserGame";
import { CharacterState } from "@/components/avatar/utils/LpcTypes";
import { STORAGE_KEY } from "@/constants/character";

export default function GamePage() {
  const [nickname, setNickname] = useState<string | null>(null);
  const [characterData, setCharacterData] = useState<CharacterState | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

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

    // 캐릭터 커스터마이징 로드
    const storedCharacter = localStorage.getItem(STORAGE_KEY);
    if (storedCharacter) {
      try {
        const character: CharacterState = JSON.parse(storedCharacter);
        setCharacterData(character);
      } catch (error) {
        console.error("캐릭터 데이터 파싱 오류:", error);
      }
    }

    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <main className="container mx-auto px-4">
        {nickname && (
          <div className="text-white text-right mb-4" suppressHydrationWarning>
            환영합니다, <strong>{nickname}</strong>님! 🎮
          </div>
        )}

        <div className="flex justify-center mb-8">
          <PhaserGame customization={characterData} />
        </div>

        <div className="flex justify-center">
          <RankingBoard gameType="brick-breaker" />
        </div>
      </main>
    </div>
  );
}
