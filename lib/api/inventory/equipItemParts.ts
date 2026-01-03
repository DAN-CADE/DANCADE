// lib/api/inventory/client.ts

/**
 * 인벤토리 아이템 장착 (프론트 → API)
 */
export async function equipItemParts(
  userId: string,
  itemId: string
) {
  const res = await fetch("/api/inventory/equip", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId,
      itemId,
    }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(
      error?.message ?? "Failed to equip item"
    );
  }

  return res.json() as Promise<{ success: true }>;
}
