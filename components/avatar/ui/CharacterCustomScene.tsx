import Phaser from 'phaser';
import LpcCharacter from '../core/LpcCharacter';
import { LpcLoader } from '../core/LpcLoader'; 
import { MakerUI } from '../core/MakerUI'; // 경로에 맞게 수정하세요
import { CharacterState, LpcRootData, PartType, StandardPartConfig } from '../utils/LpcTypes';
import { LpcUtils } from '../utils/LpcUtils';
export default class CharacterCustomScene extends Phaser.Scene {
    private character!: LpcCharacter;
    private makerUI!: MakerUI;

    constructor() {
        super('CharacterCustomScene');
    }

    preload() {
        // [1] 리소스 로딩
        this.load.json('lpc_config', '/assets/lpc_assets.json');

        // JSON 로드 완료 후 에셋 파싱
        this.load.on(Phaser.Loader.Events.FILE_COMPLETE + '-json-lpc_config', (key: string, type: string, data: any) => {
            if (data && data.assets) {
                // LpcLoader를 통해 이미지를 로드합니다.
                this.registry.set('lpc_data', data);
                LpcLoader.loadAssets(this, data);
            }
        });
    }

    create() {
        this.character = new LpcCharacter(this, 50, 100, '');
        this.character.setDefaultPart(this, "female");

        // 데이터 로드 완료 확인 후 UI 및 초기화
        const data = this.registry.get('lpc_data') as LpcRootData;
        if (data) {
            // 초기 랜덤 상태 생성
            const initialState = LpcUtils.getRandomState(data);
            
            // UI 생성 및 상태 변경 콜백 연결
            this.makerUI = new MakerUI(data, initialState, (newState) => {
                this.updatePlayerVisuals(newState);
            });
            
            // 초기 비주얼 적용
            this.updatePlayerVisuals(initialState);
        }
    }

    update() {
        if (this.character) {
            this.character.update();
        }
    }

     /**
     * [CORE] UI 변경사항을 플레이어에게 반영
     */
    private updatePlayerVisuals(state: CharacterState) {
        const data = this.registry.get('lpc_data') as LpcRootData;
        const gender = state.gender;

        Object.keys(state.parts).forEach(key => {
            const partName = key as PartType;
            const partState = state.parts[partName];
            if (!partState) return;

            const config = data.assets[partName];
            let assetKey = '';

            if (LpcUtils.isStyledPart(config)) {
                if (partState.styleId) {
                    assetKey = LpcUtils.getAssetKey(partName, partState.styleId, gender, partState.color);
                    // Fallback: 성별 없는 옷
                    if (!this.textures.exists(assetKey)) {
                        assetKey = LpcUtils.getAssetKey(partName, partState.styleId, '', partState.color);
                    }
                }
            } else {
                const standardConfig = config as StandardPartConfig;
                const prefix = standardConfig.prefix || partName;
                assetKey = LpcUtils.getAssetKey(prefix, null, gender, partState.color);
                
                if (!this.textures.exists(assetKey)) {
                    assetKey = LpcUtils.getAssetKey(prefix, null, '', partState.color);
                }
            }

            if (this.textures.exists(assetKey)) {
                this.character.setPart(partName, assetKey);
            }
        });

        this.character.refresh();
    }
}