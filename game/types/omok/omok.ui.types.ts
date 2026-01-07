import { OmokSideType } from "./omok.types";

export interface OmokBoardState {
  stoneNumbers: Phaser.GameObjects.Text[];
  forbiddenMarkers: Phaser.GameObjects.Text[];
  moveCount: number;
}

export interface OmokUIState {
  modeSelectionContainer?: Phaser.GameObjects.Container;
  forbiddenText?: Phaser.GameObjects.Text;
}

export interface PlayerProfileUI {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  nameTxt: Phaser.GameObjects.Text;
  statusTxt: Phaser.GameObjects.Text;
  stoneIcon: Phaser.GameObjects.Arc;
  side: OmokSideType;
}

export interface PlayerInfo {
  name: string;
  stoneColor: number;
  side: OmokSideType;
}

export interface PlayerInfoUI {
  me?: PlayerProfileUI;
  opponent?: PlayerProfileUI;
}

export interface StoneInfo {
  stoneColor: number;
  textColor: string;
}
