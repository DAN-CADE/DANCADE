// app/auth/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import signupLogo from "@/public/assets/logos/signup-logo.svg";
import Window from "@/components/common/Window";
import { registerSchema, RegisterInput } from "@/lib/validations/auth";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<RegisterInput> = async (data) => {
    setServerError("");

    try {
      await registerUser({
        userid: data.userid,
        nickname: data.nickname,
        password: data.password,
      });

      alert("회원가입이 완료되었습니다!");
      router.push("/auth/login/id");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "회원가입에 실패했습니다.";
      setServerError(errorMessage);
    }
  };

  return (
    <main className="signup-page font-neo">
      <Window title="SIGNUP">
        <section className="signup-section flex flex-col justify-center items-center gap-12 w-full mb-9 px-4 lg:px-0">
          {/* 헤더 */}
          <header className="signup-header">
            <Image
              src={signupLogo}
              alt="DAN-CADE 회원가입 로고"
              className="w-[320px] lg:w-[340px] h-auto"
              priority
            />
          </header>

          {/* 서버 에러 표시 */}
          {serverError && (
            <div className="w-full max-w-[515px] p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-red-600 text-center">{serverError}</p>
            </div>
          )}

          {/* 회원가입 폼 */}
          <form
            className="signup-form w-full max-w-[515px] px-5 py-6 bg-[var(--color-white)]"
            onSubmit={handleSubmit(onSubmit)}
          >
            <fieldset className="form-fields space-y-6">
              <legend className="sr-only">회원가입 정보 입력</legend>

              {/* 아이디 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-start">
                <label
                  htmlFor="userid"
                  className="text-black mb-2 lg:mb-0 lg:w-[125px] text-lg lg:pt-4"
                >
                  아이디 *
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
                  {errors.userid && (
                    <p className="text-right text-[var(--color-pink)] text-sm mt-2">
                      {errors.userid.message}
                    </p>
                  )}
                </div>
              </div>

              {/* 닉네임 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-start">
                <label
                  htmlFor="nickname"
                  className="text-black mb-2 lg:mb-0 lg:w-[125px] text-lg lg:pt-4"
                >
                  닉네임 *
                </label>
                <div className="w-full">
                  <input
                    id="nickname"
                    type="text"
                    {...register("nickname")}
                    placeholder="닉네임을 입력하세요."
                    autoComplete="nickname"
                    className="w-full py-4 px-4 border border-[var(--color-navy)]
                               placeholder:text-slate-gray text-black 
                               focus:outline-none focus:ring-0"
                  />
                  {errors.nickname && (
                    <p className="text-right text-[var(--color-pink)] text-sm mt-2">
                      {errors.nickname.message}
                    </p>
                  )}
                </div>
              </div>

              {/* 비밀번호 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-start">
                <label
                  htmlFor="password"
                  className="text-black mb-2 lg:mb-0 lg:w-[125px] text-lg lg:pt-4"
                >
                  비밀번호 *
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
                    <p className="text-right text-[var(--color-pink)] text-sm mt-2">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </div>

              {/* 비밀번호 확인 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-start">
                <label
                  htmlFor="confirmPassword"
                  className="text-black mb-2 lg:mb-0 lg:w-[125px] text-lg lg:pt-4"
                >
                  비밀번호 확인 *
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
                    <p className="text-right text-[var(--color-pink)] text-sm mt-2">
                      {errors.confirmPassword.message}
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
                disabled={!isValid || isLoading}
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
