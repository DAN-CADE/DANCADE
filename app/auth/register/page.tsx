"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import signupLogo from "@/public/assets/logos/signup-logo.svg";
import Window from "@/components/common/Window";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    userId: "",
    password: "",
    email: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    userId: "",
    password: "",
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // 이름 유효성 검사
  const validateName = (value: string): string => {
    if (value.length === 0) return "";
    if (value.length < 2) return "이름은 최소 2글자 이상이어야 합니다.";
    if (!/^[가-힣a-zA-Z\s]+$/.test(value)) {
      return "한글 또는 영문만 사용 가능합니다.";
    }
    return "";
  };

  // 아이디 유효성 검사
  const validateUserId = (value: string): string => {
    if (value.length === 0) return "";
    if (value.length < 4) return "아이디는 최소 4글자 이상이어야 합니다.";
    if (value.length > 20) return "아이디는 최대 20글자까지 가능합니다.";
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return "영문, 숫자, _, -만 사용 가능합니다.";
    }
    return "";
  };

  // 비밀번호 유효성 검사
  const validatePassword = (value: string): string => {
    if (value.length === 0) return "";
    if (value.length < 8) return "비밀번호는 최소 8글자 이상이어야 합니다.";
    if (value.length > 16) return "비밀번호는 최대 16글자까지 가능합니다.";

    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (!hasLetter || !hasNumber || !hasSpecial) {
      return "영문, 숫자, 특수문자를 포함하여 8-16자";
    }
    return "";
  };

  // 이메일 유효성 검사
  const validateEmail = (value: string): string => {
    if (value.length === 0) return "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "올바른 이메일 형식이 아닙니다.";
    }
    return "";
  };

  // 입력값 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    setFormData((prev) => ({ ...prev, [id]: value }));

    // 실시간 유효성 검사
    let error = "";
    switch (id) {
      case "name":
        error = validateName(value);
        break;
      case "userId":
        error = validateUserId(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
    }

    setErrors((prev) => ({ ...prev, [id]: error }));
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 최종 유효성 검사
    const newErrors = {
      name: validateName(formData.name),
      userId: validateUserId(formData.userId),
      password: validatePassword(formData.password),
      email: validateEmail(formData.email),
    };

    setErrors(newErrors);

    // 에러가 하나라도 있으면 제출 중단
    if (Object.values(newErrors).some((error) => error !== "")) {
      return;
    }

    setIsLoading(true);

    try {
      // ******************** Supabase 회원가입
      // const { data, error } = await supabase.auth.signUp({
      //   email: formData.email,
      //   password: formData.password,
      //   options: {
      //     data: {
      //       name: formData.name,
      //       userId: formData.userId,
      //     }
      //   }
      // });
      // if (error) throw error;

      console.log("회원가입 시도:", formData);

      // ******************** 성공 시 로그인 페이지로 이동
      // router.push('/auth/login/id')
    } catch (error) {
      console.error("회원가입 실패:", error);
      // 중복 아이디 등의 에러 처리
      setErrors((prev) => ({
        ...prev,
        userId: "이미 사용 중인 아이디입니다.",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // 제출 가능 여부
  const isFormValid =
    formData.name &&
    formData.userId &&
    formData.password &&
    formData.email &&
    !errors.name &&
    !errors.userId &&
    !errors.password &&
    !errors.email;

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
          "
        >
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

              {/* 이름 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-start">
                <label
                  htmlFor="name"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[125px] text-lg lg:pt-4"
                >
                  이름
                </label>
                <div className="w-full">
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="이름을 입력하세요."
                    autoComplete="name"
                    className="w-full py-4 px-4 border border-[var(--color-navy)]
                               placeholder:text-slate-gray text-black 
                               focus:outline-none focus:ring-0"
                  />
                  {errors.name && (
                    <p className="text-right text-[var(--color-pink)] text-sm mt-2">
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>

              {/* 아이디 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-start">
                <label
                  htmlFor="userId"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[125px] text-lg lg:pt-4"
                >
                  아이디
                </label>
                <div className="w-full">
                  <input
                    id="userId"
                    type="text"
                    value={formData.userId}
                    onChange={handleChange}
                    placeholder="아이디를 입력하세요."
                    autoComplete="username"
                    className="w-full py-4 px-4 border border-[var(--color-navy)]
                               placeholder:text-slate-gray text-black 
                               focus:outline-none focus:ring-0"
                  />
                  {errors.userId && (
                    <p className="text-right text-[var(--color-pink)] text-sm mt-2">
                      {errors.userId}
                    </p>
                  )}
                </div>
              </div>

              {/* 비밀번호 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-start">
                <label
                  htmlFor="password"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[125px] text-lg lg:pt-4"
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
                               focus:outline-none focus:ring-0"
                  />
                  {errors.password && (
                    <p className="text-right text-[var(--color-pink)] text-sm mt-2">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              {/* 이메일 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-start">
                <label
                  htmlFor="email"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[125px] text-lg lg:pt-4"
                >
                  이메일
                </label>
                <div className="w-full">
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="이메일을 입력하세요."
                    autoComplete="email"
                    className="w-full py-4 px-4 border border-[var(--color-navy)]
                               placeholder:text-slate-gray text-black 
                               focus:outline-none focus:ring-0"
                  />
                  {errors.email && (
                    <p className="text-right text-[var(--color-pink)] text-sm mt-2">
                      {errors.email}
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
