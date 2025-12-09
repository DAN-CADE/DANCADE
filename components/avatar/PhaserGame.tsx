import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from './MainScene';

const PhaserGame = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const MAP_WIDTH = 1920;
    const MAP_HEIGHT = 1088;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      backgroundColor: '#D9D9D9',
      
      // [수정] 맵 크기에 맞춘 스케일링 설정
      scale: {
        mode: Phaser.Scale.FIT, // 부모 컨테이너에 맞춰 비율 유지하며 크기 조절
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
      },

      render: {
        pixelArt: true,   // 도트가 선명하게 보이도록 설정
        roundPixels: true // 픽셀 좌표를 정수로 맞춤 (깨짐 방지)
      },

      physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 0, x: 0 }, // x, y 속성을 명확히 분리
            debug: false 
        },
      },
      scene: [MainScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '800px', height: '600px', margin: '0 auto' }}>
      
      {/* 게임 화면 */}
      <div ref={containerRef} id="phaser-container" style={{ width: '100%', height: '100%' }} />

    </div>
  );
};

export default PhaserGame;