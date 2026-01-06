// lib/supabase/ranking.ts

import { supabase } from "@/lib/supabase/client";

// 더미 데이터 (테스트용)
const dummyRankings = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  score: 10000 - i * 80 + Math.floor(Math.random() * 50),
  users: {
    nickname: `Player${String(i + 1).padStart(3, "0")}`,
  },
  created_at: new Date().toISOString(),
})).sort((a, b) => b.score - a.score);

// 페이지별 랭킹 조회 (20개씩)
export async function getRankings(
  gameType: string
): Promise<typeof dummyRankings> {
  // TODO: 실제 Supabase 연동 시 아래 코드 사용

  const { data, error } = await supabase
    .from("leaderboards")
    .select(
      `
      *,
      users (
        nickname
      )
    `
    )
    .eq("game_type", gameType)
    .order("ranking", { ascending: true });

  if (error) throw error;

  console.log(data);
  return data;

  // 더미 데이터 반환 (테스트용)
  // await new Promise((resolve) => setTimeout(resolve, 300)); // 네트워크 지연 시뮬레이션
  // const start = (page - 1) * 20;
  // const end = start + 20;
  // return dummyRankings.slice(start, end);
}

// 점수 저장
export async function saveScore(
  gameType: string,
  userId: string,
  score: number
) {
  // TODO: 실제 Supabase 연동 시 아래 코드 사용
  /*
  const { data, error } = await supabase
    .from('rankings')
    .insert({ game_type: gameType, user_id: userId, score });
  
  if (error) throw error;
  return data;
  */

  console.log(`[테스트] 점수 저장: ${gameType}, ${userId}, ${score}`);
  return { success: true };
}

// 내 최고 점수 조회
export async function getMyBestScore(
  gameType: string,
  userId: string
): Promise<number | null> {
  // TODO: 실제 Supabase 연동
  /*
  const { data, error } = await supabase
    .from('rankings')
    .select('score')
    .eq('game_type', gameType)
    .eq('user_id', userId)
    .order('score', { ascending: false })
    .limit(1)
    .single();
  
  if (error) return null;
  return data?.score;
  */

  return Math.floor(Math.random() * 5000) + 1000; // 테스트용
}

export async function getRankingsPage(
  gameType: string,
  page: number = 1
): Promise<typeof dummyRankings> {
  const pageSize = 20;
  const start = (page - 1) * pageSize;

  const { data, error } = await supabase
    .from("leaderboards")
    .select(
      `
      *,
      users (
        nickname
      )
    `
    )
    .eq("game_type", gameType)
    .order("ranking", { ascending: true })
    .range(start, start + pageSize - 1);

  if (error) {
    console.error("[ranking] getRankingsPage 에러:", error);
    return dummyRankings.slice(start, start + pageSize);
  }

  return data || dummyRankings.slice(start, start + pageSize);
}
