import * as Phaser from 'phaser';
import { PartType } from '../utils/LpcTypes';

const DEFAULT_OUTFIT: Partial<Record<PartType, string>> = {
    body: 'body_light',
    head: 'head_male_light',
    eyes: 'eyes_blue',
    nose: 'nose_light',
    hair: 'hair_male_idol_black',
    torso: 'torso_longSleeve_white', 
    legs: 'legs_cuffed_black',    
    feet: 'feet_shoes_black'    
};

const LPC_ANIMS = {
    frameRate: 10,
    walk: {
        up: { start: 105, end: 112 },
        left: { start: 118, end: 125 },
        down: { start: 131, end: 138 },
        right: { start: 144, end: 151 }
    },
    idle: {
        up: 104,
        left: 117,
        down: 130,
        right: 143
    }
};

export default class LpcCharacter extends Phaser.GameObjects.Container {
    private nameTag: Phaser.GameObjects.Text;
    private keys!: { [key: string]: Phaser.Input.Keyboard.Key };
    private speed: number = 160;
    
    // 파츠별 스프라이트 저장소
    private parts: Partial<Record<PartType, Phaser.GameObjects.Sprite>> = {};
    
    // 렌더링 순서 (뒤 -> 앞)
    private readonly layerOrder: PartType[] = [
        'body', 'head', 'eyes', 'nose', 'legs', 'feet', 'torso', 'hair'
    ];
    
    // 상태 변수
    private currentDirection: 'up' | 'down' | 'left' | 'right' = 'down';
    private isMoving: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, name: string) {
        super(scene, x, y);

        // 1. Scene 및 Physics 등록
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 2. 물리 바디 설정 (Hitbox)
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(32, 32);     
        body.setOffset(-16, 16);  
        body.setCollideWorldBounds(true);

        // 3. 파츠 스프라이트 초기화
        this.layerOrder.forEach((part) => {
            // Container 자식으로 추가하기 위해 new Sprite 사용 (scene.add.sprite 아님)
            const sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, '');
            sprite.setOrigin(0.5, 0.5); 
            sprite.setVisible(false); 

            this.parts[part] = sprite;
            this.add(sprite); // 컨테이너에 추가
        });

        // 4. 이름표 추가
        this.nameTag = scene.add.text(0, -40, name, {
            fontSize: '14px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        this.add(this.nameTag);

        // 5. 키보드 입력 설정
        if (scene.input.keyboard) {
            this.keys = scene.input.keyboard.addKeys({
                up: Phaser.Input.Keyboard.KeyCodes.W,
                left: Phaser.Input.Keyboard.KeyCodes.A,
                down: Phaser.Input.Keyboard.KeyCodes.S,
                right: Phaser.Input.Keyboard.KeyCodes.D
            }) as { [key: string]: Phaser.Input.Keyboard.Key };
        }
    }

    /**
     * 캐릭터의 특정 부위 스킨을 변경 및 애니메이션 등록
     */
    public setPart(part: PartType, textureKey: string) {
        const sprite = this.parts[part];
        if (!sprite) return;

        if (textureKey && textureKey !== '') {
            sprite.setTexture(textureKey);
            sprite.setVisible(true);
            
            // 새 텍스처에 대한 애니메이션 생성
            this.ensureAnimations(textureKey);
            
            // 현재 상태에 맞게 프레임 즉시 설정 (깜빡임 방지)
            if (!this.isMoving) {
                sprite.setFrame(LPC_ANIMS.idle[this.currentDirection]);
            }
        } else {
            sprite.setVisible(false);
        }
    }
    
    /**
     * 강제로 애니메이션 상태를 갱신 (옷 갈아입은 후 등)
     */
    public refresh() {
        this.playLayeredAnimations(true);
    }

    /**
     * 프레임 업데이트 루프
     */
    update() {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        let velocityX = 0;
        let velocityY = 0;

        if (this.keys.left.isDown) velocityX = -1;
        else if (this.keys.right.isDown) velocityX = 1;

        if (this.keys.up.isDown) velocityY = -1;
        else if (this.keys.down.isDown) velocityY = 1;

        // 1. 이동 처리
        if (velocityX !== 0 || velocityY !== 0) {
            body.velocity.x = velocityX;
            body.velocity.y = velocityY;
            body.velocity.normalize().scale(this.speed);
        } else {
            body.setVelocity(0, 0);
        }

        // 2. 방향 및 상태 감지
        const oldDirection = this.currentDirection;
        const oldMoving = this.isMoving;

        if (velocityX < 0) this.currentDirection = 'left';
        else if (velocityX > 0) this.currentDirection = 'right';
        else if (velocityY < 0) this.currentDirection = 'up';
        else if (velocityY > 0) this.currentDirection = 'down';

        this.isMoving = (velocityX !== 0 || velocityY !== 0);

        // 3. 상태 변화 시 애니메이션 동기화
        if (oldDirection !== this.currentDirection || oldMoving !== this.isMoving) {
            this.playLayeredAnimations();
        }
    }

    /**
     * 특정 텍스처에 대한 4방향 걷기/대기 애니메이션 생성
     */
    private ensureAnimations(textureKey: string) {
        if (!textureKey) return;
        const anims = this.scene.anims;

        // 이미 생성된 애니메이션이면 건너뜀
        if (anims.exists(`${textureKey}-down`)) return;

        const config = { frameRate: LPC_ANIMS.frameRate, repeat: -1 };

        // Walk Animations
        anims.create({ key: `${textureKey}-up`, frames: anims.generateFrameNumbers(textureKey, LPC_ANIMS.walk.up), ...config });
        anims.create({ key: `${textureKey}-left`, frames: anims.generateFrameNumbers(textureKey, LPC_ANIMS.walk.left), ...config });
        anims.create({ key: `${textureKey}-down`, frames: anims.generateFrameNumbers(textureKey, LPC_ANIMS.walk.down), ...config });
        anims.create({ key: `${textureKey}-right`, frames: anims.generateFrameNumbers(textureKey, LPC_ANIMS.walk.right), ...config });
        
        // Idle Animations (단일 프레임)
        anims.create({ key: `${textureKey}-idle-up`, frames: [{ key: textureKey, frame: LPC_ANIMS.idle.up }], frameRate: 0 });
        anims.create({ key: `${textureKey}-idle-left`, frames: [{ key: textureKey, frame: LPC_ANIMS.idle.left }], frameRate: 0 });
        anims.create({ key: `${textureKey}-idle-down`, frames: [{ key: textureKey, frame: LPC_ANIMS.idle.down }], frameRate: 0 });
        anims.create({ key: `${textureKey}-idle-right`, frames: [{ key: textureKey, frame: LPC_ANIMS.idle.right }], frameRate: 0 });
    }

    /**
     * 모든 활성화된 레이어의 애니메이션을 현재 상태에 맞춰 재생
     * @param force true일 경우 현재 재생 중이어도 강제로 다시 시작 (스킨 변경 시 사용)
     */
    private playLayeredAnimations(force: boolean = false) {
        const action = this.isMoving ? '' : '-idle'; 
        const suffix = `${action}-${this.currentDirection}`; // 예: '-down' or '-idle-down'

        this.layerOrder.forEach((part) => {
            const sprite = this.parts[part];
            
            // 텍스처가 로드되어 있고 유효한 경우만 처리
            if (sprite && sprite.visible && sprite.texture.key && sprite.texture.key !== '__MISSING') {
                const textureKey = sprite.texture.key;
                const animKey = `${textureKey}${suffix}`;

                if (this.scene.anims.exists(animKey)) {
                    // 현재 같은 애니메이션이 재생 중이면 건너뜀 (force가 아닐 때)
                    if (force || sprite.anims.currentAnim?.key !== animKey) {
                        sprite.play(animKey, true);
                    }
                }
            }
        });
    }  

    public setDefaultPart(scene: Phaser.Scene, gender: string) {
        const hair = gender === "male" ? "hair_male_idol_black" : "hair_female_long_straight_black"
        const defaultPart = {
            ...DEFAULT_OUTFIT,
            head: `head_${gender}_light`,
            hair: hair
        };

         // 생성 시점에 정의된 DEFAULT_OUTFIT을 순회하며 입힙니다.
        (Object.keys(defaultPart) as PartType[]).forEach((part) => {
            const textureKey = defaultPart[part];
            
            console.log(part, textureKey);
            // 텍스처 키가 있고, 실제로 Scene에 로드되어 있는지 확인 (안전장치)
            if (textureKey && scene.textures.exists(textureKey)) {
                this.setPart(part, textureKey);
            }
        });
        
        // 초기 모습 갱신 (Idle 애니메이션 시작)
        this.refresh();
    }

    // 이름 변경용
    public setDisplayName(newName: string) {
        if (this.nameTag) {
            this.nameTag.setText(newName);
        }
    }

    // UI 미리보기용 강제 방향 설정 (키보드 입력 무시)
    public setPreviewDirection(direction: 'up' | 'down' | 'left' | 'right') {
        this.currentDirection = direction;
        this.isMoving = false; // 걷지 않고 서있는 상태
        this.playLayeredAnimations(true);
    }
}