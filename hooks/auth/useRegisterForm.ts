// hooks/auth/useRegisterForm.ts
// 회원가입 폼 로직 훅

import { useState, useEffect, useCallback } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/validations/auth";
import { useAuth } from "@/hooks/auth/useAuth";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { useDebounce } from "@/hooks/useDebounce";
import { generateGuestNickname } from "@/lib/utils/guestNickname";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export type CheckStatus = "idle" | "checking" | "available" | "duplicate";

interface UseRegisterFormOptions {
  onSuccess?: () => void;
}

export interface UseRegisterFormReturn {
  // Form 관련
  form: ReturnType<typeof useForm<RegisterInput>>;
  isLoading: boolean;
  serverError: string;
  onSubmit: SubmitHandler<RegisterInput>;

  // 중복 체크
  userIdCheckStatus: CheckStatus;
  nicknameCheckStatus: CheckStatus;
  checkDuplicate: (
    field: "userid" | "nickname",
    value: string,
    setStatus: React.Dispatch<React.SetStateAction<CheckStatus>>
  ) => Promise<void>;

  // 게스트 데이터
  hasGuestData: boolean;
  guestNickname: string;
  guestPoints: number;
  shouldLoadGuestData: boolean;
  guestDataSelected: boolean;
  setShouldLoadGuestData: React.Dispatch<React.SetStateAction<boolean>>;
  setGuestDataSelected: React.Dispatch<React.SetStateAction<boolean>>;

  // 닉네임 생성
  isGenerating: boolean;
  generateAvailableNickname: () => Promise<string>;
  setNicknameCheckStatus: React.Dispatch<React.SetStateAction<CheckStatus>>;

  // 입력 포커스 관리
  handleFocus: () => void;
  handleBlur: () => void;
  unlockInput: () => void;
}

export function useRegisterForm({
  onSuccess,
}: UseRegisterFormOptions = {}): UseRegisterFormReturn {
  const router = useRouter();
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

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const { setValue, watch } = form;
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
    []
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
      checkDuplicate("nickname", debouncedNickname, setNicknameCheckStatus);
    }
  }, [debouncedNickname, checkDuplicate]);

  // 사용 가능한 랜덤 닉네임 생성
  const generateAvailableNickname = async (): Promise<string> => {
    setIsGenerating(true);
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
          isAvailable = true;
        } else {
          newNickname = generateGuestNickname();
          attempts++;
        }
      } catch (error) {
        console.error("닉네임 생성 중 오류:", error);
        setServerError("닉네임 생성 중 오류가 발생했습니다.");
        break;
      }
    }

    setIsGenerating(false);
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

      // 3. 게스트 데이터 초기화
      clearGuestData();

      // 로컬스토리지 업데이트
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
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
    setTimeout(() => {
      if (document.activeElement?.tagName === "INPUT") return;
      window.dispatchEvent(new Event("game:input-unlocked"));
    }, 10);
  };

  // 폼 닫힐 때 명시적으로 잠금 해제 (취소 버튼 등)
  const unlockInput = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("game:input-unlocked"));
    }
  };

  return {
    form,
    isLoading,
    serverError,
    onSubmit,
    userIdCheckStatus,
    nicknameCheckStatus,
    checkDuplicate,
    hasGuestData,
    guestNickname,
    guestPoints,
    shouldLoadGuestData,
    guestDataSelected,
    setShouldLoadGuestData,
    setGuestDataSelected,
    isGenerating,
    generateAvailableNickname,
    setNicknameCheckStatus,
    handleFocus,
    handleBlur,
    unlockInput,
  };
}
