import { createInitialCustomization } from "@/utils/character-helpers";
import { CharacterCustomization } from "@/types/character";
import { LPCData } from "@/types/lpc";
import { generateRandomCustomization } from "@/utils/character-helpers";
import { getHairStylesByGender } from "@/utils/character-helpers";
import { useCallback, useEffect, useState } from "react";

export function useCharacterCustomization(lpcData: LPCData | null) {
  const [customization, setCustomization] =
    useState<CharacterCustomization | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!lpcData) return;

    try {
      const safeInitial = createInitialCustomization(lpcData);
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
      const randomCustomization = generateRandomCustomization(
        lpcData,
        customization.gender
      );
      setCustomization(randomCustomization);
    } catch (error) {
      console.error("랜덤 생성에 실패했습니다:", error);
    }
  }, [lpcData, customization]);

  // 성별 변경 핸들러
  const handleGenderChange = useCallback(
    (gender: "male" | "female") => {
      if (!lpcData || !customization) return;

      const hairStyles = getHairStylesByGender(
        lpcData.assets.hair.styles,
        gender
      );

      if (hairStyles.length === 0) {
        console.warn("성별에 맞는 헤어스타일이 없습니다:", gender);
        return;
      }

      const firstHair = hairStyles[0];

      setCustomization((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          gender: gender,
          hair: {
            style: firstHair.id,
            color: prev.hair.color,
          },
        } as CharacterCustomization;
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
