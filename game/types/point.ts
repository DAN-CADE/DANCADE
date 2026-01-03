// lib/points/types.ts
export interface AddPointsMeta {
  type: string;           // single_record_break, multi_win, npc_reward 등
  description?: string;   // 로그용 설명
}

export interface AddPointsResult {
  totalPoints: number;
}