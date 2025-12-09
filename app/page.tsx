import Link from "next/link";
import RankingBoard from "@/components/RankingBoard";
import PhaserGame from "@/components/game/PhaserGame";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <main className="container mx-auto px-4">
        {/* 헤더 */}
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          🎮 아케이드 플랫폼
        </h1>

        {/* 게임 (MainScene) */}
        <div className="flex justify-center mb-8">
          <PhaserGame />
        </div>

        {/* 랭킹 보드 */}
        <div className="flex justify-center">
          <RankingBoard gameType="brick-breaker" />
        </div>
      </main>
    </div>
  );
}
