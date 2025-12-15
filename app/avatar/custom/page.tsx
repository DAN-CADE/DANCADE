"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import type { LPCData, LPCStyle } from "@/types/lpc";
import { CharacterCustomization, CharacterState, LpcRootData } from "@/components/avatar/utils/LpcTypes";
import { LpcUtils } from "@/components/avatar/utils/LpcUtils";

const AvatarPreview = dynamic(
  () => import("@/components/avatar/ui/AvatarPreview"),
  { ssr: false }
);

export default function CharacterSelect() {
  const router = useRouter();
  const [lpcData, setLpcData] = useState<LpcRootData | null>(null);

  // 🎯 커스터마이징 상태
  const [customization, setCustomization] = useState<CharacterState>()

  // JSON 로드
  useEffect(() => {
    fetch("/assets/lpc_assets.json")
      .then((res) => res.json())
      .then((data: LpcRootData) => {
        setLpcData(data)
        const initialState = LpcUtils.getRandomState(data);
        setCustomization(initialState);
        
      })
      .catch((err) => console.error("Failed to load LPC config:", err));
  }, []);

  // 랜덤 생성
  const handleRandomize = () => {
    if (!lpcData) return;

    if (lpcData) {
        // 초기 랜덤 상태 생성
        const initialState = LpcUtils.getRandomState(lpcData);
        setCustomization(initialState);
    }

    
  };

  // 게임 시작
  const handleStartGame = () => {
    // 🎯 localStorage 저장 확인
    const customizationString = JSON.stringify(customization);
    localStorage.setItem("characterCustomization", customizationString);

    console.log("💾 Saved customization:", customizationString);
    console.log(
      "✅ Verification:",
      localStorage.getItem("characterCustomization")
    );

    // 약간의 딜레이 후 이동 (localStorage 저장 완료 대기)
    setTimeout(() => {
      router.push("/game");
    }, 100);
  };

  if (!lpcData) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#1a1a1a",
          color: "white",
        }}
      >
        <p>로딩중...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#1a1a1a",
        color: "white",
      }}
    >
      {/* 왼쪽: 미리보기 */}
      <div
        style={{
          width: "50%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div
          style={{
            width: "400px",
            height: "400px",
            border: "3px solid #555",
            borderRadius: "10px",
            backgroundColor: "#2d2d2d",
            overflow: "hidden",
          }}
        >
          <AvatarPreview customization={customization} />
        </div>

        <div
          style={{
            display: "flex",
            gap: "15px",
            marginTop: "30px",
          }}
        >
          <button
            onClick={handleRandomize}
            style={{
              padding: "12px 25px",
              fontSize: "18px",
              fontWeight: "bold",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            랜덤 생성
          </button>

          <button
            onClick={handleStartGame}
            style={{
              padding: "12px 25px",
              fontSize: "18px",
              fontWeight: "bold",
              backgroundColor: "#ffff00",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            게임 시작
          </button>
        </div>
      </div>

      {/* 오른쪽: 커스터마이징 UI */}
      <div
        style={{
          width: "50%",
          padding: "40px",
          overflowY: "auto",
          backgroundColor: "#252525",
        }}
      >
        <CustomizationPanel
          lpcData={lpcData}
          customization={customization}
          onChange={setCustomization}
        />
      </div>
    </div>
  );
}

// ============================================================
// 🎨 커스터마이징 패널 컴포넌트
// ============================================================

interface CustomizationPanelProps {
  lpcData: LPCData;
  customization: CharacterCustomization;
  onChange: (newCustomization: CharacterCustomization) => void;
}

function CustomizationPanel({
  lpcData,
  customization,
  onChange,
}: any) {
  const palettes = lpcData.definitions.palettes;
  const assets = lpcData.assets;

  // 성별 변경
  const handleGenderChange = (gender: "male" | "female") => {
    // 성별에 맞는 헤어로 자동 변경
    const hairStyles =
      assets.hair.styles?.filter(
        (s: any) => !s.genders || s.genders.includes(gender)
      ) || [];
    if (hairStyles.length === 0) return;
    const firstHair = hairStyles[0];
      
    onChange({
      ...customization,
      gender,
      parts: {
        ...customization.parts, 
          hair: {
            styleId: firstHair.id,
            color: customization.parts.hair.color,
        },
      }
    });
  };

  return (
    <div>
      <h2 style={{ fontSize: "24px", marginBottom: "30px" }}>
        외모 커스터마이징
      </h2>

      {/* 성별 */}
      <Section title="성별">
        <ButtonGroup>
          <OptionButton
            active={customization.gender === "male"}
            onClick={() => handleGenderChange("male")}
          >
            남성
          </OptionButton>
          <OptionButton
            active={customization.gender === "female"}
            onClick={() => handleGenderChange("female")}
          >
            여성
          </OptionButton>
        </ButtonGroup>
      </Section>

      {/* 피부색 */}
      <Section title="피부색">
        <ColorGrid>
          {palettes.skin_common.slice(0, 10).map((color: string) => (
            <ColorButton
              key={color}
              color={color}
              active={customization.parts.body.color === color}
              onClick={() => {
                onChange({ ...customization, parts: { ...customization.parts, body: {color}, head: {color},nose: {color}} })
              }}
            >
              {color}
            </ColorButton>
          ))}
        </ColorGrid>
      </Section>

      {/* 눈 색상 */}
      <Section title="눈 색상">
        <ColorGrid>
          {palettes.eye_common.slice(0, 10).map((color: string) => (
            <ColorButton
              key={color}
              color={color}
              active={customization.parts.eyes.color === color}
              onClick={() => {
                onChange({ ...customization, parts: { ...customization.parts, eyes: {color}} })
              }}
            >
              {color}
            </ColorButton>
          ))}
        </ColorGrid>
      </Section>

      {/* 헤어 스타일 */}
      <Section title="헤어 스타일">
        <ButtonGroup>
          {(assets.hair.styles || [])
            .filter(
              (s: any) =>
                !s.genders || s.genders.includes(customization.gender) // ✅ LPCStyle
            )
            .map((style: LPCStyle) => (
              <OptionButton
                key={style.id}
                active={customization.parts.hair.styleId === style.id}
                onClick={() =>{
                  onChange({ ...customization, parts: { ...customization.parts, hair: {...customization.parts.hair, styleId: style.id } }})
                }
                }
              >
                {style.id}
              </OptionButton>
            ))}
        </ButtonGroup>
      </Section>

      {/* 헤어 색상 */}
      <Section title="헤어 색상">
        <ColorGrid>
          {palettes.hair_common.slice(0, 12).map((color: string) => (
            <ColorButton
              key={color}
              color={color}
              active={customization.parts.hair.color === color}
              onClick={() =>
                onChange({ ...customization, parts: { ...customization.parts, hair: {...customization.parts.hair, color:color } } })
              }
            >
              {color}
            </ColorButton>
          ))}
        </ColorGrid>
      </Section>

      {/* 상의 스타일 */}
      <Section title="상의 스타일">
        <ButtonGroup>
          {(assets.torso.styles || [])
            .filter(
              (s: any) =>
                !s.genders || s.genders.includes(customization.gender) // ✅ LPCStyle
            )
            .map((style: LPCStyle) => (
              <OptionButton
                key={style.id}
                active={customization.parts.torso.styleId === style.id}
                onClick={() =>{
                  onChange({ ...customization, parts: { ...customization.parts, torso: {...customization.parts.torso, styleId: style.id } }})
                }
                }
              >
                {style.id}
              </OptionButton>
            ))}
        </ButtonGroup>
      </Section>

      {/* 상의 색상 */}
      <Section title="상의 색상">
        <ColorGrid>
          {palettes.clothes_common.slice(0, 12).map((color: string) => (
            <ColorButton
              key={color}
              color={color}
              active={customization.parts.torso.color === color}
              onClick={() =>
                onChange({ ...customization, parts: { ...customization.parts, torso: {...customization.parts.torso, color:color } } })
              }
            >
              {color}
            </ColorButton>
          ))}
        </ColorGrid>
      </Section>
      
       {/* 하의 스타일 */}
      <Section title="하의 스타일">
        <ButtonGroup>
          {(assets.legs.styles || [])
            .filter(
              (s: any) =>
                !s.genders || s.genders.includes(customization.gender) // ✅ LPCStyle
            )
            .map((style: LPCStyle) => (
              <OptionButton
                key={style.id}
                active={customization.parts.legs.styleId === style.id}
                onClick={() =>{
                  onChange({ ...customization, parts: { ...customization.parts, legs: {...customization.parts.legs, styleId: style.id } }})
                }
                }
              >
                {style.id}
              </OptionButton>
            ))}
        </ButtonGroup>
      </Section>

      {/* 하의 색상 */}
      <Section title="하의 색상">
        <ColorGrid>
          {palettes.clothes_common.slice(0, 12).map((color: string) => (
            <ColorButton
              key={color}
              color={color}
              active={customization.parts.legs.color === color}
              onClick={() =>
                onChange({ ...customization, parts: { ...customization.parts, legs: {...customization.parts.legs, color:color } } })
              }
            >
              {color}
            </ColorButton>
          ))}
        </ColorGrid>
      </Section>

      {/* 신발 스타일 */}
      <Section title="신발 스타일">
        <ButtonGroup>
          {(assets.feet.styles || [])
            .filter(
              (s: any) =>
                !s.genders || s.genders.includes(customization.gender) // ✅ LPCStyle
            )
            .map((style: LPCStyle) => (
              <OptionButton
                key={style.id}
                active={customization.parts.feet.styleId === style.id}
                onClick={() =>{
                  onChange({ ...customization, parts: { ...customization.parts, feet: {...customization.parts.torso, styleId: style.id } }})
                }
                }
              >
                {style.id}
              </OptionButton>
            ))}
        </ButtonGroup>
      </Section>

      {/* 하의 색상 */}
      <Section title="신발 색상">
        <ColorGrid>
          {palettes.clothes_common.slice(0, 12).map((color: string) => (
            <ColorButton
              key={color}
              color={color}
              active={customization.parts.feet.color === color}
              onClick={() =>
                onChange({ ...customization, parts: { ...customization.parts, feet: {...customization.parts.feet, color:color } } })
              }
            >
              {color}
            </ColorButton>
          ))}
        </ColorGrid>
      </Section>
    </div>
  );
}

// ============================================================
// UI 컴포넌트들
// ============================================================
  
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "30px" }}>
      <h3 style={{ fontSize: "18px", marginBottom: "15px", color: "#ffff00" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function ButtonGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      {children}
    </div>
  );
}

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        fontSize: "14px",
        fontWeight: active ? "bold" : "normal",
        backgroundColor: active ? "#ffff00" : "#444",
        color: active ? "#000" : "#fff",
        border: active ? "2px solid #ffff00" : "2px solid #666",
        borderRadius: "6px",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      {children}
    </button>
  );
}

function ColorGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "10px",
      }}
    >
      {children}
    </div>
  );
}

function ColorButton({
  active,
  onClick,
  children,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px",
        fontSize: "12px",
        backgroundColor: active ? "#ffff00" : "#333",
        color: active ? "#000" : "#aaa",
        border: active ? "2px solid #ffff00" : "2px solid #555",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "all 0.2s",
        textTransform: "capitalize",
      }}
    >
      {children}
    </button>
  );
}
