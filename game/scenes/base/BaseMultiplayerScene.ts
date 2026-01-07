// game/scenes/base/BaseMultiplayerScene.ts
import { BaseGameScene } from "./BaseGameScene";
import { BaseOnlineUIManager } from "@/game/managers/base/multiplayer/ui/BaseOnlineUIManager";
import { BaseNetworkManager } from "@/game/managers/base/BaseNetworkManager";
import { COMMON_COLORS, FONT_CONFIG } from "@/game/types/common/ui.constants";
import type { RoomUIConfig } from "@/game/types/common/ui.types";

/**
 * 기본 Room UI 설정
 */
const DEFAULT_ROOM_UI_CONFIG: RoomUIConfig = {
  colors: {
    panel: COMMON_COLORS.PANEL_DARK,
    primary: COMMON_COLORS.PRIMARY,
    danger: COMMON_COLORS.DANGER,
    cardActive: COMMON_COLORS.PANEL_LIGHT,
    cardInactive: COMMON_COLORS.NEUTRAL,
    subText: COMMON_COLORS.TEXT_SECONDARY,
    gold: COMMON_COLORS.TEXT_GOLD,
  },
  layout: {
    panelWidth: 650,
    panelHeight: 700,
    roomCardWidth: 550,
    roomCardHeight: 80,
    roomCardSpacing: 90,
    playerCardHeight: 90,
    playerCardSpacing: 110,
    buttonGap: 20,
  },
  textStyle: {
    title: {
      fontSize: "48px",
      fontFamily: FONT_CONFIG.FAMILY,
      color: COMMON_COLORS.TEXT_PRIMARY,
      fontStyle: "bold",
    },
    normal: {
      fontSize: "20px",
      fontFamily: FONT_CONFIG.FAMILY,
      color: COMMON_COLORS.TEXT_PRIMARY,
    },
  },
};

/**
 * 게임 모드
 */
export enum GameMode {
  NONE = "NONE",
  SINGLE = "SINGLE", // AI 대전
  LOCAL = "LOCAL", // 로컬 2인
  ONLINE = "ONLINE", // 온라인 멀티
}

/**
 * 모드 선택 옵션
 */
export interface ModeSelectionConfig {
  enableSingle?: boolean;
  enableLocal?: boolean;
  enableOnline?: boolean;
  singleLabel?: string;
  localLabel?: string;
  colors?: {
    primary?: number;
    secondary?: number;
    panel?: number;
  };
}

/**
 * BaseMultiplayerScene
 * - 모든 멀티플레이 게임의 공통 베이스 클래스
 * - 모드 선택, 온라인 매칭, 방 관리 등 공통 기능 제공
 * - 게임별 로직은 추상 메서드로 위임
 *
 * BaseGameScene을 상속받는 이유:
 * - BaseGameScene의 라이프사이클 관리 재사용
 * - initManagers(), createGameObjects() 등 기본 기능 활용
 * - 씬 전환, 정리 등 공통 유틸리티 사용
 */
export abstract class BaseMultiplayerScene extends BaseGameScene {
  // =====================================================================
  // 공통 상태
  // =====================================================================
  protected currentMode: GameMode = GameMode.NONE;
  protected isGameStarted = false;

  // =====================================================================
  // 온라인 멀티플레이 상태
  // =====================================================================
  protected myColor: number = 0;
  protected isColorAssigned = false;
  protected currentRoomId: string | null = null;

  // =====================================================================
  // 공통 매니저
  // =====================================================================
  protected onlineUIManager!: BaseOnlineUIManager;
  protected networkManager!: BaseNetworkManager;

  // =====================================================================
  // 추상 메서드 (게임별 구현 필수)
  // =====================================================================

  /**
   * 게임별 매니저 초기화
   * 예: OmokManager, ChessManager 등
   */
  protected abstract initGameManagers(): void;

  /**
   * 게임별 오브젝트 생성
   * 예: 보드 렌더링, 입력 핸들러 등
   */
  protected abstract createGameSpecificObjects(): void;

  /**
   * 싱글 모드 시작
   */
  protected abstract startSingleMode(): void;

  /**
   * 로컬 모드 시작
   */
  protected abstract startLocalMode(): void;

  /**
   * 온라인 게임 시작 (색깔 할당 후)
   */
  protected abstract handleOnlineGameStart(): void;

  /**
   * 상대방 수 처리
   */
  protected abstract handleOpponentMove(data: any): void;

  /**
   * 게임 종료 처리
   */
  protected abstract handleGameEnd(winner: any): void;

  /**
   * 네트워크 이벤트 prefix 반환
   */
  protected abstract getGamePrefix(): string;

  /**
   * 모드 선택 UI 렌더러 반환
   * 각 게임의 UIManager를 사용
   */
  protected abstract getModeSelectionUI(): {
    show: (onSelect: (mode: any) => void) => void;
  };

  // =====================================================================
  // BaseGameScene 라이프사이클 오버라이드
  // =====================================================================

  protected setupScene(): void {
    // 멀티플레이 게임 공통 씬 설정
    // 게임별로 필요하면 오버라이드 가능
  }

  protected initManagers(): void {
    // 1. 공통 매니저 초기화
    this.onlineUIManager = new BaseOnlineUIManager(
      this,
      DEFAULT_ROOM_UI_CONFIG
    );

    // 2. 게임별 매니저 초기화 (추상 메서드)
    this.initGameManagers();
  }

  protected createGameObjects(): void {
    // 게임별 오브젝트 생성 (추상 메서드)
    this.createGameSpecificObjects();
  }

  // =====================================================================
  // 모드 선택
  // =====================================================================

  /**
   * 모드 선택 화면 표시
   * 각 게임의 UIManager를 통해 렌더링
   */
  protected showModeSelection(): void {
    const modeUI = this.getModeSelectionUI();
    modeUI.show((mode: any) => this.handleModeSelect(mode));
  }

  /**
   * 모드 선택 처리
   */
  protected handleModeSelect(mode: any): void {
    // GameMode enum 대신 각 게임의 모드 enum 사용
    const modeStr = String(mode);

    if (modeStr.includes("SINGLE")) {
      this.currentMode = GameMode.SINGLE;
      this.startSingleMode();
    } else if (modeStr.includes("LOCAL")) {
      this.currentMode = GameMode.LOCAL;
      this.startLocalMode();
    } else if (modeStr.includes("ONLINE")) {
      this.currentMode = GameMode.ONLINE;
      this.showOnlineMenu();
    }
  }

  // =====================================================================
  // 온라인 메뉴
  // =====================================================================

  /**
   * 온라인 메뉴 표시
   */
  protected showOnlineMenu(): void {
    this.onlineUIManager.showOnlineMenu({
      onQuickJoin: () => this.handleQuickMatch(),
      onCreateRoom: () => this.handleCreateRoom(),
      onShowList: () => this.handleShowRoomList(),
      onBack: () => this.handleBackFromOnlineMenu(),
      onMainMove: () => this.handleGoToMain(),
      colors: this.getOnlineMenuColors(),
    });
  }

  /**
   * 온라인 메뉴 색상 (게임별 오버라이드 가능)
   */
  protected getOnlineMenuColors() {
    return {
      primary: COMMON_COLORS.PRIMARY,
      secondary: COMMON_COLORS.SECONDARY,
      panel: COMMON_COLORS.PANEL_DARK,
    };
  }

  // =====================================================================
  // 빠른 매칭
  // =====================================================================

  /**
   * 빠른 매칭 시작
   */
  protected handleQuickMatch(): void {
    console.log(`[${this.getGamePrefix()}] 빠른 매칭 시작`);

    this.onlineUIManager.hideOnlineMenu();
    this.networkManager.getSocket().emit(`${this.getGamePrefix()}:quickMatch`);
  }

  // =====================================================================
  // 방 관리 (게임별 오버라이드)
  // =====================================================================

  /**
   * 방 생성
   * 각 게임에서 RoomManager 사용하여 구현
   */
  protected handleCreateRoom(): void {
    const roomName = prompt("방 제목을 입력하세요");
    if (!roomName || roomName.trim() === "") return;

    this.onlineUIManager.hideOnlineMenu();
    // 자식 클래스에서 오버라이드하여 RoomManager 호출
  }

  /**
   * 방 목록 표시
   * 각 게임에서 RoomManager 사용하여 구현
   */
  protected handleShowRoomList(): void {
    this.onlineUIManager.hideOnlineMenu();
    // 자식 클래스에서 오버라이드하여 RoomManager 호출
  }

  /**
   * 온라인 메뉴에서 뒤로가기
   */
  protected handleBackFromOnlineMenu(): void {
    this.onlineUIManager.hideOnlineMenu();
    this.showModeSelection();
  }

  /**
   * 메인 화면으로
   */
  protected handleGoToMain(): void {
    this.scene.start("MainScene");
  }

  // =====================================================================
  // 색깔 할당
  // =====================================================================

  /**
   * 색깔 할당 처리 (공통)
   */
  protected handleColorAssigned(color: number, roomId?: string): void {
    console.log(`[${this.getGamePrefix()}] 색깔 할당:`, color, roomId);

    this.myColor = color;
    this.isColorAssigned = true;

    if (roomId) {
      this.currentRoomId = roomId;
    }

    this.currentMode = GameMode.ONLINE;

    // 게임별 온라인 게임 시작 로직 (추상 메서드)
    this.handleOnlineGameStart();
  }

  // =====================================================================
  // 게임 중단 처리
  // =====================================================================

  /**
   * 게임 중단 UI 표시
   */
  protected showGameAbortedUI(reason: string, leavingPlayer: string): void {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 모든 UI 정리
    this.clearAllUI();

    const ABORT_UI_DEPTH = 10000;

    // 배경 오버레이
    this.add
      .rectangle(centerX, centerY, width, height, 0x000000, 0.8)
      .setDepth(ABORT_UI_DEPTH - 1);

    // 메시지들
    this.add
      .text(centerX, centerY - 100, "게임이 중단되었습니다", {
        fontSize: "42px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(ABORT_UI_DEPTH);

    this.add
      .text(centerX, centerY - 30, `사유: ${reason}`, {
        fontSize: "24px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5)
      .setDepth(ABORT_UI_DEPTH);

    this.add
      .text(centerX, centerY + 20, `${leavingPlayer}님이 방을 나갔습니다`, {
        fontSize: "24px",
        color: "#aaaaaa",
      })
      .setOrigin(0.5)
      .setDepth(ABORT_UI_DEPTH);

    // 확인 버튼
    const okButton = this.add
      .rectangle(centerX, centerY + 100, 200, 60, COMMON_COLORS.PRIMARY)
      .setInteractive({ useHandCursor: true })
      .setDepth(ABORT_UI_DEPTH);

    this.add
      .text(centerX, centerY + 100, "확인", {
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(ABORT_UI_DEPTH);

    okButton.on("pointerdown", () => {
      this.scene.restart();
    });
  }

  // =====================================================================
  // 유틸리티
  // =====================================================================

  /**
   * 모든 UI 정리 (게임별로 오버라이드 가능)
   */
  protected clearAllUI(): void {
    this.onlineUIManager.hideOnlineMenu();
  }

  /**
   * 게임 재시작
   */
  protected restartGame(): void {
    this.currentMode = GameMode.NONE;
    this.isGameStarted = false;
    this.myColor = 0;
    this.isColorAssigned = false;
    this.currentRoomId = null;

    this.scene.restart();
  }
}
