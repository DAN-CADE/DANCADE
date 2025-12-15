// 헬퍼 함수들
import { LPCStyle } from "@/types/lpc";

/**
 * 랜덤 배열 요소 선택
 */
export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 성별에 맞는 헤어 스타일 필터링
 */
export function getHairStylesByGender(
  styles: LPCStyle[] | undefined,
  gender: "male" | "female"
): LPCStyle[] {
  if (!styles) return [];
  return styles.filter((s) => !s.genders || s.genders.includes(gender));
}
