// components/avatar/AvatarPreview.tsx
"use client";

import { useEffect, useRef } from "react";
import Phaser from 'phaser';
import CharacterCustomScene from '@/components/avatar/ui/CharacterCustomScene'
import { CharacterState } from "../utils/LpcTypes";
import PreloadScene from "../ui/PreLoadScene";

interface AvatarPreviewProps {
  customization: CharacterState | null | undefined;
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({ customization }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const initPhaser = async () => {
      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: 400,
        height: 400,
        parent: containerRef.current,
        backgroundColor: "#2d2d2d",
        render: {
          pixelArt: true,
          roundPixels: true,
        },
        physics: {
          default: 'arcade',
          arcade: {
              gravity: { x: 0, y: 0 }, // 탑뷰 게임이므로 중력 0
              // debug: true // 디버깅용 박스 표시 (나중에 false로 변경)
          }
        },
        scene: [PreloadScene, CharacterCustomScene],
      };

      gameRef.current = new Phaser.Game(config);
      gameRef.current.scene.start("CharacterCustomScene", { customization });
    };

    const timer = setTimeout(() => {
      initPhaser();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [customization]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};

export default AvatarPreview;
