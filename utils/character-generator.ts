// 랜덤 생성 관련
import { CharacterCustomization } from "@/types/character";
import { LPCData } from "@/types/lpc";
import { getHairStylesByGender, getRandomElement } from "./character-helpers";

/**
 * 랜덤 커스터마이징 생성 로직
 */
export function generateRandomCustomization(
  lpcData: LPCData,
  currentGender?: "male" | "female"
): CharacterCustomization {
  const { palettes } = lpcData.definitions;
  const { assets } = lpcData;

  // 성별
  const randomGender =
    currentGender || (Math.random() > 0.5 ? "male" : "female");

  // 랜덤 피부색
  const randomSkin = getRandomElement(palettes.skin_common);

  // 성별에 맞는 헤어 스타일
  const hairStyles = getHairStylesByGender(assets.hair.styles, randomGender);
  if (hairStyles.length === 0) {
    throw new Error("성별에 맞는 헤어스타일이 없습니다.");
  }

  const randomHairStyle = getRandomElement(hairStyles);
  const hairColors = randomHairStyle.colors || palettes.hair_common;
  const randomHairColor = getRandomElement(hairColors);

  // 랜덤 의상 색상
  const randomTorsoColor = getRandomElement(palettes.clothes_common);
  const randomLegsColor = getRandomElement(palettes.clothes_common);
  const randomFeetColor = getRandomElement(palettes.clothes_common);

  // 기본 스타일 가져오기
  const getTorsoStyle = () => assets.torso.styles?.[0]?.id || "longSleeve";

  const getLegsStyle = () => assets.legs.styles?.[0]?.id || "cuffed";

  const getFeetStyle = () => assets.feet.styles?.[0]?.id || "shoes";

  return {
    gender: randomGender,
    skin: randomSkin,
    hair: { style: randomHairStyle.id, color: randomHairColor },
    eyes: getRandomElement(palettes.eye_common),
    torso: { style: getTorsoStyle(), color: randomTorsoColor },
    legs: { style: getLegsStyle(), color: randomLegsColor },
    feet: { style: getFeetStyle(), color: randomFeetColor },
  };
}
