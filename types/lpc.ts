export interface LPCAssetConfig {
  genders?: string[];
  colors?: string[] | { $ref: string };
  styles?: LPCStyle[];
  config?: {
    default_colors?: string[] | { $ref: string };
  };
}

export interface LPCStyle {
  id: string;
  path_segment?: string;
  genders?: string[];
  colors?: string[];
}

export interface LPCPalettes {
  [key: string]: string[];
}

export interface LPCData {
  definitions: {
    palettes: LPCPalettes;
  };
  assets: {
    [key: string]: LPCAssetConfig;
  };
}
