import type { CharacterState } from "@/components/avatar/utils/LpcTypes";

export async function updateCharacterSkin(
  userId: string | null,
  skin: CharacterState
) {
  const res = await fetch("/api/inventory/character", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      characterSkin: skin,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to update character skin");
  }

  return res.json();
}
