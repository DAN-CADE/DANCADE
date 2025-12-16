// app/character-select/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEY } from "@/constants/character";
import { useLPCData } from "@/hooks/useLPCData";
import { useCharacterCustomization } from "@/hooks/useCharacterCustomization";
import { ActionButton } from "@/components/character-select/Button";
import { CustomizationPanel } from "@/components/character-select/CustomizationPanel";
import { LoadingScreen } from "@/components/character-select/Loading";
import { ErrorScreen } from "@/components/character-select/Error";

// ------------------------------------------------------------
// SSR 방지
// ------------------------------------------------------------
const AvatarPreview = dynamic(
  () => import("@/components/avatar/ui/AvatarPreview"),
  { ssr: false }
);

// ------------------------------------------------------------
// 메인 컴포넌트
// ------------------------------------------------------------

export default function CharacterSelect() {
  const router = useRouter();

  // 1. 상태 관리
  const { lpcData, isLoading, error } = useLPCData();
  const {
    customization,
    setCustomization,
    handleRandomize,
    handleGenderChange,
  } = useCharacterCustomization(lpcData);

  // 2. 이벤트 핸들러
  const handleStartGame = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customization));
      router.push("/game");
    } catch {
      alert("캐릭터 정보 저장에 실패했습니다.");
    }
  }, [customization, router]);

  // 3. 조건부 렌더링
  if (isLoading || !customization) {
    return <LoadingScreen />;
  }
  if (error || !lpcData) {
    return <ErrorScreen error={error} />;
  }

  //
  const previewState = customization;

  // 4. UI 구성
  return (
    <div className="flex min-h-screen bg-[#1a1a1a] text-white font-neo">
      {/* 왼쪽: 미리보기 영역 */}
      <div className="w-1/2 flex flex-col items-center justify-center p-10">
        <div className="w-[400px] h-[400px] border-[3px] border-[#555] rounded-[10px] bg-[#2d2d2d] overflow-hidden">
          <AvatarPreview customization={previewState} />
        </div>

        {/* 액션 버튼 그룹 */}
        <div className="flex gap-[15px] mt-[30px]">
          <ActionButton onClick={handleRandomize}>랜덤 생성</ActionButton>
          <ActionButton onClick={handleStartGame}>게임 시작</ActionButton>
        </div>
      </div>

      {/* 오른쪽: 커스터마이징 패널 */}
      <div className="w-1/2 p-10 overflow-y-auto bg-[#252525]">
        <CustomizationPanel
          lpcData={lpcData}
          customization={customization}
          onChange={setCustomization}
          onGenderChange={handleGenderChange}
        />
      </div>
    </div>
  );
}
