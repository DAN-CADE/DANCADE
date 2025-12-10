"use client";

import * as Phaser from "phaser";
import { useEffect, useRef } from "react";
import MapScene from "./MapScene";

export default function MapRenderer() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current) return;

    const MAP_WIDTH = 1920;
    const MAP_HEIGHT = 1088;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: "game-container",
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
      },
      backgroundColor: "#000",

      // ⭐ 중요한 부분: Scene 클래스를 넣어야 Player가 동작함
      scene: [MapScene],
      physics: {
        default: "arcade",
        arcade: {
          debug: false,
        },
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id="game-container" style={{ width: "100%", height: "100%" }} />;
}
