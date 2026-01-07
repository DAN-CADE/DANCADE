// game/managers/global/gpt/GptManager.ts
import { PromptRegistry } from "@/game/managers/global/prompts/index";

export type GameContext = keyof typeof PromptRegistry;

export class GptManager {
  async getResponse(context: GameContext, data: any): Promise<any> {
    const promptBuilder = PromptRegistry[context];
    if (!promptBuilder) return null;

    const prompt = promptBuilder(data);

    try {
      const response = await fetch("/api/gpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const result = await response.json();

      // ✅ 에러 응답 확인
      if (result.error) {
        console.error(`[${context}] GPT API 에러:`, result.error);
        return null;
      }

      // ✅ choices 배열 존재 여부 확인
      if (!result.choices || !result.choices[0]) {
        console.error(`[${context}] GPT 응답 형식 오류:`, result);
        return null;
      }

      const content = result.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error(`${context} GPT 통신 에러:`, e);
      return null;
    }
  }
}
