"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/public/assets/logos/logo.svg";
import brickBreaker from "@/public/assets/screenshots/brick-breaker.png";
import pingPong from "@/public/assets/screenshots/ping-pong.png";
import Window from "@/components/common/Window";
import { useAuth } from "@/hooks/auth/useAuth";
import { useGuestAuth } from "@/hooks/useGuestAuth";
import { useLogin } from "@/hooks/auth/useLogin";
import { getCurrentUser, getUserData } from "@/lib/utils/auth";
import { STORAGE_KEY } from "@/constants/character";

export default function LoginIdPage() {
  const router = useRouter();
  const { login, isLoading: isAuthLoading } = useAuth();
  const { getOrCreateGuestUser } = useGuestAuth();
  const { readCharacter } = useLogin();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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

    // 빈 값 체크
    if (!formData.username || !formData.password) {
      setErrorMessage("아이디와 비밀번호를 입력해주세요.");
      return;
    }

    try {
      // Supabase 로그인
      await login({
        userid: formData.username,
        password: formData.password,
      });

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error("로그인 후 유저 정보를 불러올 수 없습니다.");
      }

      // 로그인 된 유저의 케릭터 정보 조회 후 로컬스토리지에 동기화
      const result = await readCharacter(currentUser.uuid!);
      const characterSkin = result?.characterSkin;

      if (characterSkin) {
        //기존 캐릭터 있음 → 선택창 스킵
        localStorage.setItem(STORAGE_KEY, JSON.stringify(characterSkin));
        router.push("/game");
      } else {
        //없음 → 캐릭터 생성
        router.push("/character-select");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "아이디 또는 비밀번호가 일치하지 않습니다.";
      setErrorMessage(errorMsg);
    }
  };

  const handleSignup = () => {
    router.push("/auth/register");
  };

  const handleGuestLogin = () => {
    // 게스트 사용자 생성 또는 불러오기
    const guestUser = getOrCreateGuestUser();
    console.log("게스트 로그인:", guestUser);

    // 캐릭터 선택창으로 이동
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
                  disabled={isAuthLoading}
                  className="w-full py-4 px-4 border border-[var(--color-navy)] 
                             placeholder:text-slate-gray text-black 
                             focus:outline-none focus:ring-0
                             disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                <div className="w-full relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="비밀번호를 입력하세요."
                    autoComplete="current-password"
                    disabled={isAuthLoading}
                    className="w-full py-4 px-4 pr-12 border border-[var(--color-navy)] 
                               placeholder:text-slate-gray text-black 
                               focus:outline-none focus:ring-0
                               disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isAuthLoading}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors disabled:cursor-not-allowed"
                    title={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              {/* 에러 메시지 */}
              {errorMessage && (
                <p className="text-left text-[var(--color-pink)] mt-3">
                  {errorMessage}
                </p>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-between items-center mt-6">
              {/* 왼쪽: 게스트 로그인 */}
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isAuthLoading}
                className="login-button pixelBtn pixelBtn--pink cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                게스트 로그인
              </button>

              {/* 오른쪽: 아이디 로그인, 회원가입 */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="login-button pixelBtn pixelBtn--cyan cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAuthLoading ? "로그인 중..." : "로그인"}
                </button>
                <button
                  type="button"
                  onClick={handleSignup}
                  disabled={isAuthLoading}
                  className="login-button pixelBtn pixelBtn--cyan cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
