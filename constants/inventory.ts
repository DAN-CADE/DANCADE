// constants/inventory.ts
// 인벤토리 관련 상수 및 타입 정의

/* =========================
 * 파츠 카테고리 (상단)
 * ========================= */
export const PART_CATEGORIES = ["Hair", "Top", "Bottom", "Feet"] as const;
export type PartCategory = (typeof PART_CATEGORIES)[number];

/* =========================
 * 색상 카테고리 (하단)
 * ========================= */
export const COLOR_CATEGORIES = [
  "Skin",
  "Eyes",
  "Hair",
  "Top",
  "Bottom",
  "Feet",
] as const;
export type ColorCategory = (typeof COLOR_CATEGORIES)[number];

/* =========================
 * 카테고리 → 파츠 매핑
 * ========================= */
export const COLOR_CATEGORY_TO_PART = {
  Skin: ["body", "head", "nose"],
  Eyes: ["eyes"],
  Hair: ["hair"],
  Top: ["torso"],
  Bottom: ["legs"],
  Feet: ["feet"],
} as const;

export const PART_CATEGORY_TO_PART = {
  hair: "hair",
  top: "torso",
  bottom: "legs",
  feet: "feet",
} as const;

/* =========================
 * 색상 팔레트 (JSON 기준)
 * ========================= */
export const COLOR_PALETTES: Record<ColorCategory, string[]> = {
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
  Feet: [
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
 * UI용 컬러 HEX
 * ========================= */
export const COLOR_HEX: Record<string, string> = {
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
 * 인벤토리 UI 설정
 * ========================= */
export const INVENTORY_CONFIG = {
  WIDTH: 400,
  HEIGHT: 520,
  CHARACTER_WIDTH: 64,
  CHARACTER_HEIGHT: 80,
  BOUNDARY_PADDING: 10,
  MIN_DISTANCE_OFFSET: 80,
  MAX_DISTANCE_OFFSET: 150,
  UPDATE_INTERVAL: 100,
} as const;
