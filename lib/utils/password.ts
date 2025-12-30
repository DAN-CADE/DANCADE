import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export const passwordUtils = {
  // 비밀번호 해싱
  hash: async (password: string): Promise<string> => {
    return await bcrypt.hash(password, SALT_ROUNDS);
  },

  // 비밀번호 검증
  verify: async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash);
  },
};
