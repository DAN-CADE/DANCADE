// game/managers/PlayerManager.ts

/**
 * PlayerManager - 플레이어 캐릭터 관리 클래스
 *
 * 역할:
 * 1. 플레이어 스프라이트 생성 및 초기화
 * 2. 키보드 입력을 통한 이동 처리
 * 3. 카메라 추적 설정
 * 4. 충돌 박스 설정
 * 5. 플레이어 위치 정보 제공
 *
 * ⚠️ 커스터마이징 포인트:
 * - 이동 속도: PLAYER_SPEED 상수 조정
 * - 캐릭터 스프라이트: create() 메서드의 "player" 키 변경
 * - 충돌 박스: setSize(), setOffset() 값 조정
 * - 애니메이션 추가: createAnimations() 메서드 추가 필요
 */
export class PlayerManager {
  // ============================================================
  // 상수 정의 - 여기서 플레이어 동작 조정
  // ============================================================

  /**
   * PLAYER_SPEED - 플레이어 이동 속도
   * 단위: 픽셀/초
   * 💡 느리게: 100-150, 보통: 200, 빠르게: 250-300
   */
  private readonly PLAYER_SPEED = 200;

  /**
   * CAMERA_LERP - 카메라 따라가기 부드러움 정도
   * 범위: 0.0 (안 따라감) ~ 1.0 (즉시 따라감)
   * 💡 부드럽게: 0.05-0.1, 빠르게: 0.2-0.5
   */
  private readonly CAMERA_LERP = 0.1;

  // ============================================================
  // 프로퍼티
  // ============================================================

  private scene: Phaser.Scene; // 현재 씬 참조
  private player!: Phaser.Physics.Arcade.Sprite; // 플레이어 스프라이트
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys; // 방향키 입력

  /**
   * 생성자
   * @param scene - 플레이어를 생성할 Phaser 씬
   */
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * create - 플레이어 초기화 및 생성
   *
   * 📌 호출 시점: MainScene의 create() 내부
   * 📌 preload에서 미리 로드 필요: this.load.spritesheet("player", ...)
   *
   * @param x - 플레이어 시작 X 좌표
   * @param y - 플레이어 시작 Y 좌표
   *
   * 🔧 커스터마이징 가능:
   * - 스프라이트 키: "player" → "your-character"
   * - 충돌 박스: setSize(너비, 높이)
   * - 시작 프레임: 마지막 파라미터 0 → 다른 프레임
   */
  create(x: number, y: number): void {
    // 1. 플레이어 스프라이트 생성 (물리 바디 포함)
    // "player": preload에서 로드한 스프라이트시트 키
    // 0: 시작 프레임 번호
    this.player = this.scene.physics.add.sprite(x, y, "player", 0);

    // 2. 월드 경계 충돌 활성화 (맵 밖으로 나가지 못하게)
    // this.player.setCollideWorldBounds(true);

    // 3. 충돌 박스 크기 조정
    // 💡 스프라이트 크기 64x64지만 실제 충돌은 더 작게 설정
    // setSize(너비, 높이): 충돌 박스 크기
    this.player.body?.setSize(32, 48);

    // setOffset(x, y): 충돌 박스 위치 조정 (스프라이트 기준)
    // 캐릭터의 발 부분만 충돌하도록 아래쪽으로 이동
    this.player.body?.setOffset(16, 16);

    // 4. 카메라가 플레이어를 부드럽게 추적
    // true: 라운드 픽셀 (선명한 렌더링)
    // CAMERA_LERP: 따라가는 속도 (0.1 = 부드럽게)
    this.scene.cameras.main.startFollow(
      this.player,
      true,
      this.CAMERA_LERP, // X축 보간
      this.CAMERA_LERP // Y축 보간
    );

    // 5. 키보드 입력 설정 (방향키)
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
  }

  /**
   * update - 매 프레임마다 플레이어 상태 업데이트
   *
   * 📌 호출 시점: MainScene의 update() 내부
   * 📌 실행 주기: 약 60fps (초당 60번)
   *
   * 동작 흐름:
   * 1. 키보드 입력 확인
   * 2. 입력에 따라 속도 계산
   * 3. 플레이어에게 속도 적용
   */
  update(): void {
    // 좌우 이동 속도 계산
    const velocityX = this.getHorizontalVelocity();
    // 상하 이동 속도 계산
    const velocityY = this.getVerticalVelocity();

    // 계산된 속도를 플레이어에 적용
    this.player.setVelocityX(velocityX);
    this.player.setVelocityY(velocityY);
  }

  /**
   * getHorizontalVelocity - 좌우 이동 속도 계산
   *
   * @returns X축 속도 (-PLAYER_SPEED ~ +PLAYER_SPEED)
   *
   * 💡 동작:
   * - 왼쪽 방향키: -200 (왼쪽으로 이동)
   * - 오른쪽 방향키: +200 (오른쪽으로 이동)
   * - 안 누름: 0 (정지)
   */
  private getHorizontalVelocity(): number {
    if (this.cursors.left.isDown) return -this.PLAYER_SPEED;
    if (this.cursors.right.isDown) return this.PLAYER_SPEED;
    return 0;
  }

  /**
   * getVerticalVelocity - 상하 이동 속도 계산
   *
   * @returns Y축 속도 (-PLAYER_SPEED ~ +PLAYER_SPEED)
   *
   * 💡 동작:
   * - 위쪽 방향키: -200 (위로 이동, Y축은 아래가 +)
   * - 아래쪽 방향키: +200 (아래로 이동)
   * - 안 누름: 0 (정지)
   */
  private getVerticalVelocity(): number {
    if (this.cursors.up.isDown) return -this.PLAYER_SPEED;
    if (this.cursors.down.isDown) return this.PLAYER_SPEED;
    return 0;
  }

  /**
   * getSprite - 플레이어 스프라이트 반환
   *
   * 📌 사용처: MainScene에서 충돌 설정 시 필요
   * 예: this.physics.add.collider(playerManager.getSprite(), wall)
   *
   * @returns 플레이어 스프라이트 객체
   */
  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.player;
  }

  /**
   * getPosition - 현재 플레이어 좌표 반환
   *
   * 📌 사용처:
   * - 게임기와의 거리 계산
   * - 게임 실행 시 위치 저장
   * - UI 요소 배치 기준점
   *
   * @returns { x: number, y: number } 형태의 좌표 객체
   */
  getPosition(): { x: number; y: number } {
    return { x: this.player.x, y: this.player.y };
  }
}
