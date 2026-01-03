// app/api/points/single/route.ts
import { NextResponse } from "next/server";
import { rewardSingle } from "@/lib/domain/points/single/rewardSingle";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, gameType, score } = body;

    if (!userId || !gameType || typeof score !== "number") {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }

    const result = await rewardSingle(userId, gameType, score);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[POST /api/points/single]", error);

    return NextResponse.json(
      { message: "Failed to process single mode reward" },
      { status: 500 }
    );
  }
}
