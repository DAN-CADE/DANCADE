// game/managers/global/gpt/prompts/PingPongPrompt.ts

/**
 * 핑퐁 AI를 위한 GPT 프롬프트
 * AI의 다음 움직임을 결정
 */
export const PingPongPrompt = (data: {
  ballX: number;
  ballY: number;
  ballVelocityX: number;
  ballVelocityY: number;
  aiPaddleY: number;
  aiPaddleHeight: number;
  playerPaddleY: number;
  gameHeight: number;
  difficulty: "easy" | "medium" | "hard";
  playerScore: number;
  aiScore: number;
}): string => {
  const {
    ballX,
    ballY,
    ballVelocityX,
    ballVelocityY,
    aiPaddleY,
    aiPaddleHeight,
    playerPaddleY,
    gameHeight,
    difficulty,
    playerScore,
    aiScore,
  } = data;

  // 공이 AI 쪽으로 오고 있는지 판단
  const isBallComingToAI = ballVelocityX > 0;
  const ballDirection = isBallComingToAI ? "AI 쪽으로" : "플레이어 쪽으로";

  // 점수 상황 분석
  const scoreStatus =
    playerScore > aiScore
      ? "플레이어가 앞서고 있음"
      : aiScore > playerScore
      ? "AI가 앞서고 있음"
      : "동점";

  const difficultyInstructions = {
    easy: `
      - 공이 AI 쪽으로 올 때만 반응하라
      - 가끔 일부러 늦게 반응하여 실수를 만들어라 (20% 확률)
      - 공의 정확한 중앙보다 약간 빗나가게 패들을 움직여라
      - 반응 속도: 느림 (0.5~0.7)
    `,
    medium: `
      - 공이 AI 쪽으로 올 때 적절히 반응하라
      - 가끔 실수를 만들어라 (10% 확률)
      - 공의 중앙에 맞추려고 노력하되, 완벽하지는 않게
      - 반응 속도: 보통 (0.7~0.9)
    `,
    hard: `
      - 공의 움직임을 정확히 예측하여 최적의 위치로 이동하라
      - 거의 실수하지 않음 (2% 확률)
      - 공의 정확한 중앙을 향해 패들을 움직여라
      - 반응 속도: 빠름 (0.9~1.0)
    `,
  };

  return `
너는 탁구 게임의 AI 플레이어다. 현재 게임 상황을 분석하고 다음 움직임을 결정하라.

[현재 게임 상황]
- 게임 높이: ${gameHeight}
- 공 위치: (${ballX.toFixed(1)}, ${ballY.toFixed(1)})
- 공 속도: (${ballVelocityX.toFixed(1)}, ${ballVelocityY.toFixed(1)})
- 공의 방향: ${ballDirection}
- AI 패들 위치: Y=${aiPaddleY.toFixed(1)} (높이: ${aiPaddleHeight})
- AI 패들 중앙: Y=${aiPaddleY.toFixed(1)}
- 플레이어 패들 위치: Y=${playerPaddleY.toFixed(1)}
- 현재 점수: AI ${aiScore} - ${playerScore} 플레이어 (${scoreStatus})
- 난이도: ${difficulty.toUpperCase()}

[난이도별 행동 지침]
${difficultyInstructions[difficulty]}

[움직임 결정 규칙]
1. 공이 AI 쪽으로 오고 있다면 (ballVelocityX > 0):
   - 공의 예상 Y 위치를 계산하라
   - 패들의 중앙이 공과 만나도록 목표 Y 위치를 설정하라
   - 난이도에 따라 약간의 오차를 추가하라

2. 공이 플레이어 쪽으로 가고 있다면 (ballVelocityX < 0):
   - 게임 중앙(${gameHeight / 2})으로 천천히 이동하라
   - 급격한 움직임은 피하라

3. 움직임 방향 결정:
   - "up": 패들을 위로 이동 (목표 Y < 현재 AI 패들 Y)
   - "down": 패들을 아래로 이동 (목표 Y > 현재 AI 패들 Y)
   - "stay": 현재 위치 유지 (목표 Y ≈ 현재 AI 패들 Y, 오차 ±10)

4. 반응 강도 (intensity):
   - 0.0 ~ 1.0 사이 값
   - 목표까지 거리가 멀수록 높은 값
   - 난이도에 따라 조절

[출력 형식]
반드시 JSON 형식으로만 답하라:
{
  "action": "up" | "down" | "stay",
  "intensity": 0.0~1.0,
  "reasoning": "한 줄로 간단한 이유"
}

부연 설명이나 마크다운 없이 순수 JSON만 출력하라.
  `.trim();
};
