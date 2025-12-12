"use client";

import Image from "next/image";
import signupLogo from "@/public/assets/logos/signup-logo.svg";
import Window from "@/components/common/Window";

export default function RegisterPage() {
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
          >
            <fieldset className="form-fields space-y-6">
              <legend className="sr-only">회원가입 정보 입력</legend>

              {/* 이름 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-center">
                <label
                  htmlFor="name"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[125px] text-lg"
                >
                  이름
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="이름을 입력하세요."
                  autoComplete="name"
                  className="w-full py-4 px-4 border border-[var(--color-navy)]
                             placeholder:text-slate-gray text-black 
                             focus:outline-none focus:ring-0"
                />
                <p className="text-right text-[var(--color-pink)] mt-3 hidden">
                  이름을 입력해주세요.
                </p>
              </div>

              {/* 아이디 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-center">
                <label
                  htmlFor="userId"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[125px] text-lg"
                >
                  아이디
                </label>
                <input
                  id="userId"
                  type="text"
                  placeholder="아이디를 입력하세요."
                  autoComplete="username"
                  className="w-full py-4 px-4 border border-[var(--color-navy)]
                             placeholder:text-slate-gray text-black 
                             focus:outline-none focus:ring-0"
                />
                <p className="text-right text-[var(--color-pink)] mt-3 hidden">
                  이미 사용 중인 아이디입니다.
                </p>
              </div>

              {/* 비밀번호 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-center">
                <label
                  htmlFor="password"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[125px] text-lg"
                >
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요."
                  autoComplete="new-password"
                  className="w-full py-4 px-4 border border-[var(--color-navy)]
                             placeholder:text-slate-gray text-black 
                             focus:outline-none focus:ring-0"
                />
                <p className="text-right text-[var(--color-pink)] mt-3 hidden">
                  영문, 숫자, 특수문자를 포함하여 8-16자
                </p>
              </div>

              {/* 이메일 */}
              <div className="form-field flex flex-col lg:flex-row lg:items-center">
                <label
                  htmlFor="email"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[125px] text-lg"
                >
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="이메일을 입력하세요."
                  autoComplete="email"
                  className="w-full py-4 px-4 border border-[var(--color-navy)]
                             placeholder:text-slate-gray text-black 
                             focus:outline-none focus:ring-0"
                />
              </div>
            </fieldset>

            {/* 버튼 */}
            <div className="button-group text-right mt-15">
              <button
                type="reset"
                className="login-button pixelBtn pixelBtn--gray mr-3 cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                className="login-button pixelBtn pixelBtn--pink cursor-pointer"
              >
                회원가입
              </button>
            </div>
          </form>
        </section>
      </Window>
    </main>
  );
}
