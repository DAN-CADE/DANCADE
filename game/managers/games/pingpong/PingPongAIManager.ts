// game/managers/games/pingpong/PingPongAIManager.ts

import { GptManager } from "@/game/managers/global/gpt/GptManager";

interface AIDecision {
  direction: "up" | "down" | "stay";
  intensity: number;
  reasoning?: string;
}

interface AIGameState {
  ballX: number;
  ballY: number;
  ballVelocityX: number;
  ballVelocityY: number;
  aiPaddleY: number;
  aiPaddleHeight: number;
  gameHeight: number;
  gameWidth: number;
  difficulty: "easy" | "medium" | "hard";
  playerScore: number;
  aiScore: number;
  playerPaddleY: number; // 상대방(플레이어) 위치 파악용
}

/**
 * 핑퐁 게임의 AI 패들 움직임을 관리
 * GPT 호출을 효율적으로 제어하고 결정을 캐싱
 */
export class PingPongAIManager {
  private gptManager: GptManager = new GptManager();
  private lastGPTCallTime = 0;
  private currentDecision: AIDecision = { direction: "stay", intensity: 0 };
  private isRequestInProgress = false;

  private callInterval = {
    easy: 130, // 0.13초마다 (느린 반응)
    medium: 70, // 0.07초마다 (중간 반응)
    hard: 40, // 0.04초마다 (빠른 반응)
  };

  /**
   * 시간 기반으로 GPT 호출 여부를 판단하고 AI 결정 반환
   */
  async updateAI(gameState: AIGameState): Promise<AIDecision> {
    const now = Date.now();
    const interval = this.callInterval[gameState.difficulty];

    // GPT 호출 (비동기, 결과 기다리지 않음)
    if (now - this.lastGPTCallTime >= interval && !this.isRequestInProgress) {
      // no await - 백그라운드에서 호출
      this.requestGPTDecision(gameState).catch(() => {});
    }

    // ⭐ 로컬 알고리즘으로 즉시 가장 최적의 움직임 계산 (GPT 지연 보완)
    // 공이 AI 쪽으로 오고 있을 때만 추적
    if (gameState.ballVelocityX > 0) {
      return this.calculateLocalMove(gameState);
    }

    // 공이 오지 않으면 중앙 복귀 시도
    const centerY = gameState.gameHeight / 2;
    const diff = centerY - gameState.aiPaddleY;
    if (Math.abs(diff) > 20) {
      return {
        direction: diff > 0 ? "down" : "up",
        intensity: 0.3, // 천천히 복귀
      };
    }

    return { direction: "stay", intensity: 0 };
  }

  /**
   * 로컬 수학적 계산으로 공의 궤적을 예측하여 즉각적인 움직임 반환
   */
  private calculateLocalMove(gameState: AIGameState): AIDecision {
    const {
      ballX,
      ballY,
      ballVelocityX,
      ballVelocityY,
      aiPaddleY,
      gameHeight,
      gameWidth,
    } = gameState;

    const aiPaddleX = gameWidth - 50; // 대략적인 AI 패들 X 위치

    // 1. 공이 AI 패들 도달까지 걸리는 시간 계산
    const distToPaddle = aiPaddleX - ballX;
    if (distToPaddle <= 0) return { direction: "stay", intensity: 0 }; // 이미 지나침

    const timeToReach = distToPaddle / ballVelocityX;

    // 2. 도달 예상 Y 좌표 계산 (벽 튕김 포함)
    let predictedY = ballY + ballVelocityY * timeToReach;

    // 벽 반사 시뮬레이션
    // 위/아래 벽을 넘어가면 반사 처리
    const totalHeight = gameHeight;

    // 단순화된 반사 계산 (정확한 물리보다는 빠른 반응성)
    while (predictedY < 0 || predictedY > totalHeight) {
      if (predictedY < 0) {
        predictedY = -predictedY;
      } else if (predictedY > totalHeight) {
        predictedY = 2 * totalHeight - predictedY;
      }
    }

    // 3. 목표 지점 계산 (상대방 위치에 따른 전략적 오프셋 적용)
    // - 상대가 위에 있으면 공을 아래로, 아래에 있으면 위로 보내기 위해 패들 타격 위치 조절
    const centerY = gameHeight / 2;
    let strategicOffset = 0;

    // 패들 높이의 30% 정도를 오프셋으로 사용
    const maxOffset = gameState.aiPaddleHeight * 0.3;

    if (gameState.playerPaddleY < centerY) {
      // 상대가 위쪽 -> 공을 아래로 보내야 함 (Vy > 0)
      // 공이 패들 중심보다 아래에 맞아야 함 (Ball Y > Paddle Y) -> Paddle Y < Ball Y
      // 패들을 공보다 위로 올려야 함
      strategicOffset = -maxOffset;
    } else {
      // 상대가 아래쪽 -> 공을 위로 보내야 함 (Vy < 0)
      // 공이 패들 중심보다 위에 맞아야 함 (Ball Y < Paddle Y) -> Paddle Y > Ball Y
      // 패들을 공보다 아래로 내려야 함
      strategicOffset = maxOffset;
    }

    // 예측 지점에 전략적 오프셋 반영
    const targetY = predictedY + strategicOffset;

    // 4. 난이도별 예측 오차 추가 (AI 정확도 감소)
    const errorRange = {
      easy: 180, // ±180px 오차 (매우 자주 실수)
      medium: 130, // ±130px 오차 (적당히 실수)
      hard: 60, // ±60px 오차
    };
    const randomError =
      (Math.random() - 0.5) * 2 * errorRange[gameState.difficulty];
    const noisyTargetY = targetY + randomError;

    // 5. 목표 지점과 현재 패들 위치 차이
    const targetdiff = noisyTargetY - aiPaddleY;

    // 6. 거리에 따른 속도 조절
    const absDiff = Math.abs(targetdiff);
    let intensity = 0;

    // 거리에 따라 속도 조절
    if (absDiff < 10) {
      return { direction: "stay", intensity: 0 };
    } else if (absDiff < 50) {
      intensity = 0.5;
    } else {
      intensity = 1.0;
    }

    // 방향 결정
    const direction = targetdiff > 0 ? "down" : "up";

    return { direction, intensity };
  }

  /**
   * 비동기로 GPT에서 다음 결정을 받아옴
   */
  private async requestGPTDecision(gameState: AIGameState): Promise<void> {
    if (this.isRequestInProgress) return;

    this.isRequestInProgress = true;
    this.lastGPTCallTime = Date.now();

    try {
      // GPT에서 결정 받기
      const response = await this.gptManager.getResponse("PINGPONG", gameState);

      if (response && response.direction) {
        // intensity를 0.0~1.0 범위로 정규화
        const intensity =
          typeof response.intensity === "number"
            ? Math.max(0, Math.min(1.0, response.intensity))
            : 0.5;

        this.currentDecision = {
          direction: response.direction,
          intensity: intensity,
          reasoning: response.reasoning || response.reason,
        };

        console.log(
          `[AI] ${gameState.difficulty.toUpperCase()} - ${
            this.currentDecision.direction
          } (강도: ${this.currentDecision.intensity.toFixed(2)}) | 거리: ${
            response.reasoning || "?"
          } | 점수: AI${gameState.aiScore}:${gameState.playerScore}`
        );
      } else {
        console.warn("[AI] GPT 응답 형식 오류:", response);
        this.currentDecision = { direction: "stay", intensity: 0 };
      }
    } catch (error) {
      console.error("[AI] GPT 호출 실패:", {
        error: error instanceof Error ? error.message : String(error),
        difficulty: gameState.difficulty,
        ballPosition: `(${gameState.ballX.toFixed(
          0
        )}, ${gameState.ballY.toFixed(0)})`,
        timestamp: new Date().toISOString(),
      });
      this.currentDecision = { direction: "stay", intensity: 0 };
    } finally {
      this.isRequestInProgress = false;
    }
  }

  /**
   * 현재 캐시된 결정 반환 (동기)
   */
  getLastDecision(): AIDecision {
    return this.currentDecision;
  }

  /**
   * AI 상태 초기화
   */
  reset(): void {
    this.currentDecision = { direction: "stay", intensity: 0 };
    this.lastGPTCallTime = 0;
    this.isRequestInProgress = false;
  }
}
