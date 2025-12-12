// components/avatar/AvatarPreview.tsx
"use client";

import { useEffect, useRef } from "react";
import type { CharacterCustomization } from "@/types/character";

interface AvatarPreviewProps {
  customization: CharacterCustomization;
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({ customization }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    const initPhaser = async () => {
      if (!containerRef.current) return;

      // 순서 중요: Phaser를 먼저 import
      await import("phaser");

      // 그 다음 PreviewScene import
      const { PreviewScene } = await import("@/components/avatar/test/PreviewScene");

      // 이제 Phaser가 전역에 있어서 PreviewScene이 작동함
      const Phaser = (await import("phaser")).default;

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
        scene: PreviewScene,
      };

      gameRef.current = new Phaser.Game(config);
      gameRef.current.scene.start("PreviewScene", { customization });
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
