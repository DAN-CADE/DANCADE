// app/page.tsx
'use client';

import dynamic from 'next/dynamic';

// SSR을 끄고 클라이언트 사이드에서만 로드하도록 설정
const GameComponent = dynamic(() => import('@/components/avatar/ui/CharacterCustomConfig'), {
  ssr: false,
  loading: () => <p>아바타 로딩중...</p>, // 로딩 중에 보여줄 UI
});

export default function Home() {
  return (
    <main style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#000' }}>
      <div>
        <h1 style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
          Game Zone
        </h1>
        {/* 게임 컴포넌트 배치 */}
        <GameComponent />
        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '10px' }}>
          WASD를 눌러 캐릭터를 움직여보세요
        </p>
      </div>
    </main>
  );
}