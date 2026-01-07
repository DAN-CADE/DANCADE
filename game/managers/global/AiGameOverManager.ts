import axios from "axios";
import { UserData } from "@/types/user";
import { GameSceneWithState } from "@/types/game";
import { AiGameResultRequest } from "@/game/types/common/ai.types";

export class AiGameOverHandler<TSide = never> {
  private scene: GameSceneWithState<TSide>;
  private gameType: string;
  private basePoints: number;

  constructor(
    scene: GameSceneWithState<TSide>,
    gameType: string,
    basePoints: number = 20
  ) {
    this.scene = scene;
    this.gameType = gameType;
    this.basePoints = basePoints;
  }

  async handle(winner: TSide): Promise<void> {
    const { gameState, startTime } = this.scene;

    // 유저 승리 여부 판단
    const isUserWin = winner === gameState.userSide;

    // 플레이 시간 계산
    const duration = startTime
      ? Math.floor((Date.now() - startTime) / 1000)
      : 0;

    let userId: string | undefined;

    // 유저 ID 가져오기 (localStorage)
    // const userData: UserData = JSON.parse(localStorage.getItem("user") || "{}");
    // const userId = userData.uuid || userData.id || this.scene.currentUser?.uuid;

    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        const userData: UserData = JSON.parse(
          localStorage.getItem("user") || "{}"
        );
        userId = userData.uuid || userData.id;
      } catch {
        userId = this.scene.currentUser?.uuid;
      }
    } else {
      userId = this.scene.currentUser?.uuid;
    }

    if (!userId) {
      console.warn(`[${this.gameType}] 유저 ID를 찾을 수 없습니다.`);
      return;
    }

    try {
      const requestData: AiGameResultRequest = {
        gameType: this.gameType,
        userId: userId,
        userWon: isUserWin,
        duration: duration,
        points: this.basePoints,
      };

      await axios.post("/api/game-result/ai", requestData);
      console.log(`[${this.gameType}] AI 결과 저장 성공`);
    } catch (error) {
      console.error(`[${this.gameType}] 저장 실패:`, error);
    }
  }
}
