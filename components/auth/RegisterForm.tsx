"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/validations/auth";
import { useAuth } from "@/hooks/useAuth";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { generateGuestNickname } from "@/lib/utils/guestNickname";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type CheckStatus = "idle" | "checking" | "available" | "duplicate";

interface RegisterFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export default function RegisterForm({
  onSuccess,
  onCancel,
  isModal = false,
}: RegisterFormProps) {
  const router = useRouter(); // For page usage fallback
  const { register: registerUser, isLoading } = useAuth();
  const { getStoredUser, clearGuestData } = useGuestAuth();

  const [serverError, setServerError] = useState<string>("");
  const [hasGuestData, setHasGuestData] = useState<boolean>(false);
  const [guestNickname, setGuestNickname] = useState<string>("");
  const [guestPoints, setGuestPoints] = useState<number>(0);
  const [shouldLoadGuestData, setShouldLoadGuestData] =
    useState<boolean>(false);
  const [guestDataSelected, setGuestDataSelected] = useState<boolean>(false);

  // 중복 체크 상태
  const [userIdCheckStatus, setUserIdCheckStatus] =
    useState<CheckStatus>("idle");
  const [nicknameCheckStatus, setNicknameCheckStatus] =
    useState<CheckStatus>("idle");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const userIdValue = watch("userid");
  const nicknameValue = watch("nickname");

  const debouncedUserId = useDebounce(userIdValue, 500);
  const debouncedNickname = useDebounce(nicknameValue, 500);

  // 통합된 중복 체크 함수
  const checkDuplicate = useCallback(
    async (
      field: "userid" | "nickname",
      value: string,
      setStatus: React.Dispatch<React.SetStateAction<CheckStatus>>
    ) => {
      const minLength = field === "userid" ? 4 : 2;

      // 필드가 비어있거나 유효한 형식 미만이면 상태 초기화
      if (!value || value.length < minLength) {
        setStatus("idle");
        return;
      }

      setStatus("checking");
      try {
        const { data, error } = await supabase
          .from("users")
          .select(field)
          .eq(field, value)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        setStatus(data ? "duplicate" : "available");
      } catch (error) {
        console.error(`${field} 중복 확인 실패:`, error);
        setServerError(
          `${
            field === "userid" ? "아이디" : "닉네임"
          } 중복 확인 중 오류가 발생했습니다.`
        );
        setStatus("idle");
      }
    },
    [setServerError]
  );

  // 게스트 정보 확인
  useEffect(() => {
    const user = getStoredUser();
    if (user && user.isGuest) {
      setHasGuestData(true);
      setGuestNickname(user.nickname);
      setGuestPoints(user.points || 0);
    }
  }, [getStoredUser]);

  // 불러오기/아니요 선택 시 닉네임 자동 입력/초기화
  useEffect(() => {
    if (shouldLoadGuestData && guestNickname) {
      setValue("nickname", guestNickname, { shouldValidate: true });
      // 게스트 닉네임도 중복 체크 수행
      setNicknameCheckStatus("checking");
    } else if (!shouldLoadGuestData) {
      setValue("nickname", "", { shouldValidate: true });
      setNicknameCheckStatus("idle");
    }
  }, [shouldLoadGuestData, guestNickname, setValue]);

  // 디바운싱된 아이디로 중복 체크
  useEffect(() => {
    if (debouncedUserId) {
      checkDuplicate("userid", debouncedUserId, setUserIdCheckStatus);
    } else {
      setUserIdCheckStatus("idle");
    }
  }, [debouncedUserId, checkDuplicate]);

  // 디바운싱된 닉네임으로 중복 체크
  useEffect(() => {
    if (debouncedNickname) {
      // 게스트 불러오기 상태든 아니든 항상 중복 체크 수행
      checkDuplicate("nickname", debouncedNickname, setNicknameCheckStatus);
    }
  }, [debouncedNickname, checkDuplicate]);

  // 사용 가능한 랜덤 닉네임 생성
  const generateAvailableNickname = async (): Promise<string> => {
    let newNickname = generateGuestNickname();
    let isAvailable = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isAvailable && attempts < maxAttempts) {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("nickname")
          .eq("nickname", newNickname)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (!data) {
          // 중복되지 않으면 사용
          isAvailable = true;
        } else {
          // 중복되면 다시 생성
          newNickname = generateGuestNickname();
          attempts++;
        }
      } catch (error) {
        console.error("닉네임 생성 중 오류:", error);
        setServerError("닉네임 생성 중 오류가 발생했습니다.");
        break;
      }
    }

    return newNickname;
  };

  const onSubmit: SubmitHandler<RegisterInput> = async (data) => {
    setServerError("");

    // 중복 체크 검증
    if (userIdCheckStatus !== "available") {
      setServerError("아이디 중복 확인이 필요합니다.");
      return;
    }
    if (nicknameCheckStatus !== "available") {
      setServerError("닉네임 중복 확인이 필요합니다.");
      return;
    }

    try {
      // 1. 회원가입 처리
      const newUser = await registerUser({
        userid: data.userid,
        nickname: data.nickname,
        password: data.password,
      });

      // 2. 포인트 승계 처리 (불러오기 선택 시)
      if (shouldLoadGuestData && guestPoints > 0) {
        const totalPoints = newUser.total_points + guestPoints;

        // DB 업데이트
        const { error: updateError } = await supabase
          .from("users")
          .update({ total_points: totalPoints })
          .eq("id", newUser.id);

        if (updateError) {
          console.error("포인트 승계 실패:", updateError);
          setServerError(
            "회원가입은 완료되었으나 포인트 승계에 실패했습니다. 고객센터에 문의해주세요."
          );
        } else {
          console.log(`포인트 승계 완료: ${guestPoints}P → 총 ${totalPoints}P`);
        }
      }

      // 3. 게스트 데이터 초기화 (AUTH-009)
      clearGuestData();

      // 로컬스토리지의 user 데이터 완전 삭제
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        // 회원 정보를 로컬스토리지에 저장
        const memberData = {
          id: newUser.id,
          userid: newUser.userid,
          nickname: newUser.nickname,
          total_points: newUser.total_points,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at,
          isGuest: false,
        };
        localStorage.setItem("user", JSON.stringify(memberData));
      }

      // 4. 완료 처리
      if (onSuccess) {
        onSuccess();
      } else {
        // Default behavior for page usage
        router.push("/character-select");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "회원가입에 실패했습니다.";
      setServerError(errorMessage);
    }
  };

  // 입력 필드 포커스 관리 (게임 키 잠금)
  const handleFocus = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("game:input-locked"));
    }
  };

  const handleBlur = () => {
    // 모든 포커스가 해제되었을 때만 잠금 해제해야 하지만
    // 간단하게 blur 시 해제하고, 다른 input focus 시 다시 잠기도록 함
    // (React input 이벤트 버블링 특성 상 빠르게 focus가 먼저 실행될 수도 있음)
    // 안전하게 약간의 지연을 줄 수도 있으나 여기선 직접 호출
    setTimeout(() => {
      // 활성 엘리먼트가 여전히 input 태그라면 잠금 유지
      if (document.activeElement?.tagName === "INPUT") return;
      window.dispatchEvent(new Event("game:input-unlocked"));
    }, 10);
  };

  return (
    <form
      className={`signup-form w-full bg-[var(--color-white)] ${
        isModal ? "" : "max-w-[515px] px-5 py-6"
      }`}
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      onFocusCapture={handleFocus}
      onBlurCapture={handleBlur}
    >
      <fieldset className="form-fields space-y-6">
        <legend className="sr-only">회원가입 정보 입력</legend>

        {/* 게스트 정보 불러오기 선택 */}
        {hasGuestData && !guestDataSelected && (
          <div className="bg-[var(--color-pink)]/10 border-2 border-[var(--color-pink)]/60 rounded-lg px-5 py-4 mb-6">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm text-[var(--color-pink)] font-bold mb-2">
                  ✨ 게스트 데이터 불러오기
                </p>
                {guestPoints > 0 && (
                  <p className="text-sm text-[var(--color-navy)]">
                    <span className="font-bold">{guestNickname}</span>
                    <span className="mx-2 text-[var(--color-pink)]">•</span>
                    <span className="font-bold text-[var(--color-pink)]">
                      {guestPoints}P
                    </span>
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShouldLoadGuestData(false);
                    setGuestDataSelected(true);
                  }}
                  className={`flex-1 px-4 py-2 font-bold rounded-lg text-sm transition-all duration-200 ${
                    !shouldLoadGuestData
                      ? "bg-[var(--color-pink)] text-white shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
                      : "bg-[var(--color-pink)]/20 text-[var(--color-pink)] hover:bg-[var(--color-pink)]/30"
                  }`}
                >
                  아니요
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShouldLoadGuestData(true);
                    setGuestDataSelected(true);
                  }}
                  className={`flex-1 px-4 py-2 font-bold rounded-lg text-sm transition-all duration-200 ${
                    shouldLoadGuestData
                      ? "bg-[var(--color-pink)] text-white shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
                      : "bg-[var(--color-pink)]/20 text-[var(--color-pink)] hover:bg-[var(--color-pink)]/30"
                  }`}
                >
                  불러오기
                </button>
              </div>
            </div>
          </div>
        )}
        {hasGuestData && guestDataSelected && (
          <div className="bg-green-100 border-2 border-green-500 rounded-lg px-5 py-4 mb-6">
            <div className="flex flex-col gap-3 items-center">
              <p className="text-sm text-green-700 font-bold text-center">
                ✓{" "}
                {shouldLoadGuestData
                  ? "게스트 정보가 적용되었습니다"
                  : "새로운 계정으로 진행합니다"}
              </p>
              <button
                type="button"
                onClick={() => setGuestDataSelected(false)}
                className="text-sm text-green-700 font-bold underline hover:text-green-900 transition-colors"
              >
                다시 선택하기
              </button>
            </div>
          </div>
        )}

        {/* 아이디 */}
        <div className="form-field flex flex-col lg:flex-row lg:items-start">
          <label
            htmlFor="userid"
            className={`text-black mb-2 lg:mb-0 font-bold text-base lg:text-lg whitespace-nowrap ${
              isModal ? "w-full lg:w-[100px]" : "lg:w-[140px]"
            }`}
          >
            <span className="inline-block bg-[var(--color-pink)]/10 px-3 py-2 rounded-md lg:bg-transparent lg:px-0 lg:py-0">
              아이디{" "}
              <span className="text-[var(--color-pink)] font-bold">*</span>
            </span>
          </label>
          <div className="w-full">
            <input
              id="userid"
              type="text"
              {...register("userid")}
              placeholder="아이디를 입력하세요."
              autoComplete="username"
              className="w-full py-4 px-4 border border-[var(--color-navy)]
                          placeholder:text-slate-gray text-black 
                          focus:outline-none focus:ring-0"
            />
            {errors.userid && userIdValue && (
              <p className="text-left text-[var(--color-pink)] text-sm mt-2">
                {errors.userid.message}
              </p>
            )}
            {!errors.userid && userIdCheckStatus !== "idle" && userIdValue && (
              <p
                className={`text-left text-sm mt-2 ${
                  userIdCheckStatus === "checking"
                    ? "text-gray-500"
                    : userIdCheckStatus === "available"
                    ? "text-green-600 font-bold"
                    : "text-red-600 font-bold"
                }`}
              >
                {userIdCheckStatus === "checking" && "⏳ 확인 중..."}
                {userIdCheckStatus === "available" && "✓ 사용 가능합니다"}
                {userIdCheckStatus === "duplicate" &&
                  "✗ 이미 사용 중인 아이디입니다"}
              </p>
            )}
            {!errors.userid &&
              userIdCheckStatus === "idle" &&
              userIdValue &&
              userIdValue.length < 4 && (
                <p className="text-left text-gray-500 text-xs mt-2">
                  아이디는 최소 4글자 이상이어야 합니다.
                </p>
              )}
          </div>
        </div>

        {/* 닉네임 */}
        <div className="form-field flex flex-col lg:flex-row lg:items-start">
          <label
            htmlFor="nickname"
            className={`text-black mb-2 lg:mb-0 font-bold text-base lg:text-lg whitespace-nowrap ${
              isModal ? "w-full lg:w-[100px]" : "lg:w-[140px]"
            }`}
          >
            <span className="inline-block bg-[var(--color-pink)]/10 px-3 py-2 rounded-md lg:bg-transparent lg:px-0 lg:py-0">
              닉네임{" "}
              <span className="text-[var(--color-pink)] font-bold">*</span>
            </span>
          </label>
          <div className="w-full">
            <div className="flex gap-2">
              <input
                id="nickname"
                type="text"
                {...register("nickname")}
                placeholder="닉네임을 입력하세요."
                autoComplete="nickname"
                className="flex-1 py-4 px-4 border border-[var(--color-navy)]
                            placeholder:text-slate-gray text-black 
                            focus:outline-none focus:ring-0"
              />
              <button
                type="button"
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    const newNickname = await generateAvailableNickname();
                    setValue("nickname", newNickname, {
                      shouldValidate: true,
                    });
                    // 생성된 닉네임 자동 체크
                    await checkDuplicate(
                      "nickname",
                      newNickname,
                      setNicknameCheckStatus
                    );
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating}
                className="px-4 py-2 bg-[var(--color-pink)] text-white font-bold rounded-lg 
                            hover:bg-[var(--color-pink)]/90 transition-colors duration-200
                            disabled:bg-gray-400 disabled:cursor-not-allowed
                            whitespace-nowrap text-sm"
                title="랜덤 닉네임 생성"
              >
                {isGenerating ? "⏳ 생성중..." : "🎲 생성"}
              </button>
            </div>
            {errors.nickname && nicknameValue && (
              <p className="text-left text-[var(--color-pink)] text-sm mt-2">
                {errors.nickname.message}
              </p>
            )}
            {!errors.nickname &&
              nicknameCheckStatus !== "idle" &&
              nicknameValue && (
                <p
                  className={`text-left text-sm mt-2 ${
                    nicknameCheckStatus === "checking"
                      ? "text-gray-500"
                      : nicknameCheckStatus === "available"
                      ? "text-green-600 font-bold"
                      : "text-red-600 font-bold"
                  }`}
                >
                  {nicknameCheckStatus === "checking" && "⏳ 확인 중..."}
                  {nicknameCheckStatus === "available" && "✓ 사용 가능합니다"}
                  {nicknameCheckStatus === "duplicate" &&
                    "✗ 이미 사용 중인 닉네임입니다"}
                </p>
              )}
          </div>
        </div>

        {/* 비밀번호 */}
        <div className="form-field flex flex-col lg:flex-row lg:items-start">
          <label
            htmlFor="password"
            className={`text-black mb-2 lg:mb-0 font-bold text-base lg:text-lg whitespace-nowrap ${
              isModal ? "w-full lg:w-[100px]" : "lg:w-[140px]"
            }`}
          >
            <span className="inline-block bg-[var(--color-pink)]/10 px-3 py-2 rounded-md lg:bg-transparent lg:px-0 lg:py-0">
              비밀번호{" "}
              <span className="text-[var(--color-pink)] font-bold">*</span>
            </span>
          </label>
          <div className="w-full">
            <input
              id="password"
              type="password"
              {...register("password")}
              placeholder="비밀번호를 입력하세요."
              autoComplete="new-password"
              className="w-full py-4 px-4 border border-[var(--color-navy)]
                          placeholder:text-slate-gray text-black 
                          focus:outline-none focus:ring-0"
            />
            {errors.password && (
              <p className="text-left text-[var(--color-pink)] text-sm mt-2">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        {/* 비밀번호 확인 */}
        <div className="form-field flex flex-col lg:flex-row lg:items-start">
          <label
            htmlFor="confirmPassword"
            className={`text-black mb-2 lg:mb-0 font-bold text-base lg:text-lg ${
              isModal ? "w-full lg:w-[100px]" : "lg:w-[140px]"
            }`}
          >
            <span className="inline-block bg-[var(--color-pink)]/10 px-3 py-2 rounded-md lg:bg-transparent lg:px-0 lg:py-0">
              비밀번호
              <br className="hidden lg:block" />
              확인 <span className="text-[var(--color-pink)] font-bold">*</span>
            </span>
          </label>
          <div className="w-full">
            <input
              id="confirmPassword"
              type="password"
              {...register("confirmPassword")}
              placeholder="비밀번호를 다시 입력하세요."
              autoComplete="new-password"
              className="w-full py-4 px-4 border border-[var(--color-navy)]
                          placeholder:text-slate-gray text-black 
                          focus:outline-none focus:ring-0"
            />
            {errors.confirmPassword && (
              <p className="text-left text-[var(--color-pink)] text-sm mt-2">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {serverError && (
        <div className="mt-4 p-3 bg-red-100 text-red-600 rounded-md text-sm font-bold">
          {serverError}
        </div>
      )}

      {/* 버튼 */}
      <div className="button-group flex gap-3 mt-8 justify-end">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="pixelBtn pixelBtn--gray text-black font-bold px-6 py-3 cursor-pointer hover:opacity-90 transition-opacity"
          >
            취소
          </button>
        ) : (
          <Link
            href="/auth/login/id"
            className="pixelBtn pixelBtn--gray text-black font-bold px-6 py-3 cursor-pointer hover:opacity-90 transition-opacity"
          >
            취소
          </Link>
        )}

        <button
          type="submit"
          disabled={!isValid || isLoading}
          className="pixelBtn pixelBtn--pink text-black font-bold px-6 py-3 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "가입 중..." : "회원가입"}
        </button>
      </div>
    </form>
  );
}
