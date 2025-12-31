// app/api/rankings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { GameResultService } from "@/lib/services/gameResultService";

/**
 * GET /api/rankings?gameType=omok&limit=100
 * - 전체 유저 랭킹 조회
 * - gameType: 특정 게임 랭킹 (선택)
 * - limit: 상위 N명 (기본 100명)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameType = searchParams.get("gameType") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");

    console.log("[API] 랭킹 조회:", { gameType, limit });

    const service = new GameResultService();
    const rankings = await service.getRankings(gameType, limit);

    return NextResponse.json({
      success: true,
      rankings,
      total: rankings.length,
    });
  } catch (error) {
    console.error("[API] 랭킹 조회 실패:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
