/** Real Ping Pong 게임 타입 정의 */

/** 패들 데이터 */
export interface PingPongPaddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  sprite?: Phaser.GameObjects.Image;
}

/** 볼 데이터 */
export interface PingPongBall {
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  speed: number;
  sprite?: Phaser.GameObjects.Image;
  motionSprite?: Phaser.GameObjects.Image; // 트레일 효과용
}

/** 게임 상태 */
export interface PingPongGameState {
  playerScore: number;
  aiScore: number;
  isPlaying: boolean;
  isPaused: boolean;
  servingPlayer: "player" | "ai";
  gameMode: "menu" | "colorSelect" | "playing";
  isPreparingServe: boolean;
}

/** 게임 설정 상수 */
export const PINGPONG_CONFIG = {
  // 화면 크기
  GAME_WIDTH: 800,
  GAME_HEIGHT: 600,

  // 패들 설정 (실제 에셋 크기에 맞춤)
  PADDLE_SPEED: 400,
  PADDLE_OFFSET: 80, // 벽에서 패들까지의 거리
  PADDLE_SCALE: 0.6,
  PADDLE_SIZE_RATIO: 0.15, // 탁구대 대비 패들 크기 비율

  // 볼 설정
  BALL_INITIAL_SPEED: 300,
  BALL_SPEED_INCREASE: 30,
  BALL_MAX_SPEED: 800,
  BALL_SCALE: 0.6,

  // 게임 규칙
  WINNING_SCORE: 11, // 진짜 탁구는 11점
  DUECE_SCORE: 10, // 듀스 시작 점수
  WINNING_MARGIN: 2, // 승리 필요 점수 차이

  // AI 설정
  AI_SPEED: 350, // AI 속도
  AI_REACTION_DELAY: 0.1, // AI 반응 지연 (초)
  AI_MOVE_THRESHOLD: 20, // AI 움직임 임계값

  // 서브 설정
  SERVE_DELAY: 2000, // 서브 전 대기 시간 (ms)
  POINT_DELAY: 1500, // 득점 후 대기 시간 (ms)

  // UI 설정
  SCORE_OFFSET_X: 80, // 점수 텍스트 X 오프셋
  SCORE_Y: 45, // 점수 텍스트 Y 위치
  SCORE_FONT_SIZE: "36px",
  STATUS_Y_OFFSET: 25, // 상태 텍스트 Y 오프셋

  // 보드 설정
  BOARD_SCALE_MARGIN: 0.9, // 보드 스케일 여백 (10% 여백)
  BOARD_UI_SPACE: 120, // UI를 위한 공간
  BOARD_BOUNDARY_OFFSET: 20, // 보드 경계 오프셋
  BOARD_PADDLE_MARGIN: 30, // 보드 가장자리에서 패들까지 거리

  // 네트 설정
  NET_HEIGHT: 15, // 네트 높이 (픽셀) - 더 낮게 조정
  NET_POST_OFFSET: 2, // 네트 포스트 오프셋
  NET_POST_SIZE: 4, // 네트 포스트 크기
  NET_POST_HEIGHT: 30, // 네트 포스트 높이 - 더 낮게 조정
  NET_MESH_WIDTH: 6, // 네트 메쉬 너비
  NET_COLLISION_REDUCTION: 0.7, // 네트 충돌 시 속도 감소 - 덜 강하게
  NET_BOUNCE_ADDITION: 30, // 네트 충돌 시 추가 Y 속도 - 덜 강하게

  // 물리 설정
  TABLE_ENERGY_LOSS: 0.8, // 테이블 충돌 시 에너지 손실
  MAX_BOUNCE_ANGLE: Math.PI / 3, // 최대 반사 각도 (60도)
  BALL_PREVIOUS_FRAME_TIME: 0.016, // 이전 프레임 시간 추정 (60fps 기준)

  // 애니메이션 설정
  SCORE_PULSE_SCALE: 1.4, // 점수 펄스 스케일
  SCORE_PULSE_DURATION: 150, // 점수 펄스 지속 시간 (ms)
  POPUP_FONT_SIZE: "28px",
  POPUP_RISE_DISTANCE: 60, // 팝업 상승 거리
  POPUP_DURATION: 1000, // 팝업 애니메이션 지속 시간 (ms)
  FLASH_RADIUS: 50, // 플래시 효과 반지름
  FLASH_SCALE: 3, // 플래시 최대 스케일
  FLASH_DURATION: 400, // 플래시 지속 시간 (ms)

  // 색상 설정
  BACKGROUND_COLOR: "#2c2c2c", // 어두운 배경
  TABLE_COLOR: 0x4a7c59, // 탁구대 녹색 (더 밝은 녹색)
  NET_POST_COLOR: 0x333333, // 네트 포스트 색상 (진한 회색)
  NET_MESH_COLOR: 0xf0f0f0, // 네트 메쉬 색상 (밝은 회색)
  NET_MESH_ALPHA: 0.8, // 네트 메쉬 투명도
  PARTICLE_COLOR: 0xffff99, // 파티클 색상 (노란빛)

  // 패들 색상 옵션 (진짜 탁구 테마)
  PADDLE_COLORS: [
    { color: 0xff2020 }, // 빨강
    { color: 0x0066ff }, // 파랑
  ] as const,

  // 기본 패들 색상 인덱스
  DEFAULT_PLAYER_PADDLE_COLOR: 0, // 빨강
  DEFAULT_AI_PADDLE_COLOR: 1, // 파랑
} as const;

/** 입력 상태 */
export interface PingPongInputState {
  upPressed: boolean;
  downPressed: boolean;
  spacePressed: boolean;
}
