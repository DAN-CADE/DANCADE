import { NextRequest, NextResponse } from "next/server";
import { GameResultService } from "@/lib/services/gameResultService";

export async function POST(request: NextRequest) {
  try {
    const { gameType, userId, userWon, duration, points } =
      await request.json();

    const AI_BOT_ID = "00000000-0000-0000-0000-000000000000";

    const service = new GameResultService();

    const result = await service.saveGameResult({
      room_id: `AI_${gameType.toUpperCase()}_${Date.now()}`,
      game_type: gameType,
      play_mode: "single",
      winner_user_id: userWon ? userId : AI_BOT_ID,
      loser_user_id: userWon ? AI_BOT_ID : userId,
      winner_score: userWon ? points : 0,
      loser_score: userWon ? 0 : -Math.abs(points / 2),
      game_duration: duration,
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[AI API]: AI 전적 저장 실패", error);
    return NextResponse.json(
      { success: false, error: "AI 전적 저장 실패" },
      { status: 500 }
    );
  }
}
