// components/game/PhaserGame.tsx (거의 그대로)
"use client";

import { useEffect, useRef } from "react";
import { createGameConfig } from "@/game/config";

export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current) return;

    const initPhaser = async () => {
      const Phaser = await import("phaser");
      const { StartScene } = await import("@/game/scenes/StartScene");
      const { MainScene } = await import("@/game/scenes/MainScene");
      const { BrickBreakerScene } = await import(
        "@/game/scenes/BrickBreackerScene"
      );

      if (gameRef.current) return;

      const config: Phaser.Types.Core.GameConfig = {
        ...createGameConfig(Phaser),
        scene: [MainScene, StartScene, BrickBreakerScene], // 쉼표 하나 제거
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
