// game/managers/global/AvatarDataManager.ts
import { BaseGameManager } from "../base/BaseGameManager";
import { CharacterState } from "@/components/avatar/utils/LpcTypes";
import { STORAGE_KEY } from "@/constants/character";

// 1. 상태 타입 정의
interface AvatarState {
  customization: CharacterState | null;
}

// 2. 콜백 타입 정의
interface AvatarCallbacks {
  onDataUpdate?: (data: CharacterState) => void;
  [key: string]: unknown;
}

export class AvatarDataManager extends BaseGameManager<
  AvatarState,
  AvatarCallbacks
> {
  constructor(scene: Phaser.Scene, callbacks: AvatarCallbacks = {}) {
    // 초기 상태 설정
    super(scene, { customization: null }, callbacks);
    this.loadFromStorage();
  }

  // 로컬 스토리지에서 기존 데이터를 불러오거나 초기화
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.gameState.customization = JSON.parse(saved);
      }
    } catch (e) {
      console.error("아바타 데이터 로드 실패:", e);
    }
  }

  // 현재 데이터를 로컬 스토리지에 저장
  public saveToStorage(): void {
    if (this.gameState.customization) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.gameState.customization)
      );
    }
  }

  // 특정 파츠의 속성(스타일 또는 색상)을 업데이트
  public updatePart(
    part: string,
    value: { styleId?: string; color?: string }
  ): void {
    if (!this.gameState.customization) return;

    const currentParts = this.gameState.customization.parts;

    // 해당 파츠 데이터 업데이트
    this.gameState.customization.parts = {
      ...currentParts,
      [part]: {
        ...(currentParts[part as keyof typeof currentParts] || {}),
        ...value,
      },
    };

    // 데이터 변경 알림 (필요 시)
    this.callCallback("onDataUpdate", this.gameState.customization);
  }

  // 성별을 변경하고 해당 성별의 기본 파츠 세트로 리셋
  // gender 'male' | 'female'
  // defaultProvider AvatarManager의 getInitialPart 함수 연결용
  public changeGender(
    gender: string,
    defaultProvider: (g: string) => CharacterState
  ): void {
    const newData = defaultProvider(gender);
    this.gameState.customization = newData;
    this.callCallback("onDataUpdate", newData);
  }

  // 현재 커스터마이징 상태를 반환
  public get customization(): CharacterState | null {
    return this.gameState.customization;
  }

  // BaseGameManager 구현 필수
  public setGameObjects(): void {
    // 데이터 전용 매니저이므로 비워둠
  }
  public resetGame(): void {
    this.loadFromStorage();
  }
  // 게임 내 아바타 jons 업데이트
  public setCustomization(next: CharacterState): void {
  this.gameState.customization = next;

  // 필요하면 AvatarManager에게 알림
  this.callCallback("onDataUpdate", next);
}
}
