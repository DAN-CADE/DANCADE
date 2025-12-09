// types/map.ts
export interface ArcadeMachine {
  id: number;
  type: string;
  x: number;
  y: number;
  properties: {
    gameId: string;
    gameName: string;
  };
}

export interface MapData {
  layers: Array<{
    name: string;
    objects?: ArcadeMachine[];
  }>;
}
