import Link from "next/link";
import RankingBoard from "@/components/RankingBoard";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <main className="container mx-auto px-4">
        {/* 헤더 */}
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          🎮 아케이드 플랫폼
        </h1>

        {/* 게임 선택 */}
        <div className="flex justify-center gap-4 mb-8">
          <Link
            href="/game"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold"
          >
            🧱 벽돌깨기 플레이
          </Link>
        </div>

        {/* 랭킹 보드 */}
        <div className="flex justify-center">
          <RankingBoard gameType="brick-breaker" />
        </div>
      </main>
    </div>
  );
}
