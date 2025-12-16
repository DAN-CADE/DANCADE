// types/character.ts
export interface UICharacterCustomization {
  gender: "male" | "female";
  skin: string;
  hair: {
    style: string;
    color: string;
  };
  eyes: string;
  torso: {
    style: string;
    color: string;
  };
  legs: {
    style: string;
    color: string;
  };
  feet: {
    style: string;
    color: string;
  };
}
