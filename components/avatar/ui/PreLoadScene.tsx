"use client"
import * as Phaser from 'phaser';
import { LpcLoader } from '../core/LpcLoader';
import { LpcRootData } from '../utils/LpcTypes';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }

    preload() {        
        // 1. 세션 스토리지 확인
        const storedData = sessionStorage.getItem("lpcRootData");

        if (storedData) {
            const lpcData: LpcRootData = JSON.parse(storedData);
            LpcLoader.loadAssets(this, lpcData);
        } else {
            this.load.json('lpc_config', '/assets/lpc_assets.json');

            this.load.on(Phaser.Loader.Events.FILE_COMPLETE + '-json-lpc_config', (key: string, type: string, data: LpcRootData) => {
                if (data && data.assets) {
                    sessionStorage.setItem("lpcRootData", JSON.stringify(data));
                    LpcLoader.loadAssets(this, data);
                }
            });
        }

        // 로딩 UI (선택사항: 프로그레스 바 등)

        this.load.on("complete", () => {
            // 로딩이 다 끝나면 커스텀 씬으로 데이터 없이 이동 (혹은 기본값 전달)
            if (this.scene.manager.keys["CharacterCustomScene"]) {
                this.scene.start("CharacterCustomScene");
            } else if (this.scene.manager.keys["CharacterCustomScene"]) {
                this.scene.start("CharacterCustomScene");
            } else if (this.scene.manager.keys["MainScene"]) {
                this.scene.start("MainScene");
            } else {
                console.error("No next scene found after PreloadScene!");
            }
        });
    }
}