import { AssetConfig, CharacterPartState, ColorDef, LpcSprite, PaletteParams, PartType, StyledPartConfig } from './LpcTypes';

export class LpcUtils {
    // 타입 가드
    static isStyledPart(config: AssetConfig): config is StyledPartConfig {
        return 'styles' in config;
    }

    // 색상 참조 해석 ($ref 처리)
    static resolveColors(colorDef: ColorDef, palettes: PaletteParams): string[] {
        if (Array.isArray(colorDef)) return colorDef;
        if (colorDef && colorDef.$ref) return palettes[colorDef.$ref] || [];
        return [];
    }

    // 에셋 키 생성기 (Loading과 Rendering 양쪽에서 사용)
    static getAssetKey(prefix: string, style: string | null, gender: string, color: string|undefined): string {
        const parts = [prefix];
        if (gender) parts.push(gender);
        if (style) parts.push(style);
        if (color) parts.push(color);
        return parts.join('_');
    }

    static getInitialState (data: LpcSprite, gender:string) {
        const parts: Partial<Record<string, CharacterPartState>> = {}; 
        const palettes = data.definitions.palettes;

        Object.keys(data.assets).forEach(key => {
            const partName = key;
            if (partName === 'head' || partName === 'nose') return; // Body 종속

            const config = data.assets[key];

            // 스타일 유무 체크
            if (this.isStyledPart(config)) {
                // 해당항목: hair, torso, legs, feet 
                // 성별에 맞는 스타일 필터링
                const validStyles = config.styles.filter(s => 
                    !s.genders || s.genders.length === 0 || s.genders.includes(gender)
                );

                if (validStyles.length > 0) {
                    const style = validStyles[0];
                    const colorDef = style.colors || config.config.default_colors;
                    const validColors = this.resolveColors(colorDef, palettes);
                    const color = validColors[0];
                    
                    parts[partName] = { styleId: style.id, color };
                }
            } else {
                // 해당항목: head, eyes, nose, body
                const colors = this.resolveColors(config.colors, palettes);
                if (colors.length > 0) {
                    const color = colors[0];
                    parts[partName] = { color };
                }
            }
        });

        if (parts['body']) {
            parts['head'] = { color: parts['body'].color };
            parts['nose'] = { color: parts['body'].color };
        }

        return { gender, parts };
    }

    // 랜덤 캐릭터 생성 로직
    static getRandomState(data: LpcSprite) {
        const gender = Math.random() > 0.5 ? 'male' : 'female';
        const parts: Partial<Record<string, CharacterPartState>> = {}; 
        const palettes = data.definitions.palettes;

        Object.keys(data.assets).forEach(key => {
            const partName = key;
            if (partName === 'head' || partName === 'nose') return; // Body 종속

            const config = data.assets[key];

            // 스타일 유무 체크
            if (this.isStyledPart(config)) {
                // 해당항목: hair, torso, legs, feet 
                // 성별에 맞는 스타일 필터링
                const validStyles = config.styles.filter(s => 
                   ( !s.genders || s.genders.length === 0 || s.genders.includes(gender) )&& s.tier !== "point"
                );

                if (validStyles.length > 0) {
                    const style = validStyles[Math.floor(Math.random() * validStyles.length)];
                    const colorDef = style.colors || config.config.default_colors;
                    const validColors = this.resolveColors(colorDef, palettes);
                    const color = validColors[Math.floor(Math.random() * validColors.length)];
                    
                    parts[partName] = { styleId: style.id, color };
                }
            } else {
                // 해당항목: head, eyes, nose, body
                const colors = this.resolveColors(config.colors, palettes);
                if (colors.length > 0) {
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    parts[partName] = { color };
                }
            }
        });

        // Body 색상 동기화
        if (parts['body']) {
            parts['head'] = { color: parts['body'].color };
            parts['nose'] = { color: parts['body'].color };
        }

        return { gender, parts };
    }
}