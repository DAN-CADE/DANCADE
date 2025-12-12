// src/scenes/MainScene.ts
import Phaser from 'phaser';
import Player from '../core/LpcCharacter';
import { LpcRootData, CharacterState, StandardPartConfig, PartType } from '../utils/LpcTypes';
import { LpcLoader } from '../core/LpcLoader';
import { MakerUI } from '../core/MakerUI';
import { LpcUtils } from '../utils/LpcUtils';

export default class MainScene extends Phaser.Scene {
    private player!: Player;
    private interactKey!: Phaser.Input.Keyboard.Key;
    private makerUI!: MakerUI;

    // 카메라 변수
    private readonly ZOOM_MIN = 1;
    private readonly ZOOM_MAX = 10;
    private readonly ZOOM_FACTOR = 0.5;

    // 상호작용 관련
    private arcadeMachines = [
        { id: "game1", x: 200, y: 200, scene: "StartScene", name: "Brick Breaker" },
    ];
    private nearbyGame: { id: string; scene: string; name: string } | null = null;
    private interactPrompt!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image("CommonTile", "/tilesets/CommonTile.png");
        this.load.tilemapTiledJSON("map", "/maps/DanMap5.tmj");
        this.load.json('lpc_config', '/assets/lpc_assets.json');

        // JSON 로드 완료 시 LpcLoader 위임
        this.load.on(Phaser.Loader.Events.FILE_COMPLETE + '-json-lpc_config', (key: string, type: string, data: LpcRootData) => {
            if (data && data.assets) {
                this.registry.set('lpc_data', data);
                LpcLoader.loadAssets(this, data);
                this.load.start(); // 추가된 에셋 로딩 시작
            }
        });
    }

    create() {
        this.createBackground();
        this.createPlayer();
        this.setupCamera();
        this.setGame();

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
        this.checkNearbyArcade();
        this.handleInteraction();
        if (this.player) {
            this.player.update();
            this.player.refresh();
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
                this.player.setPart(partName, assetKey);
            }
        });

        this.player.refresh();
    }

    // -------------------- [Setup Methods] --------------------

    private createBackground() {
        const map = this.make.tilemap({ key: "map" });
        const tileset = map.addTilesetImage("CommonTile", "CommonTile");
        if (tileset) {
            map.layers.forEach((layer) => {
                map.createLayer(layer.name, tileset, 0, 0);
            });
        }
    }

    private createPlayer() {
        this.player = new Player(this, 400, 300, 'Player');
        this.player.setScale(0.5);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    private setupCamera() {
        const camera = this.cameras.main;
        camera.setBounds(0, 0, this.scale.width, this.scale.height);
        this.input.on('wheel', (_: any, __: any, ___: any, deltaY: number) => {
            const newZoom = Phaser.Math.Clamp(camera.zoom + (deltaY > 0 ? -this.ZOOM_FACTOR : this.ZOOM_FACTOR), this.ZOOM_MIN, this.ZOOM_MAX);
            camera.setZoom(newZoom);
        });
    }

    private setGame() {
        this.arcadeMachines.forEach((arcade) => {
            this.add.rectangle(arcade.x, arcade.y, 64, 64, 0x0000ff);
        });
        this.interactKey = this.input.keyboard!.addKey("E");
        this.interactPrompt = this.add.text(0, 0, "", { fontSize: "16px", backgroundColor: "#000" }).setVisible(false);
    }

    private checkNearbyArcade() {
        if (!this.player) return;
        
        const interactionRadius = 80;
        let foundNearby = false;

        for (const machine of this.arcadeMachines) {
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, machine.x, machine.y);
            if (distance < interactionRadius) {
                this.nearbyGame = machine;
                this.interactPrompt.setText(`Press E to play ${machine.name}`).setVisible(true);
                foundNearby = true;
                break;
            }
        }

        if (!foundNearby) {
            this.nearbyGame = null;
            this.interactPrompt.setVisible(false);
        }
    }
    
    private handleInteraction() {
        if (Phaser.Input.Keyboard.JustDown(this.interactKey) && this.nearbyGame) {
            console.log(`Launching: ${this.nearbyGame.name}`);
            this.scene.start(this.nearbyGame.scene);
        }
    }
}