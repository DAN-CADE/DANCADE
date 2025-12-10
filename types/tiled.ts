export interface TiledProperty {
  name: string;
  value: string | number | boolean;
  type?: string;
}

export interface TiledObjectLayer {
  id: number;
  name: string;
  type: "objectgroup";
  visible: boolean;
  objects: Phaser.Types.Tilemaps.TiledObject[];
}
