"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import CharacterCustomScene from "@/components/avatar/ui/CharacterCustomScene";
import { CharacterState } from "../utils/LpcTypes";
import { PreloadScene } from "@/game/scenes/core/PreloadScene";

interface AvatarPreviewProps {
  customization: CharacterState | null | undefined;
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({ customization }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. 게임 초기화 (마운트 시 한 번만 실행)
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
          default: "arcade",
          arcade: {
              gravity: { x: 0, y: 0 },
              // debug: false
          }
        },
        scene: [PreloadScene, CharacterCustomScene],
      };

      gameRef.current = new Phaser.Game(config);
    };

    initPhaser();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // 2. customization 변경 시 Registry 업데이트
  useEffect(() => {
    if (gameRef.current && customization) {
      // Phaser Registry에 'customization' 키로 데이터 저장
      gameRef.current.registry.set('customization', customization);
    }
  }, [customization]);
  // END 추가

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