import { NextResponse } from "next/server";

export async function GET() {
  // TODO: Phase 3에서 GameResultService.getRankings 구현 예정
  return NextResponse.json({
    success: true,
    data: [],
    message: "랭킹 API 준비 중",
  });
}
