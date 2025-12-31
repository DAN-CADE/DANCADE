"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import CharacterCustomScene from "@/components/avatar/ui/CharacterCustomScene";
import { CharacterState } from "../utils/LpcTypes";
import { PreloadScene } from "@/game/scenes/core/PreloadScene";

interface AvatarPreviewProps {
  customization: CharacterState | null | undefined;
  onLoad?: () => void;
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({
  customization,
  onLoad,
}) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ref로 관리하여 Phaser 재시작 방지
  const onLoadRef = useRef(onLoad);
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 400,
      height: 400,
      parent: containerRef.current,
      // backgroundColor: "#2d2d2d",
       transparent: true,
      render: { pixelArt: true, roundPixels: true },
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 } },
      },
      scene: [PreloadScene, CharacterCustomScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once("ready", () => {
      // CharacterCustomScene이 활성화되는 시점에 단 한 번만 실행
      game.scene.getScene("CharacterCustomScene").events.once("update", () => {
        onLoadRef.current?.();
      });
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (gameRef.current && customization) {
      gameRef.current.registry.set("customization", customization);
    }
  }, [customization]);

  return <div ref={containerRef} className="w-[400px] h-[400px]" />;
};

export default AvatarPreview;
