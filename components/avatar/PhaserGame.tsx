import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from './MainScene';

const PhaserGame = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      backgroundColor: '#D9D9D9',
      
      // [추가] 픽셀 아트 전용 렌더링 설정
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

  // [핵심] 버튼 클릭 핸들러
  const handleRandomClick = () => {
    if (!gameRef.current) return;

    // 1. 현재 실행 중인 MainScene 가져오기
    const scene = gameRef.current.scene.getScene('MainScene') as MainScene;
    
    // 2. MainScene의 public 메서드 호출
    if (scene) {
      scene.randomizeCharacter(); 
    }
  };

  return (
    <div style={{ position: 'relative', width: '800px', height: '600px', margin: '0 auto' }}>
      
      {/* 게임 화면 */}
      <div ref={containerRef} id="phaser-container" style={{ width: '100%', height: '100%' }} />

      {/* UI 레이어 */}
      <div 
        className="ui-layer" 
        style={{ 
          position: 'absolute', 
          top: '20px', 
          right: '20px', 
          zIndex: 10, 
          pointerEvents: 'none' 
        }}
      >
        <button 
          onClick={handleRandomClick} // React 이벤트 연결
          style={{ 
            pointerEvents: 'auto', 
            padding: '10px 20px', 
            fontSize: '16px', 
            cursor: 'pointer',
            backgroundColor: '#fff',
            border: '2px solid #333',
            color: '#333',
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          🎲 HTML 랜덤 버튼
        </button>
      </div>

    </div>
  );
};

export default PhaserGame;