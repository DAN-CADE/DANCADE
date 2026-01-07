// app/character-select/page.tsx
"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { STORAGE_KEY } from "@/constants/character";
import { generateGuestNickname } from "@/lib/utils/guestNickname";
import { generateGuestId } from "@/lib/utils/auth";
import { useLPCData } from "@/hooks/useLPCData";
import { useCharacterCustomization } from "@/hooks/useCharacterCustomization";
import { useAuth } from "@/hooks/auth/useAuth";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { useCharacterSave } from "@/hooks/character/useCharacterSave";
import { ActionButton } from "@/components/character-select/Button";
import { CustomizationPanel } from "@/components/character-select/CustomizationPanel";
import { LoadingScreen } from "@/components/character-select/Loading";
import { ErrorScreen } from "@/components/character-select/Error";
import Window from "@/components/common/Window";
import { getItemById } from "@/lib/supabase/item";
import { saveItemToInventory } from "@/lib/supabase/inventory";

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
  const { saveCharacter } = useCharacterSave();

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
  const handleStartGame = useCallback(async () => {
    if (!customization) return;

    // 1️⃣ localStorage는 무조건 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customization));

    const memberUser = getCurrentUser();

    // 2️⃣ 회원일 경우만 DB 저장
    if (memberUser) {
      const result = await saveCharacter(memberUser.id, customization);

      if (!result) {
        alert("캐릭터 저장 실패");
        return;
      } else {
        const parts = customization.parts;
        const partKeys = ["hair", "torso", "legs", "feet"] as const;

        await Promise.all(
          partKeys.map(async (key) => {
            const styleId = parts[key]?.styleId;
            if (!styleId) return;

            const data = await getItemById(styleId);
            const id = (data as { id: string }[] | null)?.[0]?.id;
            if (id) {
              await saveItemToInventory(memberUser.id, id);
            }
          })
        );
      }
    }

    // 3️⃣ 게스트면 유저 정보 생성 (기존 로직 유지)
    if (!memberUser) {
      const guestId = generateGuestId();
      const nickname = generateGuestNickname();

      localStorage.setItem(
        "user",
        JSON.stringify({
          userId: guestId,
          nickname,
          isGuest: true,
          createdAt: new Date().toISOString(),
        })
      );
    }

    // 4️⃣ 게임 시작
    router.push("/game");
  }, [customization, getCurrentUser, router, saveCharacter]);

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
    <Window title="character">
      <div className="w-full">
        <div className="flex w-full  text-white font-neo">
          {/* 왼쪽: 미리보기 영역 */}
          <div className="w-1/2 flex flex-col items-center justify-center p-10">
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
          <div className="w-1/2 p-10 max-h-[700px] overflow-y-auto">
            <CustomizationPanel
              lpcData={lpcData}
              customization={customization}
              onChange={setCustomization}
              onGenderChange={handleGenderChange}
            />
          </div>
        </div>
      </div>
    </Window>
  );
}
