// components/game/PhaserGame.tsx
"use client";

import { useEffect, useRef } from "react";
import { createGameConfig } from "@/game/config";

export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    // 이미 게임이 생성되어 있으면 중복 생성 방지
    if (gameRef.current) return;

    // 클라이언트 사이드에서만 Phaser를 동적 import
    const initPhaser = async () => {
      const Phaser = await import("phaser");
      const { StartScene } = await import("@/game/scenes/StartScene");

      const { MainScene } = await import("@/game/scenes/MainScene");
      const { BrickBreakerScene } = await import(
        "@/game/scenes/BrickBreackerScene"
      );

      // 다시 한번 체크 (비동기 작업 중 생성되었을 수 있음)
      if (gameRef.current) return;

      const config: Phaser.Types.Core.GameConfig = {
        ...createGameConfig(Phaser),
        scene: [MainScene, StartScene, BrickBreakerScene],
      };

      gameRef.current = new Phaser.Game(config);
    };

    initPhaser();

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div
        id="game-container"
        className="rounded-lg overflow-hidden shadow-2xl"
      />
    </div>
  );
}
