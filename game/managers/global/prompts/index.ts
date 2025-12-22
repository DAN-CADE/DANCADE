// game/managers/global/gpt/prompts/index.ts
import { OmokPrompt } from "./OmokPrompt";
import { PingPongPrompt } from "./PingPongPrompt";

export const PromptRegistry = {
  OMOK: OmokPrompt,
  PINGPONG: PingPongPrompt,
} as const;
