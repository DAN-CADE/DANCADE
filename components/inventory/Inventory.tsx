"use client";

import { useEffect, useState } from "react";
import InventoryItemCard from "@/components/inventory/InventoryItemCard";
import { useInventoryList } from "@/hooks/inventory/useInventoryList";
import { useAuth } from "@/hooks/auth/useAuth";
import { useInventoryPosition } from "@/hooks/inventory/useInventoryPosition";
import { useInventoryDrag } from "@/hooks/inventory/useInventoryDrag";
import {
  applyAvatarState,
  buildNextColorState,
  buildNextPartState,
} from "@/game/utils/avatarCustomization";
import { updateCharacterSkin } from "@/lib/api/inventory/character";
import { equipItemParts } from "@/lib/api/inventory/equipItemParts";
import { useToast } from "../common/ToastProvider";
import {
  PART_CATEGORIES,
  COLOR_CATEGORIES,
  COLOR_PALETTES,
  COLOR_HEX,
  COLOR_CATEGORY_TO_PART,
  PART_CATEGORY_TO_PART,
  type PartCategory,
  type ColorCategory,
} from "@/constants/inventory";
import { AvatarDataManager } from "@/game/managers/global/AvatarDataManager";
import { AvatarManager } from "@/game/managers/global/AvatarManager";
import { CharacterState } from "../avatar/utils/LpcTypes";

// 전역 window 타입 확장
interface WindowWithManagers extends Window {
  __avatarDataManagerProp?: AvatarDataManager;
  __avatarManagerProp?: AvatarManager;
}


interface InventoryItem {
  userItemId: string;
  name: string;
  imageUrl: string;
  isEquipped: boolean;
  category: string;
  styleKey: string | null;
  itemId: string;
  purchasedAt: string | null;
}

/* =========================
 * Inventory Component
 * ========================= */
export default function Inventory() {
  const [, forceRender] = useState(0);
  const [avatarDataManager, setAvatarDataManager] = useState<AvatarDataManager | null>(null);
  const [avatarManager, setAvatarManager] = useState<AvatarManager | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PartCategory>("Hair");
  const [activeColorCategory, setActiveColorCategory] = useState<ColorCategory>("Skin");

  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const userId = user?.id ?? null;
  const { items, loading, fetchInventory } = useInventoryList(userId);
  const { showToast } = useToast();

  // 위치 및 드래그 훅
  const { position, setPosition } = useInventoryPosition({
    isOpen,
    avatarManager,
    isDragging: false, // 초기값, 아래에서 덮어씀
    hasUserDragged: false,
  });

  const { isDragging, hasUserDragged, handleMouseDown, resetDragState } = useInventoryDrag({
    position,
    setPosition,
  });

  // 실제 위치 훅에 드래그 상태 전달
  const { position: trackedPosition, setPosition: setTrackedPosition } = useInventoryPosition({
    isOpen,
    avatarManager,
    isDragging,
    hasUserDragged,
  });

  // Avatar Manager 연결
  useEffect(() => {
    const interval = setInterval(() => {
      const win = window as WindowWithManagers;
      const adm = win.__avatarDataManager;
      const am = win.__avatarManager;

      if (adm && am) {
        setAvatarDataManager(adm);
        setAvatarManager(am);
        console.log("✅ Avatar managers connected in Inventory");
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  // 인벤토리 닫힐 때 드래그 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      resetDragState();
    }
  }, [isOpen, resetDragState]);

  // 인벤토리 토글 이벤트
  useEffect(() => {
    const handleToggle = () => {
      if (!user) {
        showToast({
          type: "info",
          message: "게스트는 인벤토리를 사용할 수 없습니다",
        });
        return;
      }
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("inventory-toggle", handleToggle);
    return () => window.removeEventListener("inventory-toggle", handleToggle);
  }, [user, showToast]);

  // 인벤토리 열릴 때 데이터 fetch
  useEffect(() => {
    if (!isOpen || !userId) return;
  fetchInventory();
  }, [isOpen, userId, fetchInventory]);

  // 파츠 장착
  async function onEquipPart(item: InventoryItem) {
    if (!avatarDataManager || !avatarManager || !user) return;
    const current = avatarDataManager.customization;
    if (!current) return;

    const partKey = PART_CATEGORY_TO_PART[item.category as keyof typeof PART_CATEGORY_TO_PART];
    if (!partKey) return;

    const next = buildNextPartState(current, partKey, item.styleKey ?? "");
    applyAvatarState(next, avatarDataManager, avatarManager);

    try {
      await updateCharacterSkin(user.id, next);
      await equipItemParts(user.id, item.itemId);
      await fetchInventory();
    } catch (e) {
      console.error("❌ 서버 저장 실패", e);
    }
  }

  // 색상 장착
  async function onEquipColor(category: ColorCategory, color: string) {
    if (!avatarDataManager || !avatarManager || !user) return;
    const current = avatarDataManager.customization;
    if (!current) return;

    const targetParts = COLOR_CATEGORY_TO_PART[category];
    if (!targetParts) return;

    const next = buildNextColorState(
      current, 
      targetParts as readonly (keyof CharacterState['parts'])[], 
      color
    );
    applyAvatarState(next, avatarDataManager, avatarManager);
    forceRender((v) => v + 1);

    try {
      await updateCharacterSkin(user.id, next);
    } catch (e) {
      console.error("❌ 서버 저장 실패", e);
    }
  }

  // 색상 장착 여부 확인
  function isColorEquipped(category: ColorCategory, color: string): boolean {
    const customization = avatarDataManager?.customization;
    if (!customization?.parts) return false;

    const targetParts = COLOR_CATEGORY_TO_PART[category];
    if (!targetParts) return false;

    return targetParts.some((part) => {
      return customization.parts[part]?.color === color;
    });
  }

  if (!isOpen || !user) return null;

  const filtered = items.filter(
    (it) => it.category === activeCategory.toLowerCase()
  );

  const displayPosition = trackedPosition ?? position;
  const style = displayPosition
    ? { top: `${displayPosition.top}px`, left: `${displayPosition.left}px` }
    : { top: "24px", right: "24px" };

  return (
    <div
      className={`fixed w-[400px] h-[520px] bg-[rgba(10,15,30,0.85)] border border-white/20 rounded-lg backdrop-blur z-50 flex flex-col ${
        isDragging ? "cursor-move" : ""
      }`}
      style={style}
    >
      {/* Header */}
      <div
        className="h-12 px-4 flex items-center justify-between border-b border-white/10 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <span className="text-white text-sm font-bold">Inventory</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/60 text-xs hover:text-white"
          onMouseDown={(e) => e.stopPropagation()}
        >
          ✕
        </button>
      </div>

      {/* 파츠 탭 */}
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

      {/* 아이템 그리드 */}
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

      {/* 색상 탭 */}
      <div className="pt-3 pb-3 px-3 py-2 border-t border-white/10">
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

      {/* 색상 Picker */}
      <div className="px-3 pb-3">
        <div className="pl-2 flex gap-2 flex-wrap">
          {COLOR_PALETTES[activeColorCategory].map((color) => (
            <button
              key={color}
              title={color}
              onDoubleClick={() => onEquipColor(activeColorCategory, color)}
              className={`w-6 h-6 rounded-full transition ${
                isColorEquipped(activeColorCategory, color)
                  ? "ring-2 ring-white-400 scale-110"
                  : "border border-white/40 hover:scale-110"
              }`}
              style={{ backgroundColor: COLOR_HEX[color] }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
