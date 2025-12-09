import Phaser from 'phaser';

// 캐릭터가 가질 수 있는 파츠 정의
export type PartType = 'head'| 'eyes' | 'nose' | 'body' | 'legs' | 'torso' | 'hair' | 'feet';

export default class Player extends Phaser.GameObjects.Container {
    private nameTag: Phaser.GameObjects.Text;
    private keys!: { [key: string]: Phaser.Input.Keyboard.Key };
    private speed: number = 160;
    
    // 각 레이어별 스프라이트를 저장할 객체
    private parts: Partial<Record<PartType, Phaser.GameObjects.Sprite>> = {};
    
    // 렌더링 순서 (뒤 -> 앞)
    private readonly layerOrder: PartType[] = [
        'body', 
        'head', 
        'eyes', 
        'nose',
        'legs', 
        'feet', 
        'torso', 
        'hair'
    ];
    
    // 현재 상태 저장
    private currentDirection: string = 'down';
    private isMoving: boolean = false;

    constructor(scene: Phaser.Scene, x: number, y: number, name: string) {
        super(scene, x, y);

        // 1. 씬과 물리 엔진에 컨테이너 추가
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // 2. 물리 바디 설정
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setSize(32, 32);     
        body.setOffset(-16, 16);  
        body.setCollideWorldBounds(true);

        // 3. 레이어 초기화
        this.layerOrder.forEach((part) => {
            // [수정] scene.add.sprite 대신 new Sprite 사용
            // 이렇게 해야 씬에 직접 등록되지 않고 컨테이너의 자식으로만 관리됩니다.
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
     * 캐릭터의 특정 부위 스킨을 변경합니다.
     */
    public setPart(part: PartType, textureKey: string) {
        const sprite = this.parts[part];
        if (sprite) {
            // 텍스처 설정
            sprite.setTexture(textureKey);

            if (textureKey && textureKey !== '') {
                sprite.setVisible(true);
                // 애니메이션 생성
                this.ensureAnimations(textureKey);
                
                 if (this.currentDirection === 'down') sprite.setFrame(130);
            } else {
                sprite.setVisible(false);
            }
        }
    }
    
   public refresh() {
        // true 옵션을 줘서 강제로 처음부터 재생
        this.playLayeredAnimations(true);
    }

    /**
     * 특정 텍스처에 대한 4방향 애니메이션을 동적으로 생성합니다.
     */
    private ensureAnimations(textureKey: string) {
        if (!textureKey) return;
        const anims = this.scene.anims;

        // 이미 해당 텍스처의 애니메이션이 존재하면 패스 (키 이름: textureKey-down 등)
        if (anims.exists(`${textureKey}-down`)) return;

        const config = { frameRate: 10, repeat: -1 };

        // Walk cycle
        anims.create({ key: `${textureKey}-up`, frames: anims.generateFrameNumbers(textureKey, { start: 105, end: 112 }), ...config });
        anims.create({ key: `${textureKey}-left`, frames: anims.generateFrameNumbers(textureKey, { start: 118, end: 125 }), ...config });
        anims.create({ key: `${textureKey}-down`, frames: anims.generateFrameNumbers(textureKey, { start: 131, end: 138 }), ...config });
        anims.create({ key: `${textureKey}-right`, frames: anims.generateFrameNumbers(textureKey, { start: 144, end: 151 }), ...config });
        
        // Idle (정지)
        anims.create({ key: `${textureKey}-idle-up`, frames: [{ key: textureKey, frame: 104 }], frameRate: 0 });
        anims.create({ key: `${textureKey}-idle-left`, frames: [{ key: textureKey, frame: 117 }], frameRate: 0 });
        anims.create({ key: `${textureKey}-idle-down`, frames: [{ key: textureKey, frame: 130 }], frameRate: 0 });
        anims.create({ key: `${textureKey}-idle-right`, frames: [{ key: textureKey, frame: 143 }], frameRate: 0 });
    }

    update() {
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (!body) return;

        let velocityX = 0;
        let velocityY = 0;

        if (this.keys.left.isDown) velocityX = -1;
        else if (this.keys.right.isDown) velocityX = 1;

        if (this.keys.up.isDown) velocityY = -1;
        else if (this.keys.down.isDown) velocityY = 1;

        // 이동 처리
        if (velocityX !== 0 || velocityY !== 0) {
            body.velocity.x = velocityX;
            body.velocity.y = velocityY;
            body.velocity.normalize().scale(this.speed);
        } else {
            body.setVelocity(0, 0);
        }

        // 상태 및 방향 판별
        const oldDirection = this.currentDirection;
        const oldMoving = this.isMoving;

        if (velocityX < 0) this.currentDirection = 'left';
        else if (velocityX > 0) this.currentDirection = 'right';
        else if (velocityY < 0) this.currentDirection = 'up';
        else if (velocityY > 0) this.currentDirection = 'down';

        this.isMoving = (velocityX !== 0 || velocityY !== 0);

        // 상태가 변했을 때만 애니메이션 업데이트 (혹은 refresh 호출 시)
        if (oldDirection !== this.currentDirection || oldMoving !== this.isMoving) {
            this.playLayeredAnimations();
        }
    }

    /**
     * [수정됨] 모든 레이어의 애니메이션을 동기화하여 재생
     * @param force true일 경우 현재 애니메이션을 강제로 처음부터 재생
     */
    private playLayeredAnimations(force: boolean = false) {
        const action = this.isMoving ? '' : '-idle'; 
        const suffix = `${action}-${this.currentDirection}`; // 예: '-down' or '-idle-down'

        this.layerOrder.forEach((part) => {
            const sprite = this.parts[part];
            
            if (sprite && sprite.texture.key && sprite.texture.key !== '__MISSING') {
                const textureKey = sprite.texture.key;
                
                // 생성된 애니메이션 키 조합 (예: body_male_light-down)
                const animKey = `${textureKey}${suffix}`;

                // 애니메이션이 존재할 때만 재생 시도
                if (this.scene.anims.exists(animKey)) {
                    // 현재 재생 중인 것과 다를 때 혹은 강제 재생일 때만 실행
                    if (force || sprite.anims.currentAnim?.key !== animKey) {
                        sprite.play(animKey, true); // ignoreIfPlaying = true
                    }
                }
            }
        });
    }
}