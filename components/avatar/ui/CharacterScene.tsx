import Phaser from 'phaser';
import LpcCharacter from '../core/LpcCharacter';
import { LpcLoader } from '../core/LpcLoader'; 
import { LpcRootData } from '../utils/LpcTypes';

export default class CharacterScene extends Phaser.Scene {
    private character!: LpcCharacter;

    constructor() {
        super('CharacterScene');
    }

    preload() {
        // [1] 리소스 로딩
        this.load.json('lpc_config', '/assets/lpc_assets.json');

        // JSON 로드 완료 후 에셋 파싱
        this.load.on(Phaser.Loader.Events.FILE_COMPLETE + '-json-lpc_config', (key: string, type: string, data: LpcRootData) => {
            if (data && data.assets) {
                // LpcLoader를 통해 이미지를 로드합니다.
                LpcLoader.loadAssets(this, data);
            }
        });
    }

    create() {
        this.character = new LpcCharacter(this, 50, 100, '');
        this.character.setDefaultPart(this, "female");
    }

    update() {
        if (this.character) {
            this.character.update();
        }
    }
}