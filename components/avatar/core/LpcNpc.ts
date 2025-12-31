import { AvatarManager } from "@/game/managers/global/AvatarManager";
import { MainScene } from "@/game/scenes/core/MainScene";
import { getEventGame } from "@/lib/supabase/event"

export type NpcType = 'MERCHANT' | 'VILLAGER' | 'EVENT';

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
  EVENT: {
    name: "이벤트 NPC",
    defaultSprite: "male",
    interaction: async (scene, npc) => {
      const { data } = await getEventGame();
      if (data) {
        scene.uiManager.showGameUI(npc);
      } else {
        scene.uiManager.showSpeechBubble(npc, "진행중인 이벤트가 없습니다.", 2000);
      }
    }
  }
};