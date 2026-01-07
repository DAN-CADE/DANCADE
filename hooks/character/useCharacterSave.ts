// hooks/character/useCharacterSave.ts
"use client";

import { useState, useCallback } from "react";
import type { CharacterState } from "@/components/avatar/utils/LpcTypes";

export function useCharacterSave() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveCharacter = useCallback(
    async (userId: string, characterSkin: CharacterState) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/users/saveCharacter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, characterSkin }),
        });

        if (!res.ok) throw new Error("저장 실패");
        return await res.json();
      } catch (e) {
        setError(e instanceof Error ? e.message : "알 수 없는 에러");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { saveCharacter, isLoading, error };
}
