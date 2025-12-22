"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { z } from "zod";
import bcrypt from "bcryptjs";
import signupLogo from "@/public/assets/logos/signup-logo.svg";
import Window from "@/components/common/Window";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { generateGuestNickname } from "@/lib/utils/guestNickname";

// Zod 스키마 정의
const registerSchema = z
  .object({
    nickname: z
      .string()
      .min(2, "닉네임은 최소 2글자 이상이어야 합니다.")
      .max(20, "닉네임은 최대 20글자까지 가능합니다."),
    userId: z
      .string()
      .min(4, "아이디는 최소 4글자 이상이어야 합니다.")
      .max(20, "아이디는 최대 20글자까지 가능합니다.")
      .regex(/^[a-zA-Z0-9_-]+$/, "영문, 숫자, _, -만 사용 가능합니다."),
    password: z
      .string()
      .min(6, "영문과 숫자를 포함하여 최소 6글자 이상이어야 합니다.")
      .max(16, "비밀번호는 최대 16글자까지 가능합니다.")
      .regex(/[a-zA-Z]/)
      .regex(/[0-9]/),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [formData, setFormData] = useState<Partial<RegisterFormData>>({
    nickname: "",
    userId: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterFormData, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showLocalStoragePrompt, setShowLocalStoragePrompt] = useState(false);
  const [savedUserData, setSavedUserData] =
    useState<Partial<RegisterFormData> | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showUserSyncPrompt, setShowUserSyncPrompt] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // 로컬스토리지에서 저장된 사용자 정보 확인 (클라이언트 마운트 후)
  useEffect(() => {
    setIsMounted(true);

    // [user] key 존재 확인
    const userKey = localStorage.getItem("user");
    if (userKey) {
      try {
        const parsedUser = JSON.parse(userKey);
        setUserData(parsedUser);
        setShowUserSyncPrompt(true);
      } catch (error) {
        console.error("user 데이터 파싱 실패:", error);
      }
    }

    const savedData = localStorage.getItem("registerFormData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setSavedUserData(parsedData);
        setShowLocalStoragePrompt(true);
      } catch (error) {
        console.error("로컬스토리지 데이터 파싱 실패:", error);
      }
    }
  }, []); // 저장된 데이터 로드
  const loadSavedData = () => {
    if (savedUserData) {
      setFormData(savedUserData);
      setShowLocalStoragePrompt(false);
      // 에러 상태도 초기화
      setErrors({});
    }
  };

  // 저장된 데이터 무시
  const ignoreSavedData = () => {
    localStorage.removeItem("registerFormData");
    setShowLocalStoragePrompt(false);
  };

  // user 데이터 연동
  const syncUserData = () => {
    if (userData && userData.nickname) {
      setFormData((prev) => ({ ...prev, nickname: userData.nickname }));
      const error = validateField("nickname", userData.nickname);
      setErrors((prev) => ({ ...prev, nickname: error }));
    }
    setShowUserSyncPrompt(false);
  };

  // user 데이터 연동 취소
  const cancelUserSync = () => {
    setShowUserSyncPrompt(false);
  };

  // 개별 필드 유효성 검사
  const validateField = (
    field: keyof RegisterFormData,
    value: string
  ): string => {
    // 빈 값이면 에러 없음
    if (value.length === 0) {
      return "";
    }

    try {
      const fieldSchema = registerSchema.pick({ [field]: true });
      fieldSchema.parse({ [field]: value });
      return "";
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues[0]?.message || "";
      }
      return "";
    }
  };

  // 닉네임 중복 확인 함수
  const checkNicknameDuplicate = async (nickname: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("nickname", nickname)
        .single();

      // 데이터가 없으면 중복 아님 (사용 가능)
      if (error?.code === "PGRST116") {
        return false;
      }

      // 데이터가 있으면 중복
      return data !== null;
    } catch {
      return false;
    }
  };

  // 닉네임 자동생성 (중복 확인)
  const generateNickname = async () => {
    let newNickname = generateGuestNickname();
    let isDuplicate = await checkNicknameDuplicate(newNickname);
    let attempts = 0;

    // 최대 5번까지 중복되지 않은 닉네임 생성 시도
    while (isDuplicate && attempts < 5) {
      newNickname = generateGuestNickname();
      isDuplicate = await checkNicknameDuplicate(newNickname);
      attempts++;
    }

    setFormData((prev) => ({ ...prev, nickname: newNickname }));
    const error = validateField("nickname", newNickname);
    setErrors((prev) => ({ ...prev, nickname: error }));
  };

  // 입력값 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setFormData((prev) => ({ ...prev, [id]: value }));

    // 실시간 유효성 검사
    const error = validateField(id as keyof RegisterFormData, value);
    setErrors((prev) => ({ ...prev, [id]: error }));
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Zod를 이용한 전체 유효성 검사
    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof RegisterFormData;
        newErrors[field] = issue.message;
      });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // 닉네임 중복 확인
      const isNicknameDuplicate = await checkNicknameDuplicate(
        formData.nickname || ""
      );

      if (isNicknameDuplicate) {
        setErrors((prev) => ({
          ...prev,
          nickname: "이미 사용 중인 닉네임입니다.",
        }));
        setIsLoading(false);
        return;
      }

      // 아이디 중복 확인
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("userid", formData.userId)
        .single();

      if (!checkError?.code || checkError.code !== "PGRST116") {
        // PGRST116이 아니면서 에러가 있거나, 데이터가 있으면 중복
        if (existingUser) {
          setErrors((prev) => ({
            ...prev,
            userId: "이미 사용 중인 아이디입니다.",
          }));
          setIsLoading(false);
          return;
        }
      }

      // UUID 생성 (간단한 UUID v4 생성)
      const generateUUID = () => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          }
        );
      };

      // 비밀번호 암호화
      const hashedPassword = await bcrypt.hash(formData.password || "", 10);

      // public.users 테이블에 직접 저장
      const { data, error } = await supabase
        .from("users")
        .insert([
          {
            id: generateUUID(),
            userid: formData.userId,
            nickname: formData.nickname,
            password: hashedPassword,
            total_points: 0,
          },
        ])
        .select();

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        setSuccessMessage("회원가입이 완료되었습니다!");
        // 로컬스토리지에서 저장된 데이터 제거
        localStorage.removeItem("registerFormData");

        // 2초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push("/auth/login/id");
        }, 2000);
      }
    } catch (error) {
      console.error("회원가입 실패:", error);
      if (error instanceof Error) {
        setErrors((prev) => ({
          ...prev,
          userId: error.message || "회원가입 중 오류가 발생했습니다.",
        }));
      }
    } finally {
      setIsLoading(false);
      // 폼 데이터를 로컬스토리지에 저장 (성공한 경우 제외)
      if (!successMessage && isMounted) {
        localStorage.setItem("registerFormData", JSON.stringify(formData));
      }
    }
  };

  // 제출 가능 여부
  const isFormValid =
    formData.nickname &&
    formData.userId &&
    formData.password &&
    formData.passwordConfirm &&
    !errors.nickname &&
    !errors.userId &&
    !errors.password &&
    !errors.passwordConfirm;

  return (
    <main className="signup-page">
      <Window title="SIGNUP">
        <section
          className="
            signup-section
            flex flex-col
            justify-center items-center
            gap-12 w-full
            mb-9 px-4 lg:px-0
            relative
          "
        >
          {/* user 데이터 연동 모달 */}
          {isMounted && showUserSyncPrompt && userData && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
              <div className="w-full max-w-[515px] p-5 bg-slate-900 border border-cyan-400 rounded-xl shadow-lg shadow-cyan-500/20">
                <p className="text-cyan-400 mb-2 text-center font-bold text-base tracking-wider">
                  기존 게임 정보를 불러올까요?
                </p>

                <div className="text-slate-200 text-sm mb-5 space-y-2 bg-slate-800 bg-opacity-50 p-4 rounded-lg border border-slate-700">
                  <p className="flex items-center gap-3">
                    <span className="text-cyan-400">→</span>
                    <span className="text-slate-400">닉네임:</span>
                    <span className="font-semibold text-white">
                      {userData.nickname}
                    </span>
                  </p>
                </div>
                <div className="flex gap-3 justify-center border-none">
                  <button
                    type="button"
                    onClick={syncUserData}
                    className="pixelBtn pixelBtn--cyan px-5 py-2 cursor-pointer font-medium text-sm"
                  >
                    YES
                  </button>
                  <button
                    type="button"
                    onClick={cancelUserSync}
                    className="pixelBtn pixelBtn--gray px-5 py-2 cursor-pointer font-medium text-sm"
                  >
                    NO
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 성공 메시지 */}
          {successMessage && (
            <div className="w-full max-w-[515px] p-4 bg-green-100 border border-green-500 rounded text-green-700 text-center">
              {successMessage}
            </div>
          )}

          {/* 헤더 영역 */}
          <header className="signup-header">
            <Image
              src={signupLogo}
              alt="DAN-CADE 회원가입 로고"
              className="w-[320px] lg:w-[340px] h-auto"
            />
          </header>

          {/* 회원가입 폼 */}
          <form
            className="
              signup-form w-full max-w-[515px]
              px-5 py-6 bg-[var(--color-white)]
            "
            onSubmit={handleSubmit}
          >
            <fieldset className="form-fields space-y-6">
              <legend className="sr-only">회원가입 정보 입력</legend>

              {/* 닉네임 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-start">
                <label
                  htmlFor="nickname"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[140px] text-lg lg:pt-4"
                >
                  닉네임
                </label>
                <div className="w-full">
                  <div className="flex gap-2 items-center">
                    <input
                      id="nickname"
                      type="text"
                      value={formData.nickname}
                      onChange={handleChange}
                      placeholder="닉네임을 입력하세요."
                      autoComplete="username"
                      className="flex-1 py-4 px-4 border border-[var(--color-navy)]
                                 placeholder:text-slate-gray text-black 
                                 focus:outline-none focus:ring-2 focus:ring-[var(--color-cyan)] focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={generateNickname}
                      className="pixelBtn pixelBtn--cyan px-3 py-4 whitespace-nowrap cursor-pointer"
                    >
                      자동생성
                    </button>
                  </div>
                  {errors.nickname && (
                    <p className="text-left text-[var(--color-pink)] text-sm mt-2">
                      {errors.nickname}
                    </p>
                  )}
                </div>
              </div>

              {/* 아이디 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-start">
                <label
                  htmlFor="userId"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[140px] text-lg lg:pt-4"
                >
                  아이디
                </label>
                <div className="w-full">
                  <input
                    id="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    placeholder="아이디를 입력하세요."
                    autoComplete="username"
                    className="w-full py-4 px-4 border border-[var(--color-navy)]
                               placeholder:text-slate-gray text-black 
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-cyan)] focus:border-transparent"
                  />
                  {errors.userId && (
                    <p className="text-left text-[var(--color-pink)] text-sm mt-2">
                      {errors.userId}
                    </p>
                  )}
                </div>
              </div>

              {/* 비밀번호 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-start">
                <label
                  htmlFor="password"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[140px] text-lg lg:pt-4"
                >
                  비밀번호
                </label>
                <div className="w-full">
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="비밀번호를 입력하세요."
                    autoComplete="new-password"
                    className="w-full py-4 px-4 border border-[var(--color-navy)]
                               placeholder:text-slate-gray text-black 
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-cyan)] focus:border-transparent"
                  />
                  {errors.password && (
                    <p className="text-left text-[var(--color-pink)] text-sm mt-2">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-start">
                <label
                  htmlFor="passwordConfirm"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[140px] text-lg lg:pt-1"
                >
                  비밀번호 <br /> 확인
                </label>
                <div className="w-full">
                  <input
                    id="passwordConfirm"
                    type="password"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    placeholder="비밀번호를 다시 입력하세요."
                    autoComplete="new-password"
                    className="w-full py-4 px-4 border border-[var(--color-navy)]
                               placeholder:text-slate-gray text-black 
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-cyan)] focus:border-transparent"
                  />
                  {errors.passwordConfirm && (
                    <p className="text-left text-[var(--color-pink)] text-sm mt-2">
                      {errors.passwordConfirm}
                    </p>
                  )}
                </div>
              </div>
            </fieldset>

            {/* 버튼 */}
            <div className="button-group text-right mt-15">
              <Link
                href="/auth/login/id"
                className="login-button pixelBtn pixelBtn--gray mr-3 cursor-pointer"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="login-button pixelBtn pixelBtn--pink cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "가입 중..." : "회원가입"}
              </button>
            </div>
          </form>
        </section>
      </Window>
    </main>
  );
}
