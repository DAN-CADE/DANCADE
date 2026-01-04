import { BUTTON_SIZE } from "@/game/types/common/ui.constants";

// =====================================================================
// =====================================================================

export interface ButtonConfig<T> {
  label: string;
  value: T; // 예: OmokMode.SINGLE
  color: number;
  size?: { width: number; height: number };
}

// =====================================================================
// =====================================================================

export interface ButtonOptions {
  size?: ButtonSizeKey;
  color?: number;
  textColor?: string;
  fontSize?: string;
  fontFamily?: string;
  cornerRadius?: number;
}

// =====================================================================
// =====================================================================

export interface LayoutInfo {
  buttonHeight: number;
  buttonGap: number;
  paddingTop: number;
  spacing: number;
}

// =====================================================================
// =====================================================================

export interface EndGameUIConfig {
  colors: {
    overlay: number;
    overlayAlpha: number;
    winnerText: string;
    buttonPrimary: number;
    buttonDanger: number;
  };
  layout: {
    winnerTextY: number;
    buttonYOffset: number;
    buttonSpacing: number;
    buttonWidth: number;
    buttonHeight: number;
  };
  textStyle: {
    winner: Partial<Phaser.Types.GameObjects.Text.TextStyle>;
  };
  depth: number;
}

// =====================================================================
// =====================================================================

export interface RoomUIConfig {
  colors: {
    panel: number; // 배경 패널 색상
    primary: number; // 기본 버튼 색상 (Ready, Start 등)
    danger: number; // 위험/취소 버튼 색상 (Exit, Back 등)
    cardActive: number; // 내 정보 카드 색상
    cardInactive: number; // 타인 정보 카드 색상
    subText: string; // 보조 텍스트 색상 (#ffffff 형태)
    gold: string; // 강조/준비 완료 텍스트 색상
  };
  layout: {
    panelWidth: number;
    panelHeight: number;
    roomCardWidth: number;
    roomCardHeight: number;
    roomCardSpacing: number;
    playerCardHeight: number;
    playerCardSpacing: number;
    buttonGap?: number;
  };
  textStyle: {
    title: Partial<Phaser.Types.GameObjects.Text.TextStyle>;
    normal: Partial<Phaser.Types.GameObjects.Text.TextStyle>;
  };
}

// =====================================================================
// =====================================================================

export interface GameAbortedDialogConfig {
  colors: {
    overlay: number;
    overlayAlpha: number;
    titleText: string;
    reasonText: string;
    buttonColor: number;
  };
  textStyle: {
    title: Partial<Phaser.Types.GameObjects.Text.TextStyle>;
    reason: Partial<Phaser.Types.GameObjects.Text.TextStyle>;
  };
}

// =====================================================================
// =====================================================================

export interface OnlineMenuOptions {
  onQuickJoin: () => void;
  onCreateRoom: () => void;
  onShowList: () => void;
  onBack: () => void;
  onMainMove: () => void;
  colors: { primary: number; secondary: number; panel: number };
}

export type MenuButtonConfig = {
  label: string;
  onClick: () => void;
  color: number;
  textColor: string;
};

// =====================================================================
// =====================================================================

export type ButtonSizeKey = keyof typeof BUTTON_SIZE;
