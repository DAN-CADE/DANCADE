// lib/inventory.ts (아무 파일에 만들어도 됨)
import { supabase } from "@/lib/supabase/client";

/**
 * items 테이블 타입
 */
type ItemRow = {
  id: string;
  category: string;
  name: string;
  image_url: string;
  style_key: string | null;
};

/**
 * 화면에서 사용할 인벤토리 아이템 타입
 */
export type InventoryItem = {
  userItemId: string;
  itemId: string;
  category: string;
  name: string;
  imageUrl: string;
  styleKey: string | null;
  isEquipped: boolean;
  purchasedAt: string | null;
};

export async function fetchUserInventory(
  userId: string
): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("user_inventory")
    .select(
      `
      id,
      is_equipped,
      purchased_at,
      item:items (
        id,
        category,
        name,
        image_url,
        style_key
      )
    `
    )
    .eq("user_id", userId)
    .order("purchased_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .filter((row) => row.item) // ✅ null 방어만
    .map((row) => {
      const item = row.item as unknown as ItemRow;

      return {
        userItemId: row.id,
        itemId: item.id,
        category: item.category,
        name: item.name,
        imageUrl: item.image_url,
        styleKey: item.style_key,
        isEquipped: row.is_equipped,
        purchasedAt: row.purchased_at,
      };
    });
}

export async function saveItemToInventory(userId: string, itemId: string) {
  const insertEventGame = {
    user_id: userId,
    item_id: itemId,
    is_equipped: true,
  };

  // 쿼리 실행 [이벤트 게임 생성]
  const { data: newEventGame, error: postError } = await supabase
    .from("user_inventory")
    .insert([insertEventGame])
    .select();
}
