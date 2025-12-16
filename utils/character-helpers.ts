// 헬퍼 함수들
import { UICharacterCustomization } from "@/types/character";
import { LPCData, LPCStyle } from "@/types/lpc";

/**
 * 랜덤 배열 요소 선택
 */
export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 성별에 맞는 헤어 스타일 필터링
 */
export function getHairStylesByGender(
  styles: LPCStyle[] | undefined,
  gender: "male" | "female"
): LPCStyle[] {
  if (!styles) return [];
  return styles.filter((s) => !s.genders || s.genders.includes(gender));
}

/**
 * 최소한의 기본 캐릭터 설정을 LPCData를 기반으로 동적으로 생성 및 반환
 */
export function createInitialCustomization(
  lpcData: LPCData
): UICharacterCustomization {
  const { palettes } = lpcData.definitions;
  const { assets } = lpcData;

  const maleStyles = getHairStylesByGender(assets.hair.styles, "male");
  const maleHair = maleStyles[0];

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

/**
 * 랜덤 커스터마이징 생성 로직
 */
export function generateRandomCustomization(
  lpcData: LPCData,
  currentGender?: "male" | "female"
): UICharacterCustomization {
  const { palettes } = lpcData.definitions;
  const { assets } = lpcData;

  // 1. 성별 결정: currentGender가 있으면 유지, 없으면 50% 확률로 결정
  const randomGender =
    currentGender || (Math.random() > 0.5 ? "male" : "female");

  // 2. 색상 랜덤 선택 (팔레트 사용)
  const randomSkin = getRandomElement(palettes.skin_common);
  const randomEyeColor = getRandomElement(palettes.eye_common);

  const randomTorsoColor = getRandomElement(palettes.clothes_common);
  const randomLegsColor = getRandomElement(palettes.clothes_common);
  const randomFeetColor = getRandomElement(palettes.clothes_common);

  // 3. 헤어 스타일 랜덤 선택
  const hairStyles = getHairStylesByGender(assets.hair.styles, randomGender);
  if (hairStyles.length === 0) {
    // 유효한 헤어 스타일이 없다면 오류 처리
    throw new Error(
      `성별 (${randomGender})에 맞는 헤어스타일이 LPCData에 없습니다.`
    );
  }

  const randomHairStyle = getRandomElement(hairStyles);
  const hairColors = randomHairStyle.colors || palettes.hair_common;
  const randomHairColor = getRandomElement(hairColors);

  // 4. 의상 및 신발 스타일 랜덤 선택 (스타일 배열에서 랜덤으로 하나 선택)

  // 4-1. Torso 스타일 랜덤 선택
  const torsoStyles = assets.torso.styles;
  const randomTorsoStyle =
    torsoStyles && torsoStyles.length > 0
      ? getRandomElement(torsoStyles)
      : { id: "longSleeve" }; // 폴백

  // 4-2. Legs 스타일 랜덤 선택
  const legsStyles = assets.legs.styles;
  const randomLegsStyle =
    legsStyles && legsStyles.length > 0
      ? getRandomElement(legsStyles)
      : { id: "cuffed" }; // 폴백

  // 4-3. Feet 스타일 랜덤 선택
  const feetStyles = assets.feet.styles;
  const randomFeetStyle =
    feetStyles && feetStyles.length > 0
      ? getRandomElement(feetStyles)
      : { id: "shoes" }; // 폴백

  // 5. 최종 객체 반환
  return {
    gender: randomGender,
    skin: randomSkin,
    hair: { style: randomHairStyle.id, color: randomHairColor },
    eyes: randomEyeColor,
    torso: { style: randomTorsoStyle.id, color: randomTorsoColor },
    legs: { style: randomLegsStyle.id, color: randomLegsColor },
    feet: { style: randomFeetStyle.id, color: randomFeetColor },
  };
}
