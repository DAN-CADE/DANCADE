// components/common/Header/Header.tsx
"use client";

import { useRouter } from "next/navigation";

interface HeaderProps {
  showBackToGame?: boolean;
  rightSlot?: React.ReactNode; // 🔥 확장용
}

export default function Header({
  showBackToGame = true,
  rightSlot,
}: HeaderProps) {
  const router = useRouter();

  return (
    <header className="absolute top-15 right-2 z-50 flex items-center gap-4">
      {/* 🎮 게임으로 돌아가기 */}
      {showBackToGame && (
        <button
          onClick={() => router.push("/game")}
          className="
            px-3 py-1.5
            text-sm font-semibold
            bg-black/60 text-white
            border border-teal-400/60
            rounded
            hover:bg-teal-400 hover:text-black
            transition
          "
        >
          ← GAME
        </button>
      )}

      {/* 🔧 나중에 정렬 / 필터 버튼 들어갈 자리 */}
      {rightSlot}

    </header>
  );
}
