"use client";

import { useEffect, useState } from "react";
import InventoryItemCard from "@/components/inventory/InventoryItemCard";
import { useInventoryList } from "@/hooks/inventory/useInventoryList";
import { useAuth } from "@/hooks/useAuth";


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


  
function onEquipColor(category: ColorCategory, color: string) {
  if (!avatarDataManager || !avatarManager) return;

  const current = avatarDataManager.customization;
  if (!current) return;

  const targetParts = COLOR_CATEGORY_TO_PART[category];
  if (!targetParts) return;

  // 1️⃣ parts 복사 + 색상 변경
  const nextParts = { ...current.parts };

  targetParts.forEach((part) => {
    nextParts[part] = {
      ...nextParts[part],
      color,
    };
  });

  // 2️⃣ 새로운 정본 JSON 생성
  const next = {
    ...current,
    parts: nextParts,
  };

  // 3️⃣ AvatarDataManager 정본 업데이트 ⭐
  avatarDataManager.gameState.customization = next;
  // 또는 (추천) 아래처럼 메서드로 만들 예정
  // avatarDataManager.setCustomization(next);

  // 4️⃣ 화면 즉시 반영 (맵 아바타)
  avatarManager.getContainer().setCustomPart(next);

  // 5️⃣ 로컬스토리지 저장
  avatarDataManager.saveToStorage();

  console.log("✅ 색상 장착 완료", {
    category,
    color,
    next,
  });
}





  function onEquipPart(item: any) {
    // 0) 매니저 연결 안 됐으면 중단
  if (!avatarDataManager || !avatarManager) return;

  // 1) 정본 가져오기
  const current = avatarDataManager.customization;
  if (!current) return;

 
  console.log("✅ item", item);

const partKey = PART_CATEGORY_TO_PART[item.category as keyof typeof PART_CATEGORY_TO_PART];
// hair -> hair, top -> torso, bottom -> legs, shoes -> feet
if (!partKey) return;

console.log("✅ partKey", partKey);


const next = {
  ...current,
  parts: {
    ...current.parts,
    [partKey]: {
      ...(current.parts as any)[partKey],
      styleId: item.styleKey, // 네 데이터에 맞게
      // color는 그대로 유지 (current에 있던 color 유지)
    },
  },
};

//파츠교체 렌더링용
avatarManager.getContainer().setCustomPart(next);
//바뀐 파츠를 담고있는 json 으로 게임 내 정본 json 으로 업데이트
avatarDataManager.setCustomization(next);
//현재 게임 내 정본 josn 을 로컬스토리지에 저장
avatarDataManager.saveToStorage();

console.log("✅ applied next", next);
 console.log("✅ current", current);


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
              className="w-6 h-6 rounded-full border border-white/40 hover:scale-110 transition"
              style={{ backgroundColor: COLOR_HEX[color] }}
               onDoubleClick={() =>
                onEquipColor(activeColorCategory, color)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
