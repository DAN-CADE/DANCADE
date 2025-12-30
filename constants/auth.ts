// constants/auth.ts
export const STORAGE_KEYS = {
  USER: "user",
} as const;

export const LOGIN_ROUTES = {
  EMAIL: "/auth/login/id",
  CHARACTER_SELECT: "/character-select",
} as const;

export const LOGIN_BUTTONS = [
  {
    id: "email",
    label: "아이디 로그인",
    style: "bg-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/90",
    type: "email" as const,
  },
  {
    id: "guest",
    label: "게스트 로그인",
    style: "border border-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10",
    type: "guest" as const,
    textColor: "text-white",
  },
] as const;

export type LoginType = (typeof LOGIN_BUTTONS)[number]["type"];
