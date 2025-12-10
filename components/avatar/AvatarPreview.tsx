// components/avatar/AvatarPreview.tsx
"use client";

import { useEffect, useRef } from "react";
import type { CharacterCustomization } from "@/types/character";

interface AvatarPreviewProps {
  customization: CharacterCustomization;
}

const AvatarPreview: React.FC<AvatarPreviewProps> = ({ customization }) => {
  const gameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 기존 게임 제거
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }

    // 🎯 Phaser를 동적으로 import
    const initPhaser = async () => {
      if (!containerRef.current) return;

      const Phaser = await import("phaser");

      // CustomPreviewScene 클래스 정의 (동적 import 내부)
      class CustomPreviewScene extends Phaser.Scene {
        private avatarContainer!: Phaser.GameObjects.Container;
        private partLayers: { [key: string]: Phaser.GameObjects.Sprite } = {};
        private customization!: CharacterCustomization;

        constructor() {
          super({ key: "CustomPreviewScene" });
        }

        init(data: { customization: CharacterCustomization }) {
          this.customization = data.customization;
          console.log("🎨 Preview init:", this.customization);
        }

        preload() {
          this.load.json("lpc_config", "/assets/lpc_assets.json");

          this.load.on(
            Phaser.Loader.Events.FILE_COMPLETE + "-json-lpc_config",
            (key: string, type: string, data: any) => {
              if (data && data.assets) {
                this.loadCustomAssets(data);
              }
            }
          );
        }

        create() {
          this.cameras.main.setBackgroundColor("#2d2d2d");

          this.avatarContainer = this.add.container(200, 200);

          const lpcData = this.cache.json.get("lpc_config");
          if (lpcData) {
            this.createCustomCharacter();
          }

          this.cameras.main.setZoom(2.5);
          this.cameras.main.centerOn(200, 200);
        }

        private loadCustomAssets(data: any) {
          const frameConfig = { frameWidth: 64, frameHeight: 64 };
          const { customization } = this;

          // Body
          this.load.spritesheet(
            `body_${customization.skin}`,
            `/assets/spritesheets/body/teen/${customization.skin}.png`,
            frameConfig
          );

          // Head
          this.load.spritesheet(
            `head_${customization.gender}_${customization.skin}`,
            `/assets/spritesheets/head/heads/human/${customization.gender}/${customization.skin}.png`,
            frameConfig
          );

          // Eyes
          this.load.spritesheet(
            `eyes_${customization.eyes}`,
            `/assets/spritesheets/eyes/human/adult/${customization.eyes}.png`,
            frameConfig
          );

          // Nose
          this.load.spritesheet(
            `nose_${customization.skin}`,
            `/assets/spritesheets/nose/button/adult/${customization.skin}.png`,
            frameConfig
          );

          // Hair
          this.load.spritesheet(
            `hair_${customization.hair.style}_${customization.gender}_${customization.hair.color}`,
            `/assets/spritesheets/hair/${customization.hair.style}/${customization.gender}/${customization.hair.color}.png`,
            frameConfig
          );

          // Torso
          this.load.spritesheet(
            `torso_${customization.torso.style}_${customization.torso.color}`,
            `/assets/spritesheets/torso/clothes/${customization.torso.style}/teen/${customization.torso.color}.png`,
            frameConfig
          );

          // Legs
          this.load.spritesheet(
            `legs_${customization.legs.style}_${customization.legs.color}`,
            `/assets/spritesheets/legs/${customization.legs.style}/teen/${customization.legs.color}.png`,
            frameConfig
          );

          // Feet
          this.load.spritesheet(
            `feet_${customization.feet.style}_${customization.feet.color}`,
            `/assets/spritesheets/feet/${customization.feet.style}/thin/${customization.feet.color}.png`,
            frameConfig
          );

          this.load.start();
        }

        private createCustomCharacter() {
          const { customization } = this;

          const partOrder = [
            { key: `body_${customization.skin}` },
            { key: `head_${customization.gender}_${customization.skin}` },
            { key: `eyes_${customization.eyes}` },
            { key: `nose_${customization.skin}` },
            {
              key: `hair_${customization.hair.style}_${customization.gender}_${customization.hair.color}`,
            },
            {
              key: `torso_${customization.torso.style}_${customization.torso.color}`,
            },
            {
              key: `legs_${customization.legs.style}_${customization.legs.color}`,
            },
            {
              key: `feet_${customization.feet.style}_${customization.feet.color}`,
            },
          ];

          partOrder.forEach(({ key }) => {
            if (this.textures.exists(key)) {
              const sprite = this.add.sprite(0, 0, key, 130); // 정면
              sprite.setOrigin(0.5, 0.5);
              this.avatarContainer.add(sprite);
              this.partLayers[key] = sprite;
              console.log(`✅ Added: ${key}`);
            } else {
              console.warn(`⚠️ Missing: ${key}`);
            }
          });
        }
      }

      // Phaser 게임 설정
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
        scene: CustomPreviewScene,
      };

      gameRef.current = new Phaser.Game(config);
      gameRef.current.scene.start("CustomPreviewScene", { customization });
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
