import { LPCData, LPCStyle } from "@/types/lpc";
import { getHairStylesByGender } from "@/utils/character-helpers";
import { useCallback } from "react";
import { Section } from "./Section";
import { ButtonGroup, SelectButton } from "./Button";
import type { CharacterState } from "@/components/avatar/utils/LpcTypes";

interface CustomizationPanelProps {
  lpcData: LPCData;
  customization: CharacterState;
  onChange: React.Dispatch<React.SetStateAction<CharacterState | null>>;
  onGenderChange: (gender: "male" | "female") => void;
}

export function CustomizationPanel({
  lpcData,
  customization,
  onChange,
  onGenderChange,
}: CustomizationPanelProps) {
  const { palettes } = lpcData.definitions;
  const { assets } = lpcData;
  const gender = customization.gender as "male" | "female";

  const availableHairStyles = getHairStylesByGender(assets.hair.styles, gender);

  // 범용 핸들러 함수
  const handleChange = useCallback(
    // T는 CharacterState['parts']의 키여야 함 (예: 'body', 'hair', 'torso')
    <T extends keyof CharacterState["parts"]>(
      part: T,
      // value는 업데이트될 styleId 또는 color를 포함
      value: { styleId?: string; color?: string }
    ) => {
      onChange((prev) => {
        if (!prev || !prev.parts) return prev;

        // 1. 현재 파트 상태를 가져옴 (없으면 빈 객체 {})
        const prevPart = prev.parts[part] || {};

        const newPart = {
          ...prevPart,
          ...value, // 새로운 styleId 또는 color를 덮어씀
        };

        // 2. 불변적으로 업데이트된 상태 반환
        return {
          ...prev,
          parts: {
            ...prev.parts,
            [part]: newPart,
          },
        } as CharacterState;
      });
    },
    [onChange]
  );

  return (
    <div>
      <h2 className="text-2xl mb-[30px]">외모 커스터마이징</h2>

      {/* 성별 선택 */}
      <Section title="성별">
        <ButtonGroup>
          <SelectButton
            active={customization.gender === "male"}
            onClick={() => onGenderChange("male")}
          >
            남성
          </SelectButton>
          <SelectButton
            active={customization.gender === "female"}
            onClick={() => onGenderChange("female")}
          >
            여성
          </SelectButton>
        </ButtonGroup>
      </Section>

      {/* 피부색 선택 */}
      <Section title="피부색">
        <ButtonGroup>
          {palettes.skin_common.slice(0, 10).map((color: string) => (
            <SelectButton
              key={color}
              active={customization.parts.body?.color === color}
              onClick={() => {
                handleChange("body", { color })
                handleChange("head", { color })
                handleChange("nose", { color })
              }}
            >
              {color}
            </SelectButton>
          ))}
        </ButtonGroup>
      </Section>

      {/* 헤어 스타일 선택 */}
      <Section title="헤어 스타일">
        <ButtonGroup>
          {availableHairStyles.map((style: LPCStyle) => (
            <SelectButton
              key={style.id}
              active={customization.parts.hair?.styleId === style.id}
              onClick={() => handleChange("hair", { styleId: style.id })}
            >
              {style.name || style.id}
            </SelectButton>
          ))}
        </ButtonGroup>
      </Section>

      {/* 헤어 색상 선택 */}
      <Section title="헤어 색상">
        <ButtonGroup>
          {palettes.hair_common.slice(0, 12).map((color: string) => (
            <SelectButton
              key={color}
              active={customization.parts.hair?.color === color}
              onClick={() => handleChange("hair", { color: color })}
            >
              {color}
            </SelectButton>
          ))}
        </ButtonGroup>
      </Section>

      {/* 상의 스타일 선택 */}
      <Section title="상의 스타일">
        <ButtonGroup>
          {assets.torso.styles?.map((style) => (
            <SelectButton
              key={style.id}
              active={customization.parts.torso?.styleId === style.id}
              onClick={() => handleChange("torso", { styleId: style.id })}
            >
              {style.name || style.id}
            </SelectButton>
          ))}
        </ButtonGroup>
      </Section>

      {/* 상의 색상 선택 (Parts: 'torso') */}
      <Section title="상의 색상">
        <ButtonGroup>
          {palettes.clothes_common.slice(0, 12).map((color: string) => (
            <SelectButton
              key={color}
              active={customization.parts.torso?.color === color}
              onClick={() => handleChange("torso", { color: color })}
            >
              {color}
            </SelectButton>
          ))}
        </ButtonGroup>
      </Section>

      {/* 하의 스타일 선택 */}
      <Section title="하의 스타일">
        <ButtonGroup>
          {assets.legs.styles?.map((style) => (
            <SelectButton
              key={style.id}
              // ⭐️ 'legs' 파트의 styleId 속성에 접근
              active={customization.parts.legs?.styleId === style.id}
              // ⭐️ 'legs' 파트를 대상으로 styleId를 업데이트
              onClick={() => handleChange("legs", { styleId: style.id })}
            >
              {style.name || style.id}
            </SelectButton>
          ))}
        </ButtonGroup>
      </Section>

      {/* 하의 색상 선택 */}
      <Section title="하의 색상">
        <ButtonGroup>
          {palettes.clothes_common.slice(0, 12).map((color: string) => (
            <SelectButton
              key={color}
              active={customization.parts.legs?.color === color}
              onClick={() => handleChange("legs", { color: color })}
            >
              {color}
            </SelectButton>
          ))}
        </ButtonGroup>
      </Section>

      {/* 눈 색상 선택 */}
      <Section title="눈 색상">
        <ButtonGroup>
          {palettes.eye_common.slice(0, 12).map((color: string) => (
            <SelectButton
              key={color}
              active={customization.parts.eyes?.color === color}
              onClick={() => handleChange("eyes", { color: color })}
            >
              {color}
            </SelectButton>
          ))}
        </ButtonGroup>
      </Section>
    </div>
  );
}
