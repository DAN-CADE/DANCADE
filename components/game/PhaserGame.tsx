// components/game/PhaserGame.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createGameConfig } from "@/game/config";


export default function PhaserGame() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (gameRef.current) return;

    const initPhaser = async () => {
      const Phaser = await import("phaser");

      const { PreloadScene } = await import("@/game/scenes/core/PreloadScene");
      const { StartScene } = await import("@/game/scenes/core/StartScene");
      const { MainScene } = await import("@/game/scenes/core/MainScene");
      const { ModalScene } = await import("@/game/scenes/core/ModalScene");
      const { BrickBreakerScene } = await import(
        "@/game/scenes/games/BrickBreakerScene"
      );
      const { PingPongScene } = await import(
        "@/game/scenes/games/PingPongScene"
      );
      const { OmokScene } = await import("@/game/scenes/games/OmokScene");

      if (gameRef.current) return;

      const config: Phaser.Types.Core.GameConfig = {
        ...createGameConfig(Phaser),
        scene: [
          PreloadScene,
          MainScene,
          ModalScene,
          StartScene,
          BrickBreakerScene,
          PingPongScene,
          OmokScene,
        ],
      };

      gameRef.current = new Phaser.Game(config);
    };

    initPhaser();

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Listen for Phaser preload completion (dispatched from PreloadScene)
  useEffect(() => {
    const onPreloadComplete = () => setLoading(false);
    window.addEventListener(
      "phaser:preloadComplete",
      onPreloadComplete as EventListener
    );
    return () =>
      window.removeEventListener(
        "phaser:preloadComplete",
        onPreloadComplete as EventListener
      );
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen">
      <div
        id="game-container"
        className="rounded-lg overflow-hidden shadow-2xl w-screen h-screen"
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <div className="text-white">로딩 중...</div>
          </div>
        </div>
      )}
    </div>
  );
}
