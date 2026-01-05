import { NextRequest, NextResponse } from "next/server";
import { hasBadwords } from "@/lib/badwords";

// Perspective API 타입
interface AnalyzeResponse {
  attributeScores: {
    TOXICITY?: { summaryScore: { value: number } };
    SEVERE_TOXICITY?: { summaryScore: { value: number } };
    PROFANITY?: { summaryScore: { value: number } };
  };
}

// 독성 점수 기준
const TOXICITY_THRESHOLD = 0.5; // 50% 이상이면 차단

export async function POST(request: NextRequest) {
  try {
    const { comment } = await request.json();

    console.log("📝 분석 요청:", {
      comment,
      apiKey: process.env.PERSPECTIVE_API_KEY ? "설정됨" : "미설정",
    });

    if (!comment || typeof comment !== "string") {
      return NextResponse.json(
        { error: "유효한 메시지가 필요합니다." },
        { status: 400 }
      );
    }

    // 🚨 먼저 로컬 욕설 필터 체크
    if (hasBadwords(comment)) {
      console.log("🚨 욕설 감지:", comment);
      return NextResponse.json({
        isBlocked: true,
        scores: {
          toxicity: 0,
          severeToxicity: 0,
          profanity: 0,
        },
        reason: "부적절한 내용이 감지되었습니다.",
      });
    }

    if (!process.env.PERSPECTIVE_API_KEY) {
      console.error("❌ PERSPECTIVE_API_KEY가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // Perspective API 호출
    const response = await fetch(
      "https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=" +
        process.env.PERSPECTIVE_API_KEY,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: { text: comment },
          requestedAttributes: {
            TOXICITY: {},
            SEVERE_TOXICITY: {},
            PROFANITY: {}, // 욕설 감지 추가
          },
          languages: ["ko"], // 한국어 설정
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ Perspective API 오류:", {
        status: response.status,
        statusText: response.statusText,
        body: errorData,
      });
      return NextResponse.json(
        { error: `API 분석 실패: ${response.status} ${response.statusText}` },
        { status: 500 }
      );
    }

    const data: AnalyzeResponse = await response.json();

    console.log("✅ Perspective API 응답:", { data, comment });

    // 독성 점수 추출
    const toxicityScore =
      data.attributeScores?.TOXICITY?.summaryScore?.value ?? 0;
    const severeToxicityScore =
      data.attributeScores?.SEVERE_TOXICITY?.summaryScore?.value ?? 0;
    const profanityScore =
      data.attributeScores?.PROFANITY?.summaryScore?.value ?? 0;

    // 차단 여부 판단
    const isBlocked =
      toxicityScore > TOXICITY_THRESHOLD ||
      severeToxicityScore > 0.5 ||
      profanityScore > 0.6;

    return NextResponse.json({
      isBlocked,
      scores: {
        toxicity: toxicityScore,
        severeToxicity: severeToxicityScore,
        profanity: profanityScore,
      },
      reason: isBlocked ? "부적절한 내용이 감지되었습니다." : null,
    });
  } catch (error) {
    console.error("분석 중 오류:", error);
    return NextResponse.json({ error: "서버 오류 발생" }, { status: 500 });
  }
}
