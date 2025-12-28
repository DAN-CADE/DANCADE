// game/types/omok/omok.ui.types.ts

/**
 * 오목 UI 관련 타입
 * - 보드 그래픽 상태, 플레이어 프로필 UI 등
 */

// =====================================================================
// 보드 그래픽 상태
// =====================================================================

/**
 * 보드 그래픽 상태
 * - stoneNumbers: 각 돌에 표시되는 수순 텍스트 배열
 * - forbiddenMarkers: 금수 위치 마커(X) 배열
 * - moveCount: 현재까지 둔 수의 개수
 */
export interface OmokBoardState {
  stoneNumbers: Phaser.GameObjects.Text[];
  forbiddenMarkers: Phaser.GameObjects.Text[];
  moveCount: number;
}

// =====================================================================
// UI 컴포넌트 상태
// =====================================================================

/**
 * UI 상태
 * - modeSelectionContainer: 모드 선택 화면 컨테이너
 * - forbiddenText: 금수 경고 메시지 텍스트
 */
export interface OmokUIState {
  modeSelectionContainer?: Phaser.GameObjects.Container;
  forbiddenText?: Phaser.GameObjects.Text;
}

/**
 * 플레이어 프로필 UI 구성 요소
 * - bg: 배경 사각형
 * - statusTxt: 상태 텍스트 ("내 차례!", "대기 중" 등)
 */
export interface PlayerProfile {
  bg: Phaser.GameObjects.Rectangle;
  statusTxt: Phaser.GameObjects.Text;
  color?: number;
}

/**
 * 플레이어 정보 UI 컨테이너
 * - me: 내 프로필
 * - opponent: 상대 프로필
 */
export interface PlayerInfoUI {
  me?: PlayerProfile;
  opponent?: PlayerProfile;
}
