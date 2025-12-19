// import { createInitialCustomization } from "@/utils/character-helpers";
// import { generateRandomCustomization } from "@/utils/character-helpers";
// import { getHairStylesByGender } from "@/utils/character-helpers";
import { useCallback, useEffect, useState } from "react";
import type { CharacterState, LpcSprite } from "@/components/avatar/utils/LpcTypes";
import { LpcSpriteManager } from "@/game/managers/global/LpcSpriteManager";

export function useCharacterCustomization(lpcData: LpcSprite | null) {
  const lpcSpriteManager = new LpcSpriteManager();
  const [customization, setCustomization] = useState<CharacterState | null>(
    null
  );
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!lpcData) return;

    try {
      const safeInitial = lpcSpriteManager.getInitialPart(lpcData);
      // const safeInitial = createInitialCustomization(lpcData);
      setCustomization(safeInitial);
      setIsInitialized(true);
    } catch (error) {
      console.error("기본 아바타값 생성 실패:", error);
      setIsInitialized(true);
    }
  }, [lpcData]);

  // 랜덤 생성 핸들러
  const handleRandomize = useCallback(() => {
    if (!lpcData || !customization) return;

    try {
      const randomCustomization = lpcSpriteManager.getRandomPart(lpcData);
      // const randomCustomization = generateRandomCustomization(
      //   lpcData,
      //   customization.gender as "male" | "female"
      // );
      setCustomization(randomCustomization);
    } catch (error) {
      console.error("랜덤 생성에 실패했습니다:", error);
    }
  }, [lpcData, customization]);

  // 성별 변경 핸들러
  const handleGenderChange = useCallback(
    (gender: "male" | "female") => {
      if (!lpcData || !customization) return;

      const hairStyles = lpcSpriteManager.getAssetsByPart(lpcData, "hair", gender);
      // const hairStyles = getHairStylesByGender(
      //   lpcData.assets.hair.styles,
      //   gender
      // );

      if (hairStyles.length === 0) {
        console.warn("성별에 맞는 헤어스타일이 없습니다:", gender);
        return;
      }

      const firstHair = hairStyles[0];
      const defaultColor =
        lpcData.definitions.palettes.hair_common[0] || "black";

      setCustomization((prev) => {
        if (!prev) return null;

        const currentHair = prev.parts.hair || {};

        return {
          ...prev,
          gender: gender,
          parts: {
            // parts 객체에 접근
            ...prev.parts, // 다른 파츠는 유지
            hair: {
              // hair 파트 업데이트
              styleId: firstHair.id, // style 대신 styleId 사용
              color: currentHair.color || defaultColor, // prev.parts.hair.color로 접근
            },
          },
        } as CharacterState;
      });
    },
    [lpcData, customization]
  );

  return {
    customization,
    setCustomization,
    isInitialized,
    handleRandomize,
    handleGenderChange,
  };
}
