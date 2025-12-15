import { CharacterCustomization } from "@/types/character";
import { LPCData } from "@/types/lpc";

export function createInitialCustomization(
  lpcData: LPCData
): CharacterCustomization {
  const palettes = lpcData.definitions.palettes;
  const assets = lpcData.assets;

  const maleHair = assets.hair.styles?.find(
    (s) => !s.genders || s.genders.includes("male")
  );

  return {
    gender: "male",
    skin: palettes.skin_common[0] || "light",
    eyes: palettes.eye_common[0] || "blue",
    hair: {
      style: maleHair?.id || "plain",
      color: palettes.hair_common[0] || "black",
    },
    torso: {
      style: assets.torso.styles?.[0]?.id || "longSleeve",
      color: palettes.clothes_common[0] || "white",
    },
    legs: {
      style: assets.legs.styles?.[0]?.id || "cuffed",
      color: palettes.clothes_common[0] || "black",
    },
    feet: {
      style: assets.feet.styles?.[0]?.id || "shoes",
      color: palettes.clothes_common[0] || "black",
    },
  };
}

export const STORAGE_KEY = "characterCustomization";
export const LPC_ASSETS_PATH = "/assets/lpc_assets.json";
