import { z } from "zod";

// 회원가입 스키마
export const registerSchema = z
  .object({
    userid: z
      .string()
      .min(4, "아이디는 최소 4글자 이상이어야 합니다.")
      .max(20, "아이디는 최대 20글자까지 가능합니다.")
      .regex(/^[a-zA-Z0-9_-]+$/, "영문, 숫자, _, -만 사용 가능합니다."),

    nickname: z
      .string()
      .min(2, "닉네임은 최소 2글자 이상이어야 합니다.")
      .max(20, "닉네임은 최대 20글자까지 가능합니다.")
      .regex(/^[가-힣a-zA-Z0-9\s]+$/, "한글, 영문, 숫자만 사용 가능합니다."),

    password: z
      .string()
      .min(8, "비밀번호는 최소 8글자 이상이어야 합니다.")
      .max(16, "비밀번호는 최대 16글자까지 가능합니다.")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).+$/,
        "영문, 숫자, 특수문자를 포함하여 8-16자"
      ),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["confirmPassword"],
  });

// 로그인 스키마
export const loginSchema = z.object({
  userid: z.string().min(1, "아이디를 입력하세요."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
