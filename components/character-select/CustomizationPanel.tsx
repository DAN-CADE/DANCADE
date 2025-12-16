import { UICharacterCustomization } from "@/types/character";
import { LPCData, LPCStyle } from "@/types/lpc";
import { getHairStylesByGender } from "@/utils/character-helpers";
import { useCallback } from "react";
import { Section } from "./Section";
import { ButtonGroup, SelectButton } from "./Button";

// 커스터마이징 패널
interface CustomizationPanelProps {
  lpcData: LPCData;
  customization: UICharacterCustomization;
  onChange: React.Dispatch<
    React.SetStateAction<UICharacterCustomization | null>
  >;
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

  // 범용 핸들러 함수
  const handleChange = useCallback(
    <T extends keyof UICharacterCustomization>(
      part: T,
      value: T extends "skin" | "eyes"
        ? string
        : { style?: string; color?: string }
    ) => {
      onChange((prev) => {
        if (!prev) return prev; // prev가 null이면 그대로 반환

        // 1. 단순 문자열 속성 (skin, eyes) 처리
        if (part === "skin" || part === "eyes") {
          return { ...prev, [part]: value as string };
        }

        // 2. 객체 속성 (hair, torso, legs, feet) 처리
        const prevPart = prev[part] as { style: string; color: string };

        const newPart = {
          ...prevPart, // 기존의 style/color 유지
          ...(value as object), // 새로운 style 또는 color만 덮어쓰기
        };

        return { ...prev, [part]: newPart };
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
              active={customization.skin === color}
              onClick={() => handleChange("skin", color)}
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
              onClick={() => handleChange("hair", { style: style.id })}
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
              active={customization.hair.color === color}
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
              active={customization.torso.style === style.id}
              onClick={() => handleChange("torso", { style: style.id })} // ⭐️ 변경
            >
              {style.name || style.id}
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
              onClick={() => handleChange("torso", { color: color })} // ⭐️ 변경
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
              active={customization.legs.style === style.id}
              onClick={() => handleChange("legs", { style: style.id })}
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
              active={customization.legs.color === color}
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
              active={customization.eyes === color}
              onClick={() => handleChange("eyes", color)}
            >
              {color}
            </SelectButton>
          ))}
        </ButtonGroup>
      </Section>
    </div>
  );
}
