"use client";

import Image from "next/image";
import logo from "@/public/assets/logos/logo.svg";
import brickBreaker from "@/public/assets/screenshots/brick-breaker.png";
import pingPong from "@/public/assets/screenshots/ping-pong.png";
import Window from "@/components/common/Window";

export default function LoginIdPage() {
  const gameList = [
    { src: brickBreaker, alt: "벽돌깨기 게임" },
    { src: pingPong, alt: "핑퐁 게임" },
    { src: brickBreaker, alt: "벽돌깨기 게임" },
    { src: pingPong, alt: "핑퐁 게임" },
  ];

  return (
    <main className="login-id-page">
      <Window title="LOGIN">
        {/* 로그인 영역 */}
        <section
          className="
          login-form-section 
          flex flex-wrap
          lg:flex-row 
          justify-center items-center
          gap-7
          w-full
          mb-9 px-4 lg:px-0
          "
        >
          <header className="login-header mb-6 lg:mb-0 ">
            <Image
              src={logo}
              alt="DAN-CADE 로고"
              className="w-[320px] lg:w-[220px] h-auto"
            />
          </header>

          <form className="login-form w-full max-w-[550px] px-5 py-6 bg-[var(--color-white)] border-box">
            <div>
              {/* 아이디 */}
              <div className="form-field mb-6 flex flex-col lg:flex-row lg:items-center">
                <label
                  htmlFor="username"
                  className="text-[var(--color-black)] mb-2 lg:mb-0 lg:w-[125px] text-lg"
                >
                  아이디
                </label>
                <input
                  id="username"
                  type="text"
                  placeholder="아이디를 입력하세요."
                  autoComplete="username"
                  className="w-full py-4 px-4 border border-[var(--color-navy)] 
                             placeholder:text-slate-gray text-black 
                             focus:outline-none focus:ring-0"
                />
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
                  autoComplete="current-password"
                  className="w-full py-4 px-4 border border-[var(--color-navy)] 
                             placeholder:text-slate-gray text-black 
                             focus:outline-none focus:ring-0"
                />
              </div>

              <p className="text-right text-[var(--color-pink)] mt-3 hidden">
                일치하지 않습니다.
              </p>
            </div>

            {/* 버튼 */}
            <div className="text-right mt-6">
              <button
                type="submit"
                className="login-button pixelBtn pixelBtn--cyan mr-3 cursor-pointer"
              >
                로그인
              </button>
              <button
                type="button"
                className="login-button pixelBtn pixelBtn--cyan cursor-pointer"
              >
                회원가입
              </button>
            </div>
          </form>
        </section>

        {/* 게임 프리뷰 */}
        <section
          className="game-gallery px-4 lg:px-0"
          aria-label="게임 미리보기"
        >
          <ul
            className="
              game-list
              relative
              grid grid-cols-2 gap-10
              justify-items-center
              lg:flex lg:gap-7 lg:justify-center 
            "
          >
            {gameList.map((game, idx) => (
              <li
                key={idx}
                className="
                  game-item relative
                  z-2
                  w-[42vw]
                  sm:w-[33vw]
                  lg:w-[30vw]
                  max-w-[220px]
                  aspect-[220/300]
                  border border-[var(--color-cyan)] border-10
                  shadow-[0px_4px_40px_rgba(0,255,255,0.25)]
                "
              >
                <Image
                  src={game.src}
                  alt={game.alt}
                  fill
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </section>
      </Window>
    </main>
  );
}
