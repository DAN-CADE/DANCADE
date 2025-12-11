import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import Scene from './CharacterCustomScene';

const PhaserGame = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameRef.current || !containerRef.current) return;

    const MAP_WIDTH = 100;
    const MAP_HEIGHT = 100;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      // [중요 1] width/height를 실제 게임 해상도(100)로 맞춥니다.
      // 400으로 설정하면 100짜리 맵이 작게 보이거나, 스케일 매니저와 충돌할 수 있습니다.
      width: MAP_WIDTH,
      height: MAP_HEIGHT,
      
      parent: containerRef.current,
      backgroundColor: '#D9D9D9',

      // [중요 2] 픽셀 아트 전용 렌더링 설정 (Root 레벨에 두는 것이 확실합니다)
      pixelArt: true,    // 텍스처를 부드럽게 뭉개지 않고 도트 그대로 유지
      antialias: false,  // 브라우저 차원의 스무딩 기능 끄기
      roundPixels: true, // 픽셀 좌표를 정수로 처리하여 이동 시 '찢어짐' 방지

      scale: {
        // FIT: 부모 컨테이너(400px)에 맞춰서 내부(100px)를 꽉 차게 늘림
        mode: Phaser.Scale.FIT, 
        autoCenter: Phaser.Scale.CENTER_BOTH,
        
        // 스케일 매니저에게 기준 해상도 명시
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        
        // [팁] 만약 FIT 모드에서도 흐릿하다면 zoom을 명시해볼 수 있습니다.
        // zoom: 4, 
      },

      physics: {
        default: 'arcade',
        arcade: { 
            gravity: { y: 0, x: 0 }, 
            debug: false 
        },
      },
      scene: [Scene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '250px', height: '250px', margin: '0 auto' }}>
      
      {/* 게임 화면 */}
      <div ref={containerRef} id="phaser-container" style={{ width: '100%', height: '100%' }} />

    </div>
  );
};

export default PhaserGame;