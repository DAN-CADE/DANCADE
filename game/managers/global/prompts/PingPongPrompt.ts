// game/managers/global/gpt/prompts/PingPongPrompt.ts

/**
 * 핑퐁 AI를 위한 GPT 프롬프트 - 간단하고 명확한 버전
 */
export const PingPongPrompt = (data: {
  ballX: number;
  ballY: number;
  ballVelocityX: number;
  ballVelocityY: number;
  aiPaddleY: number;
  aiPaddleHeight: number;
  gameHeight: number;
  difficulty: "easy" | "medium" | "hard";
}): string => {
  const {
    ballX,
    ballY,
    ballVelocityX,
    ballVelocityY,
    aiPaddleY,
    gameHeight,
    difficulty,
  } = data;

  const gameWidth = 1200;
  const aiPaddleX = gameWidth - 50;

  // 공이 AI 쪽으로 오는지 확인
  const isBallApproaching = ballVelocityX > 0;

  // 공의 예상 도착 Y 위치 계산 (벽 반사 포함)
  let predictedY = ballY;

  if (isBallApproaching) {
    const timeToReach = (aiPaddleX - ballX) / ballVelocityX;
    predictedY = ballY + ballVelocityY * timeToReach;

    // 벽 반사 계산 (여러 번 반사 가능)
    while (predictedY < 0 || predictedY > gameHeight) {
      if (predictedY < 0) predictedY = -predictedY;
      if (predictedY > gameHeight) predictedY = 2 * gameHeight - predictedY;
    }
  }

  const distance = predictedY - aiPaddleY;
  // 난이도별 설정
  const config = {
    easy: {
      reactionDistance: 300,
      intensityMultiplier: 0.5,
      errorChance: 0.3,
      description: "느리고 부정확하게",
    },
    medium: {
      reactionDistance: 200,
      intensityMultiplier: 0.75,
      errorChance: 0.15,
      description: "보통 속도로",
    },
    hard: {
      reactionDistance: 100,
      intensityMultiplier: 1.0,
      errorChance: 0.05,
      description: "빠르고 정확하게",
    },
  }[difficulty];

  return `당신은 핑퐁 게임 AI입니다. 간단하게 판단하세요.

**상황**
- 공이 AI 쪽으로 오는가? ${isBallApproaching ? "YES" : "NO"}
- 공의 예상 도착 위치: Y=${predictedY.toFixed(0)}
- 현재 패들 위치: Y=${aiPaddleY.toFixed(0)}
- 차이: ${distance.toFixed(0)}px ${distance > 0 ? "(아래)" : "(위)"}

**난이도: ${difficulty}** - ${config.description} 반응

**행동 규칙**
1. 공이 반대쪽으로 가면(NO): direction="stay", intensity=0
2. 차이가 50px 미만: direction="stay", intensity=0
3. 차이가 50px 이상:
   - 공이 위쪽(음수): direction="up"
   - 공이 아래쪽(양수): direction="down"
   - intensity: ${config.intensityMultiplier} (거리가 멀수록 높게)

**${difficulty} 난이도 특성**
- ${config.errorChance * 100}% 확률로 실수 (실수하면 intensity를 절반으로)
- 반응 거리: ${config.reactionDistance}px 이상일 때만 움직임

**응답 형식 (JSON만, 다른 텍스트 없이)**
{"direction":"up|down|stay","intensity":${
    config.intensityMultiplier
  },"reasoning":"한줄"}`;
};
