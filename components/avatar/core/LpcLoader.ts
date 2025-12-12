import Phaser from 'phaser';
import { LpcRootData, StandardPartConfig } from '../utils/LpcTypes';
import { LpcUtils } from '../utils/LpcUtils';

export class LpcLoader {
    static loadAssets(scene: Phaser.Scene, data: LpcRootData) {
        const frameConfig = { frameWidth: 64, frameHeight: 64 };
        const palettes = data.definitions.palettes;

        Object.entries(data.assets).forEach(([partName, config]) => {
            if (LpcUtils.isStyledPart(config)) {
                const template = config.config.path_template;
                const defaultColors = LpcUtils.resolveColors(config.config.default_colors, palettes);

                config.styles.forEach(style => {
                    const styleColors = style.colors ? style.colors : defaultColors;
                    const styleGenders = (style.genders && style.genders.length > 0) ? style.genders : [''];
                    const pathStyleStr = style.path_segment || style.id;

                    styleGenders.forEach(gender => {
                        styleColors.forEach(color => {
                            const assetKey = LpcUtils.getAssetKey(partName, style.id, gender, color);
                            let assetPath = template
                                .replace('{style}', pathStyleStr)
                                .replace('{color}', color);
                            
                            if (assetPath.includes('{gender}')) {
                                assetPath = assetPath.replace('{gender}', gender);
                            }
                            // console.log(assetKey)
                            scene.load.spritesheet(assetKey, assetPath, frameConfig);
                        });
                    });
                });
            } else {
                const partConfig = config as StandardPartConfig;
                const colors = LpcUtils.resolveColors(partConfig.colors, palettes);
                const prefix = partConfig.prefix || partName;
                const genders = (partConfig.genders && partConfig.genders.length > 0) ? partConfig.genders : [''];

                genders.forEach(gender => {
                    colors.forEach(color => {
                        const assetKey = LpcUtils.getAssetKey(prefix, null, gender, color);
                        let assetPath = partConfig.path.replace('{color}', color);
                        if (assetPath.includes('{gender}')) {
                            assetPath = assetPath.replace('{gender}', gender);
                        }
                        // console.log(assetKey)
                        scene.load.spritesheet(assetKey, assetPath, frameConfig);
                    });
                });
            }
        });
    }
}