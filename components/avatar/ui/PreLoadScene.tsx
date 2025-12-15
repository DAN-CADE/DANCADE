"use client"
import * as Phaser from 'phaser';
import { LpcLoader } from '../core/LpcLoader';
import { LpcRootData } from '../utils/LpcTypes';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {
        console.log("⏳ Start Loading Assets...");
        
        // 1. 세션 스토리지 확인
        const storedData = sessionStorage.getItem("lpcRootData");

        if (storedData) {
            console.log("📂 Loading from SessionStorage...");
            const lpcData: LpcRootData = JSON.parse(storedData);
            LpcLoader.loadAssets(this, lpcData);
        } else {
            console.log("☁️ Loading JSON file...");
            this.load.json('lpc_config', '/assets/lpc_assets.json');

            this.load.on(Phaser.Loader.Events.FILE_COMPLETE + '-json-lpc_config', (key: string, type: string, data: any) => {
                if (data && data.assets) {
                    sessionStorage.setItem("lpcRootData", JSON.stringify(data));
                    LpcLoader.loadAssets(this, data);
                }
            });
        }

        // 로딩 UI (선택사항: 프로그레스 바 등)
        this.load.on('complete', () => {
            console.log("✅ All Assets Loaded!");
            // 로딩이 다 끝나면 커스텀 씬으로 데이터 없이 이동 (혹은 기본값 전달)
            this.scene.start('CharacterCustomScene'); 
        });
    }
}