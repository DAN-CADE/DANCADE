"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/public/assets/logos/logo.svg";
import brickBreaker from "@/public/assets/screenshots/brick-breaker.png";
import pingPong from "@/public/assets/screenshots/ping-pong.png";
import Window from "@/components/common/Window";

export default function LoginIdPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const gameList = [
    { src: brickBreaker, alt: "벽돌깨기 게임" },
    { src: pingPong, alt: "핑퐁 게임" },
    { src: brickBreaker, alt: "벽돌깨기 게임" },
    { src: pingPong, alt: "핑퐁 게임" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrorMessage(""); // 입력 시 에러 메시지 초기화
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 빈 값 체크만
    if (!formData.username || !formData.password) {
      setErrorMessage("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      // ******************** Supabase 로그인
      console.log("로그인 시도:", formData);
    } catch (error) {
      setErrorMessage("아이디 또는 비밀번호가 일치하지 않습니다.");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    router.push("/auth/register");
    // console.log("회원가입 페이지로 이동");
  };

  const handleGuestLogin = () => {
    // 캐릭터 선택창으로 이동 (게임시작 시 로컬스토리지 생성)
    router.push("/character-select");
  };

  return (
    <main className="login-id-page font-neo">
      <Window title="LOGIN">
        <section className="login-form-section flex flex-wrap lg:flex-row justify-center items-center gap-7 w-full mb-9 px-4 lg:px-0">
          <header className="login-header mb-6 lg:mb-0">
            <Image
              src={logo}
              alt="DAN-CADE 로고"
              className="w-[320px] lg:w-[220px] h-auto"
            />
          </header>

          <form
            className="login-form w-full max-w-[550px] px-5 py-6 bg-[var(--color-white)] border-box"
            onSubmit={handleSubmit}
          >
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
                  value={formData.username}
                  onChange={handleChange}
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
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="비밀번호를 입력하세요."
                  autoComplete="current-password"
                  className="w-full py-4 px-4 border border-[var(--color-navy)] 
                             placeholder:text-slate-gray text-black 
                             focus:outline-none focus:ring-0"
                />
              </div>

              {/* 에러 메시지 */}
              <p
                className={`text-right text-[var(--color-pink)] mt-3 ${
                  errorMessage ? "" : "hidden"
                }`}
              >
                {errorMessage}
              </p>
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-between items-center mt-6">
              {/* 왼쪽: 게스트 로그인 */}
              <button
                type="button"
                onClick={handleGuestLogin}
                className="login-button pixelBtn pixelBtn--pink cursor-pointer"
              >
                게스트 로그인
              </button>

              {/* 오른쪽: 아이디 로그인, 회원가입 */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="login-button pixelBtn pixelBtn--cyan cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "로그인 중..." : "로그인"}
                </button>
                <button
                  type="button"
                  onClick={handleSignup}
                  className="login-button pixelBtn pixelBtn--cyan cursor-pointer"
                >
                  회원 가입
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* 게임 프리뷰 */}
        <section
          className="game-gallery px-4 lg:px-0"
          aria-label="게임 미리보기"
        >
          <ul className="game-list relative grid grid-cols-2 gap-10 justify-items-center lg:flex lg:gap-7 lg:justify-center">
            {gameList.map((game, idx) => (
              <li
                key={idx}
                className="game-item relative z-2 w-[42vw] sm:w-[33vw] lg:w-[30vw] max-w-[220px] aspect-[220/300] border border-[var(--color-cyan)] border-10 shadow-[0px_4px_40px_rgba(0,255,255,0.25)]"
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
