// components/auth/FormField.tsx
// 재사용 가능한 폼 필드 컴포넌트

import { forwardRef, InputHTMLAttributes, ReactNode } from "react";
import type { CheckStatus } from "@/hooks/auth/useRegisterForm";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  checkStatus?: CheckStatus;
  showStatusWhen?: boolean;
  minLengthHint?: { length: number; message: string };
  isModal?: boolean;
  rightElement?: ReactNode;
}

/**
 * 재사용 가능한 폼 필드 컴포넌트
 * - 라벨, 입력, 에러 메시지, 중복 체크 상태 통합
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      error,
      checkStatus,
      showStatusWhen = true,
      minLengthHint,
      isModal = false,
      rightElement,
      value,
      ...inputProps
    },
    ref
  ) => {
    const inputValue = value as string | undefined;
    const showError = error && inputValue;
    const showStatus =
      !error && checkStatus !== "idle" && showStatusWhen && inputValue;
    const showMinLengthHint =
      !error &&
      checkStatus === "idle" &&
      minLengthHint &&
      inputValue &&
      inputValue.length < minLengthHint.length;

    return (
      <div className="form-field flex flex-col lg:flex-row lg:items-start">
        <label
          htmlFor={inputProps.id}
          className={`text-black mb-2 lg:mb-0 font-bold text-base lg:text-lg whitespace-nowrap ${
            isModal ? "w-full lg:w-[100px]" : "lg:w-[140px]"
          }`}
        >
          <span className="inline-block bg-[var(--color-pink)]/10 px-3 py-2 rounded-md lg:bg-transparent lg:px-0 lg:py-0">
            {label}{" "}
            <span className="text-[var(--color-pink)] font-bold">*</span>
          </span>
        </label>
        <div className="w-full">
          <div className={rightElement ? "flex gap-2" : ""}>
            <input
              ref={ref}
              value={value}
              className={`${
                rightElement ? "flex-1" : "w-full"
              } py-4 px-4 border border-[var(--color-navy)]
                placeholder:text-slate-gray text-black 
                focus:outline-none focus:ring-0`}
              {...inputProps}
            />
            {rightElement}
          </div>

          {/* 에러 메시지 */}
          {showError && (
            <p className="text-left text-[var(--color-pink)] text-sm mt-2">
              {error}
            </p>
          )}

          {/* 중복 체크 상태 */}
          {showStatus && (
            <p
              className={`text-left text-sm mt-2 ${getStatusColor(
                checkStatus
              )}`}
            >
              {getStatusMessage(checkStatus)}
            </p>
          )}

          {/* 최소 길이 힌트 */}
          {showMinLengthHint && (
            <p className="text-left text-gray-500 text-xs mt-2">
              {minLengthHint.message}
            </p>
          )}
        </div>
      </div>
    );
  }
);

FormField.displayName = "FormField";

// 헬퍼 함수들
function getStatusColor(status?: CheckStatus): string {
  switch (status) {
    case "checking":
      return "text-gray-500";
    case "available":
      return "text-green-600 font-bold";
    case "duplicate":
      return "text-red-600 font-bold";
    default:
      return "";
  }
}

function getStatusMessage(status?: CheckStatus): string {
  switch (status) {
    case "checking":
      return "⏳ 확인 중...";
    case "available":
      return "✓ 사용 가능합니다";
    case "duplicate":
      return "✗ 이미 사용 중입니다";
    default:
      return "";
  }
}

// 비밀번호 전용 (라벨 줄바꿈)
interface PasswordFieldProps extends Omit<FormFieldProps, "label"> {
  labelLines: [string, string];
}

export const PasswordConfirmField = forwardRef<
  HTMLInputElement,
  PasswordFieldProps
>(({ labelLines, isModal = false, error, value, ...inputProps }, ref) => {
  const inputValue = value as string | undefined;

  return (
    <div className="form-field flex flex-col lg:flex-row lg:items-start">
      <label
        htmlFor={inputProps.id}
        className={`text-black mb-2 lg:mb-0 font-bold text-base lg:text-lg ${
          isModal ? "w-full lg:w-[100px]" : "lg:w-[140px]"
        }`}
      >
        <span className="inline-block bg-[var(--color-pink)]/10 px-3 py-2 rounded-md lg:bg-transparent lg:px-0 lg:py-0">
          {labelLines[0]}
          <br className="hidden lg:block" />
          {labelLines[1]}{" "}
          <span className="text-[var(--color-pink)] font-bold">*</span>
        </span>
      </label>
      <div className="w-full">
        <input
          ref={ref}
          value={value}
          className="w-full py-4 px-4 border border-[var(--color-navy)]
              placeholder:text-slate-gray text-black 
              focus:outline-none focus:ring-0"
          {...inputProps}
        />
        {error && inputValue && (
          <p className="text-left text-[var(--color-pink)] text-sm mt-2">
            {error}
          </p>
        )}
      </div>
    </div>
  );
});

PasswordConfirmField.displayName = "PasswordConfirmField";
