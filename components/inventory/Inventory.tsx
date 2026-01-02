"use client";

import { useEffect, useState } from "react";
import InventoryItemCard from "@/components/inventory/InventoryItemCard";
import { useInventoryList } from "@/hooks/inventory/useInventoryList";
import { useAuth } from "@/hooks/useAuth";
import {
  applyAvatarState,
  buildNextColorState,
  buildNextPartState,
} from "@/game/utils/avatarCustomization";
import { updateCharacterSkin } from "@/lib/api/inventory/character";
import { equipItemParts } from "@/lib/api/inventory/equipItemParts";

const COLOR_CATEGORY_TO_PART = {
  Skin: ["body", "head", "nose"],
  Eyes: ["eyes"],
  Hair: ["hair"],
  Top: ["torso"],
  Bottom: ["legs"],
  Shoes: ["feet"],
} as const;

const PART_CATEGORY_TO_PART = {
  hair: "hair",
  top: "torso",
  bottom: "legs",
  shoes: "feet",
} as const;

/* =========================
 * 파츠 카테고리 (상단)
 * ========================= */
const PART_CATEGORIES = ["Hair", "Top", "Bottom", "Shoes"] as const;
type PartCategory = (typeof PART_CATEGORIES)[number];

/* =========================
 * 색상 카테고리 (하단)
 * ========================= */
const COLOR_CATEGORIES = [
  "Skin",
  "Eyes",
  "Hair",
  "Top",
  "Bottom",
  "Shoes",
] as const;
type ColorCategory = (typeof COLOR_CATEGORIES)[number];

/* =========================
 * 색상 팔레트 (JSON 기준)
 * ========================= */
const COLOR_PALETTES: Record<ColorCategory, string[]> = {
  Skin: ["light", "amber", "bronze", "green", "zombie", "blue"],
  Eyes: ["gray", "red", "orange", "yellow", "brown", "green", "blue", "purple"],
  Hair: ["black", "red", "pink", "orange", "blonde", "green", "blue", "purple"],
  Top: [
    "white",
    "gray",
    "black",
    "red",
    "pink",
    "orange",
    "brown",
    "green",
    "blue",
    "purple",
  ],
  Bottom: [
    "white",
    "gray",
    "black",
    "red",
    "pink",
    "orange",
    "brown",
    "green",
    "blue",
    "purple",
  ],
  Shoes: [
    "white",
    "gray",
    "black",
    "red",
    "pink",
    "orange",
    "brown",
    "green",
    "blue",
    "purple",
  ],
};

/* =========================
 * UI용 컬러 HEX (임시)
 * ========================= */
const COLOR_HEX: Record<string, string> = {
  black: "#000000",
  gray: "#888888",
  white: "#ffffff",
  red: "#e74c3c",
  pink: "#ff7eb6",
  orange: "#f39c12",
  blonde: "#f5e6a1",
  brown: "#8e5a2b",
  green: "#2ecc71",
  blue: "#3498db",
  purple: "#9b59b6",
  yellow: "#f1c40f",
  light: "#f1d7c6",
  amber: "#e0b07c",
  bronze: "#b87333",
  zombie: "#7fae7a",
};

/* =========================
 * Inventory Component
 * ========================= */
export default function Inventory() {

  const [, forceRender] = useState(0);
  const [avatarDataManager, setAvatarDataManager] = useState<any>(null);
  const [avatarManager, setAvatarManager] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] =useState<PartCategory>("Hair");
  const [activeColorCategory, setActiveColorCategory] =useState<ColorCategory>("Skin");
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const userId = user?.id ?? null;
  const { items, loading, fetchInventory } = useInventoryList(userId);

  useEffect(() => {
    const interval = setInterval(() => {
      const adm = (window as any).__avatarDataManager;
      const am = (window as any).__avatarManager;

      if (adm && am) {
        setAvatarDataManager(adm);
        setAvatarManager(am);
    console.log("✅ Avatar managers connected in Inventory", {
    avatarDataManager: !!adm,
    avatarManager: !!am,
  });    
    clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);




  /* =========================
   * 인벤토리 토글
   * ========================= */
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("inventory-toggle", handleToggle);
    return () => window.removeEventListener("inventory-toggle", handleToggle);
  }, []);

  /* =========================
   * 인벤토리 열릴 때 fetch
   * ========================= */
  useEffect(() => {
    if (isOpen && user) {
      fetchInventory();
    }
  }, [isOpen, userId, fetchInventory]);

  if (!isOpen || !user) return null;

  const filtered = items.filter(
    (it) => it.category === activeCategory.toLowerCase()
  );



// 파츠 장착
async function onEquipPart(item: any) {
  if (!avatarDataManager || !avatarManager) return;
  const current = avatarDataManager.customization;
  if (!current) return;

  const partKey =
    PART_CATEGORY_TO_PART[item.category as keyof typeof PART_CATEGORY_TO_PART];
  if (!partKey) return;

  const next = buildNextPartState(
    current,
    partKey,
    item.styleKey
  );
// ✅ 1. 즉시 반영 (UX)

applyAvatarState(next, avatarDataManager, avatarManager);
    // ✅ 2. 서버 저장 (비동기)
  try {
    await updateCharacterSkin(user!.id, next);
    await equipItemParts(user!.id, item.itemId)
       await fetchInventory();
  } catch (e) {
    console.error("❌ 서버 저장 실패", e);
    // (선택) 토스트 / 롤백 가능
  }
}

// 색상 장착
async function onEquipColor(category: ColorCategory, color: string) {
  if (!avatarDataManager || !avatarManager) return;
  const current = avatarDataManager.customization;
  if (!current) return;

  const targetParts = COLOR_CATEGORY_TO_PART[category];
  if (!targetParts) return;

  const next = buildNextColorState(
    current,
    targetParts,
    color
  );

  applyAvatarState(next, avatarDataManager, avatarManager);
  forceRender((v) => v + 1);

      // ✅ 2. 서버 저장 (비동기)
  try {
    await updateCharacterSkin(user!.id, next);
  } catch (e) {
    console.error("❌ 서버 저장 실패", e);
    // (선택) 토스트 / 롤백 가능
  }
}
console.log("👀 customization", avatarDataManager.customization);

function isColorEquipped(
  category: ColorCategory,
  color: string
) {
  const customization = avatarDataManager?.customization;
  if (!customization) return false;

  const parts = customization.parts;
  if (!parts) return false;

  const targetParts = COLOR_CATEGORY_TO_PART[category];
  if (!targetParts) return false;

  // 해당 카테고리의 파츠 중
  // 하나라도 이 색을 쓰고 있으면 장착 중
  return targetParts.some((part) => {
    return parts[part]?.color === color;
  });
}


  return (
    <div className="fixed top-6 right-6 w-[400px] h-[520px] bg-[rgba(10,15,30,0.85)] border border-white/20 rounded-lg backdrop-blur z-50 flex flex-col">
      {/* ================= Header ================= */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-white/10">
        <span className="text-white text-sm font-bold">Inventory</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/60 text-xs hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* ================= 파츠 탭 ================= */}
      <div className="flex gap-2 px-3 py-2 border-b border-white/10">
        {PART_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 text-xs rounded ${
              activeCategory === cat
                ? "bg-white text-black"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ================= 아이템 그리드 ================= */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="text-white/60 text-xs">Loading...</div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filtered.map((item) => (
              <InventoryItemCard
                key={item.userItemId}
                name={item.name}
                imageUrl={item.imageUrl}
                isEquipped={item.isEquipped}
                onDoubleClick={() => onEquipPart(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================= 색상 탭 ================= */}
      <div className="px-3 py-2 border-t border-white/10">
        <div className="flex gap-2 flex-wrap">
          {COLOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveColorCategory(cat)}
              className={`px-3 py-1 text-xs rounded ${
                activeColorCategory === cat
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ================= 색상 Picker ================= */}
      <div className="px-3 pb-3">
        <div className="flex gap-2 flex-wrap">
          {COLOR_PALETTES[activeColorCategory].map((color) => (
           <button
  key={color}
  title={color}
  onDoubleClick={() =>
    onEquipColor(activeColorCategory, color)
  }
  className={`
    w-6 h-6 rounded-full
    transition
    ${
      isColorEquipped(activeColorCategory, color)
        ? "ring-2 ring-white-400 scale-110"
        : "border border-white/40 hover:scale-110"
    }
  `}
  style={{ backgroundColor: COLOR_HEX[color] }}
/>
          ))}
        </div>
      </div>
    </div>
  );
}
