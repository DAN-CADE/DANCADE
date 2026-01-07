// utils/guestNickname.ts
import { uniqueNamesGenerator, Config } from "unique-names-generator";

const adjectives = [
  "앙증맞은",
  "동글동글",
  "뽀송뽀송",
  "똘망똘망",
  "발랄한",
  "말랑한",
  "심심한",
  "졸린",
  "배고픈",
  "용맹한",
  "귀여운",
  "상냥한",
  "반가운",
  "행복한",
  "즐거운",
  "포근한",
  "노래하는",
  "춤추는",
  "새침한",
  "달콤한",
  "놀란",
  "빛나는",
  "따뜻한",
  "시원한",
  "멋진",
  "싱그러운",
  "활기찬",
  "유쾌한",
  "센스있는",
  "사랑스러운",
];

const animals = [
  "시츄",
  "고양이",
  "토끼",
  "햄스터",
  "기니피그",
  "판다",
  "곰돌이",
  "병아리",
  "펭귄",
  "오리",
  "호랑이",
  "사자",
  "여우",
  "늑대",
  "코알라",
  "캥거루",
  "코끼리",
  "기린",
  "원숭이",
  "다람쥐",
  "사슴",
  "고슴도치",
  "고래",
  "수달",
  "치와와",
  "미어캣",
  "알파카",
  "라쿤",
  "나무늘보",
  "쿼카",
];

const config: Config = {
  dictionaries: [adjectives, animals],
  separator: " ",
  length: 2,
};

export const generateGuestNickname = (): string => {
  return uniqueNamesGenerator(config);
};
