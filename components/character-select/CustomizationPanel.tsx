import { CharacterCustomization } from "@/types/character";
import { LPCData, LPCStyle } from "@/types/lpc";
import { getHairStylesByGender } from "@/utils/character-helpers";
import { useCallback } from "react";
import { Section } from "./Section";
import { ButtonGroup, SelectButton } from "./Button";

// 커스터마이징 패널
interface CustomizationPanelProps {
  lpcData: LPCData;
  customization: CharacterCustomization;
  onChange: (
    value:
      | CharacterCustomization
      | ((prev: CharacterCustomization) => CharacterCustomization)
  ) => void;
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

  const availableHairStyles = getHairStylesByGender(
    assets.hair.styles,
    customization.gender
  );

  const handleSkinChange = useCallback(
    (color: string) => {
      onChange((prev: CharacterCustomization) => ({ ...prev, skin: color }));
    },
    [onChange]
  );

  const handleHairStyleChange = useCallback(
    (styleId: string) => {
      onChange((prev: CharacterCustomization) => ({
        ...prev,
        hair: { ...prev.hair, style: styleId },
      }));
    },
    [onChange]
  );

  const handleHairColorChange = useCallback(
    (color: string) => {
      onChange((prev: CharacterCustomization) => ({
        ...prev,
        hair: { ...prev.hair, color },
      }));
    },
    [onChange]
  );

  const handleTorsoColorChange = useCallback(
    (color: string) => {
      onChange((prev: CharacterCustomization) => ({
        ...prev,
        torso: { ...prev.torso, color },
      }));
    },
    [onChange]
  );

  const handleLegsColorChange = useCallback(
    (color: string) => {
      onChange((prev: CharacterCustomization) => ({
        ...prev,
        legs: { ...prev.legs, color },
      }));
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
              active={customization.skin === color}
              onClick={() => handleSkinChange(color)}
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
              active={customization.hair.style === style.id}
              onClick={() => handleHairStyleChange(style.id)}
            >
              {style.id}
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
              active={customization.hair.color === color}
              onClick={() => handleHairColorChange(color)}
            >
              {color}
            </SelectButton>
          ))}
        </ButtonGroup>
      </Section>

      {/* 상의 색상 선택 */}
      <Section title="상의 색상">
        <ButtonGroup>
          {palettes.clothes_common.slice(0, 12).map((color: string) => (
            <SelectButton
              key={color}
              active={customization.torso.color === color}
              onClick={() => handleTorsoColorChange(color)}
            >
              {color}
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
              active={customization.legs.color === color}
              onClick={() => handleLegsColorChange(color)}
            >
              {color}
            </SelectButton>
          ))}
        </ButtonGroup>
      </Section>
    </div>
  );
}
