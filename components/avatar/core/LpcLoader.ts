import Phaser from 'phaser';
import { LpcRootData } from '../utils/LpcTypes';
import { LpcUtils } from '../utils/LpcUtils';

export class LpcLoader {
    static loadAssets(scene: Phaser.Scene, data: LpcRootData) {
        const frameConfig = { frameWidth: 64, frameHeight: 64 };
        const palettes = data.definitions.palettes;

        Object.entries(data.assets).forEach(([partName, config]) => {
            // 스타일 유무 체크
            if (LpcUtils.isStyledPart(config)) {
                // 해당항목: hair, torso, legs, feet 
                const template = config.config.path_template;
                const defaultColors = LpcUtils.resolveColors(config.config.default_colors, palettes);

                config.styles.forEach(style => {
                    const colors = style.colors ? style.colors : defaultColors;
                    const genders = (style.genders && style.genders.length > 0) ? style.genders : [''];
                    const pathSegment = style.path_segment || style.id;

                    genders.forEach(gender => {
                        colors.forEach(color => {
                            // 에셋키 생성
                            const assetKey = LpcUtils.getAssetKey(partName, style.id, gender, color);

                            // 에셋 경로 설정
                            let assetPath = template
                                .replace('{style}', pathSegment)
                                .replace('{color}', color);
                            
                            if (assetPath.includes('{gender}')) {
                                assetPath = assetPath.replace('{gender}', gender);
                            }
                            // 에셋 로드
                            scene.load.spritesheet(assetKey, assetPath, frameConfig);
                        });
                    });
                });
            } else { 
                // 해당항목: head, eyes, nose, body
                const colors = LpcUtils.resolveColors(config.colors, palettes);
                const genders = (config.genders && config.genders.length > 0) ? config.genders : [''];

                genders.forEach(gender => {
                    colors.forEach(color => {
                        // 에셋키 생성
                        const assetKey = LpcUtils.getAssetKey(partName, null, gender, color);

                        // 에셋 경로 설정
                        let assetPath = config.path.replace('{color}', color);
                        if (assetPath.includes('{gender}')) {
                            assetPath = assetPath.replace('{gender}', gender);
                        }

                        // 에셋 로드
                        scene.load.spritesheet(assetKey, assetPath, frameConfig);
                    });
                });
            }
        });
    }
}