export type PartType = 'body' | 'head' | 'eyes' | 'hair' | 'torso' | 'legs' | 'feet' | 'nose';

export interface PaletteParams {
    [key: string]: string[];
}

export type ColorDef = string[] | { $ref: string };

export interface StandardPartConfig {
    tier?: 'basic' | 'point';
    prefix?: string;
    path: string;
    colors: ColorDef;
    genders?: string[];
}

export interface PartStyle {
    id: string;
    name?: string;
    tier?: 'basic' | 'point';
    price?: number;
    path_segment?: string;
    genders?: string[];
    colors?: string[];
}

export interface StyledPartConfig {
    config: {
        description?: string;
        path_template: string;
        default_colors: ColorDef;
    };
    styles: PartStyle[];
}

export type AssetConfig = StandardPartConfig | StyledPartConfig;

export interface LpcRootData {
    definitions: {
        palettes: PaletteParams;
    };
    assets: {
        [key: string]: AssetConfig;
    };
}

export interface CharacterPartState {
    styleId?: string;
    color?: string;
}

export interface CharacterState {
    gender: string;
    parts: {
        [key in PartType]?: CharacterPartState;
    };
}

export interface CharacterCustomization {
    gender: string;
    skin: string;
    head: {
        hair: {style: string, color:string};
        eyes: {color: string};
        nose: {style: string};
    };
    body: {
        torso: {style: string, color: string}
        legs: {style: string, color: string}
        feet: {style: string, color: string}
    }
}