"use client";

import { ButtonHTMLAttributes } from "react";

interface LoginButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  styleClass: string;
  textColor?: string;
  isLoading?: boolean;
}

export default function LoginButton({
  label,
  styleClass,
  textColor = "",
  isLoading = false,
  disabled,
  ...props
}: LoginButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`
        ${styleClass}
        ${textColor}
        py-5 max-w-[320px] w-full
        cursor-pointer
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-[var(--color-cyan)] focus:ring-offset-2
      `}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          로그인 중...
        </span>
      ) : (
        label
      )}
    </button>
  );
}
