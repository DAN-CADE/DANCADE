import axios from "axios";

export class AiGameOverHandler {
  // 생성자에서 게임 정보(타입, 점수)를 받아둠
  constructor(scene, gameType, basePoints = 20) {
    this.scene = scene;
    this.gameType = gameType;
    this.basePoints = basePoints;
  }

  async handle(winner) {
    const { gameState, startTime } = this.scene;

    // 유저 승리 여부 판단
    const isUserWin = winner === gameState.userSide;

    // 플레이 시간 계산
    const duration = startTime
      ? Math.floor((Date.now() - startTime) / 1000)
      : 0;

    // 유저 ID 가져오기 (localStorage)
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = userData.uuid || userData.id || this.scene.currentUser?.uuid;

    if (!userId) return;

    try {
      await axios.post("/api/game-result/ai", {
        gameType: this.gameType,
        userId: userId,
        userWon: isUserWin,
        duration: duration,
        points: this.basePoints,
      });
      console.log(`[${this.gameType}] AI 결과 저장 성공`);
    } catch (error) {
      console.error(`[${this.gameType}] 저장 실패:`, error);
    }
  }
}
