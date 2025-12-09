// types/character.ts
export interface CharacterCustomization {
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
