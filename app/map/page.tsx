"use client";
import dynamic from "next/dynamic";

const MapRenderer = dynamic(() => import("@/components/game/MapRenderer"), {
  ssr: false,
});

export default function MapPage() {
  return(
    // 화면 전체를 채우는 컨테이너. Phaser가 이 공간에 맞춰 맵 크기를 조절합니다.
    <div className="w-full h-screen bg-black">
      <div
        id="game-container"
        className="w-full h-full"
      >
        <MapRenderer />
      </div>
    </div>
  );
}