import { AvatarManager } from "@/game/managers/global/AvatarManager";
import { MainScene } from "@/game/scenes/core/MainScene";

export type NpcType = 'MERCHANT' | 'VILLAGER' | 'GAMBLER';

interface NpcData {
  name: string;
  defaultSprite: string;
  interaction: (scene: MainScene, npcSprite: AvatarManager) => void;
}

export const NPC_CONFIG: Record<NpcType, NpcData> = {
  MERCHANT: {
    name: "상인",
    defaultSprite: "male",
    interaction: (scene, npc) => {
      // scene.uiManager.showSpeechBubble(npc, "어서오게! 좋은 물건이 많다네.");
      scene.uiManager.openModal("상점", "상점 메뉴를 여시겠습니까?");
    }
  },
  VILLAGER: {
    name: "주민",
    defaultSprite: "female",
    interaction: (scene, npc) => {
      scene.uiManager.showSpeechBubble(npc, "오늘 날씨가 참 좋네요.", 2000);
    }
  },
  GAMBLER: {
    name: "도박사",
    defaultSprite: "male",
    interaction: (scene, npc) => {
      scene.uiManager.showGameUI(npc);
      scene.uiManager.showNotice("이벤트 발생")
    }
  }
};