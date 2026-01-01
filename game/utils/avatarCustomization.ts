import type { CharacterState } from "@/components/avatar/utils/LpcTypes";
import type { AvatarManager } from "@/game/managers/global/AvatarManager";
import type { AvatarDataManager } from "@/game/managers/global/AvatarDataManager";

/**
 * 공통 적용 함수
 * - 정본 업데이트
 * - 화면 렌더링
 * - 로컬스토리지 저장
 */
export function applyAvatarState(
  next: CharacterState,
  avatarDataManager: AvatarDataManager,
  avatarManager: AvatarManager
) {
  // 1️⃣ 정본 업데이트
  avatarDataManager.setCustomization(next);

  // 2️⃣ 화면 즉시 반영
  avatarManager.getContainer().setCustomPart(next);

  // 3️⃣ 로컬스토리지 저장
  avatarDataManager.saveToStorage();
}

/**
 * ✅ 파츠 변경 (styleId만 변경, color 유지)
 * 네 기존 onEquipPart 로직 그대로
 */
export function buildNextPartState(
  current: CharacterState,
  partKey: keyof CharacterState["parts"],
  styleId: string
): CharacterState {
  return {
    ...current,
    parts: {
      ...current.parts,
      [partKey]: {
        ...current.parts[partKey], // ✅ 기존 color 유지
        styleId,
      },
    },
  };
}

/**
 * ✅ 색상 변경 (color만 변경, styleId 유지)
 * 네 기존 onEquipColor 로직 그대로
 */
export function buildNextColorState(
  current: CharacterState,
  partKeys: readonly (keyof CharacterState["parts"])[],
  color: string
): CharacterState {
  const nextParts = { ...current.parts };

  partKeys.forEach((key) => {
    nextParts[key] = {
      ...nextParts[key],
      color,
    };
  });

  return {
    ...current,
    parts: nextParts,
  };
}
