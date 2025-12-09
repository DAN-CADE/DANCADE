import Phaser from 'phaser';
import Player, { type PartType } from './Player';

// -------------------- [Interfaces] --------------------

// 로드할 에셋 정보 정의
interface PartAssetConfig {
    type: PartType; // body, head, hair, torso, legs, feet...
    key: string;    // Phaser 캐시 키 (고유값)
    path: string;   // 파일 경로
}

// -------------------- [MainScene Class] --------------------

export default class MainScene extends Phaser.Scene {
    private player!: Player;

    // 카메라 관련 변수
    private readonly ZOOM_MIN = 1;
    private readonly ZOOM_MAX = 10;
    private readonly ZOOM_FACTOR = 0.5;

    // [설정] 여기에 로드하고 싶은 파츠들의 경로를 직접 입력하세요.
    // 기존 JSON 파싱 로직 대신, 이 배열에 있는 파일들을 직접 로드합니다.
    private readonly partsToLoad: PartAssetConfig[] = [
        // 1. 기본 신체 (Body & Head)
        { type: 'body', key: 'body_male_light', path: '/assets/spritesheets/body/teen/light.png' },
        { type: 'head', key: 'head_male_light', path: '/assets/spritesheets/head/heads/human/male/light.png' },
        
        // 2. 얼굴 요소 (Eyes, Nose - 필요 시 추가)
        { type: 'nose', key: 'nose_light', path: '/assets/spritesheets/nose/button/adult/light.png' },
        { type: 'eyes', key: 'eyes_blue', path: '/assets/spritesheets/eyes/human/adult/blue.png' },
        

        // 3. 스타일 파츠 (Hair, Clothes)
        { type: 'hair', key: 'hair_messy_raven', path: '/assets/spritesheets/hair/idol/male/red.png' },
        { type: 'torso', key: 'torso_tshirt_white', path: '/assets/spritesheets/torso/clothes/longsleeve/teen/white.png' },
        { type: 'legs', key: 'legs_pants_teal', path: '/assets/spritesheets/legs/cuffed/teen/black.png' },
        { type: 'feet', key: 'feet_shoes_black', path: '/assets/spritesheets/feet/shoes2/thin/black.png' },
        
    ];

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        // 1. 맵 & 타일 로드
        this.load.image("CommonTile", "/tilesets/CommonTile.png");
        this.load.tilemapTiledJSON("map", "/maps/DanMap5.tmj");

        // 2. [CORE] 배열에 정의된 파츠 스프라이트 시트 직접 로드
        const frameConfig = { frameWidth: 64, frameHeight: 64 };

        this.partsToLoad.forEach(asset => {
            this.load.spritesheet(asset.key, asset.path, frameConfig);
        });
    }

    create() {
        this.createBackground();
        this.createPlayer();
        this.setupCamera();

        // 3. 로드된 파츠를 플레이어에게 적용
        this.applyInitialParts();
    }

    update() {
        if (this.player) {
            this.player.update();
        }
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
        // 플레이어 생성 (초기엔 빈 상태거나 Player 클래스 기본값)
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

    // -------------------- [Logic: Apply Parts] --------------------

    /**
     * preload에서 로드한 에셋 키(key)를 사용하여 플레이어의 파츠를 설정합니다.
     */
    private applyInitialParts() {
        // 예시: partsToLoad에 있는 것 중 '초기 장비'로 원하는 키를 지정
        
        // 1. 기본 몸체 설정
        this.changePart('body', 'body_male_light');
        this.changePart('head', 'head_male_light');
        this.changePart('nose', 'nose_light');

        // 2. 의상 설정
        this.changePart('hair', 'hair_messy_raven');
        this.changePart('torso', 'torso_tshirt_white'); // or 'torso_chainmail_gold'
        this.changePart('legs', 'legs_pants_teal');
        this.changePart('feet', 'feet_shoes_black');
    }

    /**
     * 외부(UI 등)에서 호출하여 파츠를 변경하는 메서드
     * @param partName 파츠 타입 (body, hair, torso...)
     * @param assetKey 로드된 에셋의 키 (preload에서 지정한 key)
     */
    public changePart(partName: PartType, assetKey: string) {
        // 텍스처가 실제로 로드되었는지 확인
        if (this.textures.exists(assetKey)) {
            this.player.setPart(partName, assetKey);
            this.player.refresh(); // Player 클래스 내부의 합성/애니메이션 갱신 메서드
            console.log(`[MainScene] Part changed: ${partName} -> ${assetKey}`);
        } else {
            console.warn(`[MainScene] Asset key not found: ${assetKey}. Make sure to add it to partsToLoad.`);
        }
    }
    
    /**
     * (선택 사항) 게임 실행 도중 런타임에 새로운 경로의 파일을 로드해야 할 경우
     * 예: 상점에서 미리 로드되지 않은 아이템을 입어볼 때
     */
    public loadAndSetPartRuntime(partName: PartType, uniqueKey: string, path: string) {
        if (this.textures.exists(uniqueKey)) {
            this.changePart(partName, uniqueKey);
            return;
        }

        const frameConfig = { frameWidth: 64, frameHeight: 64 };
        this.load.spritesheet(uniqueKey, path, frameConfig);
        
        // 런타임 로드 시작
        this.load.once(Phaser.Loader.Events.COMPLETE, () => {
            this.changePart(partName, uniqueKey);
        });
        this.load.start();
    }
}