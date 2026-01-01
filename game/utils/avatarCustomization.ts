// game/utils/avatarCustomization.ts
import type { CharacterState } from "@/components/avatar/utils/LpcTypes";
import type { AvatarManager } from "@/game/managers/global/AvatarManager";
import type { AvatarDataManager } from "@/game/managers/global/AvatarDataManager";

/**
 * 아바타 커스터마이징 공통 적용 함수
 *
 * 1. 게임 내 정본(CharacterState) 업데이트
 * 2. 맵에 렌더링 즉시 반영
 * 3. 로컬스토리지 저장
 *
 * ⚠️ 서버 저장은 여기서 하지 않는다 (UI / 비동기 레이어 책임)
 */
export function applyAvatarCustomization(
  next: CharacterState,
  avatarDataManager: AvatarDataManager,
  avatarManager: AvatarManager
) {
  // 1️⃣ 게임 내 정본 업데이트
  avatarDataManager.setCustomization(next);

  // 2️⃣ 화면 즉시 반영 (Phaser 아바타)
  avatarManager.getContainer().setCustomPart(next);

  // 3️⃣ 로컬스토리지 저장
  avatarDataManager.saveToStorage();
}

/**
 * 파츠(styleId) 변경용 next state 생성
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
        ...current.parts[partKey],
        styleId,
      },
    },
  };
}

/**
 * 색상(color) 변경용 next state 생성
 * 여러 파츠 동시 변경 가능
 */
export function buildNextColorState(
  current: CharacterState,
  partKeys: (keyof CharacterState["parts"])[],
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
