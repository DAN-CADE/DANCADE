// lib/api/points/rewardSingle.ts
export interface RewardSingleParams {
  userId: string;
  gameType: string;
  score: number;
}

export interface RewardSingleResult {
  rewarded: boolean;
  earnedPoints: number;
  totalPoints?: number;
}

export async function rewardSingleMode(
  params: RewardSingleParams
): Promise<RewardSingleResult> {
  const res = await fetch("/api/points/single", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error("싱글모드 포인트 지급 실패");
  }

  return res.json();
}
