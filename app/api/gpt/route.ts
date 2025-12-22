import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log("GPT AI API 실행됨");
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: { message: "prompt is required" } },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      return NextResponse.json({ error: data.error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("route.ts crash:", err);
    return NextResponse.json(
      { error: { message: "server error" } },
      { status: 500 }
    );
  }
}
