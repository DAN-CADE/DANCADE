"use client";

import { useEffect, useRef } from "react";
import Phaser from 'phaser';
import PreloadScene from "../ui/PreLoadScene"; // 경로 확인 필요
import CharacterCustomScene from '@/components/avatar/ui/CharacterCustomScene';
import { CharacterState } from "../utils/LpcTypes";

interface AvatarPreviewProps {
  customization: CharacterState | null | undefined;
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({ customization }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. [Mount] 게임 인스턴스는 컴포넌트 마운트 시 단 한 번만 생성
  useEffect(() => {
    if (!containerRef.current) return;

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
            gravity: { x: 0, y: 0 },
        }
      },
      // PreloadScene이 먼저 실행되고, 로딩 완료 후 CharacterCustomScene을 시작함
      scene: [PreloadScene, CharacterCustomScene], 
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []); // 의존성 배열을 비워 한 번만 실행되게 함

  // 2. [Update] customization 데이터가 바뀌면 Phaser Registry에 값 업데이트
  useEffect(() => {
    if (gameRef.current && customization) {
      // Phaser의 Registry(전역 데이터)에 데이터를 저장합니다.
      // Scene 내부에서 이 값이 변경되는 것을 감지하여 캐릭터를 다시 그립니다.
      gameRef.current.registry.set('customization', customization);
    }
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