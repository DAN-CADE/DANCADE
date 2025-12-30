// app/character-select/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEY } from "@/constants/character";
import {
  generateGuestId,
  generateGuestNickname,
} from "@/lib/utils/guestNickname";
import { useLPCData } from "@/hooks/useLPCData";
import { useCharacterCustomization } from "@/hooks/useCharacterCustomization";
import { useAuth } from "@/hooks/useAuth";
import { useGuestAuth } from "@/hooks/useGuestAuth";
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
  const [isAssetLoading, setIsAssetLoading] = useState(true);
  const { getCurrentUser } = useAuth();
  const { getStoredUser } = useGuestAuth();

  // 1. 상태 관리
  const { lpcData, isLoading, error } = useLPCData();
  const {
    customization,
    setCustomization,
    handleRandomize,
    handleGenderChange,
  } = useCharacterCustomization(lpcData);

  // 사용자 정보 확인
  useEffect(() => {
    const memberUser = getCurrentUser();
    const guestUser = getStoredUser();

    // 로그인한 회원도 없고, 게스트도 없으면 로그인 페이지로 이동
    if (!memberUser && !guestUser) {
      router.push("/auth/login/id");
    }
  }, [router]);

  // 2. 아바타 렌더링이 완료되면 실행될 함수
  const handleAvatarLoaded = useCallback(() => {
    setIsAssetLoading(false);
  }, []);

  // 3. 이벤트 핸들러
  const handleStartGame = useCallback(() => {
    if (!customization) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(customization));

    // 로그인한 회원인지 확인
    const memberUser = getCurrentUser();

    // 게스트 사용자인 경우에만 게스트 데이터 생성
    if (!memberUser) {
      const guestId = generateGuestId();
      const nickname = generateGuestNickname();

      const userData = {
        userId: guestId,
        nickname: nickname,
        isGuest: true,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("user", JSON.stringify(userData));
    }
    // 로그인한 회원은 기존 정보 유지

    router.push("/game");
  }, [customization, router, getCurrentUser]);

  // 4. 조건부 렌더링
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
    <div className="flex items-start min-h-screen bg-[#1a1a1a] text-white font-neo">
      {/* 왼쪽: 미리보기 영역 */}
      <div className="w-1/2 flex flex-col items-center justify-center p-10 sticky top-1/2 -translate-y-1/2">
        <div className="w-[400px] h-[400px] border-[3px] border-[#555] rounded-[10px] bg-[#2d2d2d] overflow-hidden relative">
          {isAssetLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          <AvatarPreview
            customization={previewState}
            onLoad={handleAvatarLoaded}
          />
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
