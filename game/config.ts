// game/config.ts

// Phaser를 직접 import하지 않고, 런타임에 전달받아 config 생성
export const createGameConfig = (
  Phaser: typeof import("phaser")
): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent: "game-container",
  // width: 800,
  // height: 600,
  backgroundColor: "#2c2c2c",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.ScaleModes.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
});
