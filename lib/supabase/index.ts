export { supabase, createServerClient } from "./client";
export { getRankings, saveScore, getMyBestScore } from "./ranking";
export { getUserStats, upsertUserStats } from "./userStats";
export { insertGameResult, insertMultiGameResult } from "./gameResults";
export { fetchUserInventory, saveItemToInventory } from "./inventory";
export type { InventoryItem } from "./inventory";
export { getItemById } from "./item";
export {
  getPlayer,
  upsertPlayer,
  updatePlayerPosition,
  getOnlinePlayers,
  setPlayerOffline,
  subscribeToPlayers,
} from "./player";
