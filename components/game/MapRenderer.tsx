"use client";

import * as Phaser from "phaser";
import { useEffect, useRef } from "react";

export default function MapRenderer() {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (gameRef.current) return;

    // 맵의 원본 크기를 상수로 정의합니다.
    const MAP_WIDTH = 1920;
    const MAP_HEIGHT = 1088;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: "game-container",
      pixelArt: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
      },
      backgroundColor: "#000",
      scene: {
        preload,
        create,
      },
      
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

function preload(this: Phaser.Scene) {
  this.load.image("CommonTile", "/tilesets/CommonTile.png");
  // 맵 로딩
  this.load.tilemapTiledJSON("map", "/maps/DanMap5.tmj");
}


  function create(this: Phaser.Scene) {
    const map = this.make.tilemap({ key: "map" });

    // Tiled tileset 이름("CommonTile")과 preload key("CommonTile")를 매칭
    const tileset = map.addTilesetImage("CommonTile", "CommonTile");

    // 모든 레이어 자동 생성
    map.layers.forEach((layer) => {
      map.createLayer(layer.name, tileset ?? [], 0, 0);
    });
    
  }

  return null;
}
