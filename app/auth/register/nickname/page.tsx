"use client";

import { useState } from "react";
import Image from "next/image";
import logo from "@/public/assets/logos/logo.svg";
import Window from "@/components/common/Window";

export default function NicknamePage() {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  // 닉네임 유효성 검사
  const validateNickname = (value: string): string => {
    if (value.length === 0) return "";
    if (value.length < 2) return "최소 2글자 이상 입력해주세요.";
    if (value.length > 8) return "최대 8글자까지 입력 가능합니다.";
    if (!/^[가-힣a-zA-Z0-9]+$/.test(value)) {
      return "한글, 영문, 숫자만 사용 가능합니다.";
    }
    return "";
  };

  // 입력값 변경 처리
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);
    setError(validateNickname(value));
  };

  // 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = validateNickname(nickname);
    if (validationError) {
      setError(validationError);
      return;
    }

    // ******************** Supabase에 닉네임 저장 또는 중복 체크
    console.log("닉네임 설정:", nickname);

    // ******************** 성공 시 다음 페이지로 이동
    // router.push('/character-select')
  };

  return (
    <main className="nickname-page min-h-screen relative">
      <div className="absolute inset-0 bg-[url('/assets/background/common.png')] bg-cover bg-center bg-no-repeat opacity-15 -z-10" />

      <Window title="NICKNAME">
        <section className="nickname-section flex flex-col items-center justify-center w-full px-4 lg:px-0">
          {/* 로고 */}
          <header className="nickname-header mb-10 text-center">
            <Image
              src={logo}
              alt="DAN-CADE 로고"
              className="w-[320px] lg:w-[260px] h-auto mx-auto"
            />
          </header>

          {/* 닉네임 입력 */}
          <div className="nickname-modal w-full max-w-[460px] py-8 px-6 text-center text-white">
            <h2 className="text-xl mb-6">닉네임 설정</h2>

            <form
              className="flex flex-col items-center w-full"
              onSubmit={handleSubmit}
            >
              <input
                type="text"
                value={nickname}
                onChange={handleChange}
                placeholder="사용할 닉네임을 입력하세요."
                maxLength={8}
                className="
                  w-full py-4 px-4 
                  border border-[var(--color-navy)] 
                  placeholder:text-[var(--color-slate-gray)] 
                  text-[var(--color-black)]
                  text-center
                  focus:outline-none focus:ring-0
                  bg-[var(--color-white)]"
              />

              {/* 에러 메시지 */}
              {error && (
                <p className="mt-5 text-sm text-[var(--color-pink)]">{error}</p>
              )}

              <button
                type="submit"
                disabled={!!error || nickname.length < 2}
                className="pixelBtn pixelBtn--cyan mt-6 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                설정
              </button>

              <p className="mt-6 text-sm text-[var(--color-white)] leading-relaxed">
                사용할 닉네임을 입력해 주세요.
                <br />
                최소 2글자, 최대 8글자까지 입력할 수 있어요.
              </p>
            </form>
          </div>
        </section>
      </Window>
    </main>
  );
}
