// ai 게임 결과 저장 api 요청 타입
export interface AiGameResultRequest {
  gameType: string;
  userId: string;
  userWon: boolean;
  duration: number;
  points: number;
}
