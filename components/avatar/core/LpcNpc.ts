
import { AvatarManager } from "@/game/managers/global/AvatarManager";
import { MainScene } from "@/game/scenes/core/MainScene";
import { getEventGame } from "@/lib/supabase/event"
import { getRankings } from "@/lib/supabase/ranking";

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
      scene.uiManager.showSpeechBubble(npc, "상점으로 이동합니다...", 1000);

      scene.cameras.main.fadeOut(500, 0, 0, 0);

      scene.cameras.main.once('camerafadeoutcomplete', () => {
        if (typeof window !== "undefined") {
          window.location.assign("/shop");
        }
      });
    }
  },
  VILLAGER: {
    name: "랭킹 NPC",
    defaultSprite: "female",
    interaction: async (scene, npc) => {
      scene.uiManager.showRankingBoardUI()
    }
  },
  EVENT: {
    name: "이벤트 NPC",
    defaultSprite: "male",
    interaction: async (scene, npc) => {
      const { data } = await getEventGame();
      
      if (data) {
        switch(data.game_type) {
          case 'rock_paper_scissors':
            scene.uiManager.showGameUI(npc);
            break; 
          case 'consonant_quiz':
            const {consonant, result, hint} = data.details
            scene.uiManager.showConsonantQuizUI(npc, consonant, result, hint);
            break;
        }        
      } else {
        scene.uiManager.showSpeechBubble(npc, "진행중인 이벤트가 없습니다.", 2000);
      }
    }
  }
};