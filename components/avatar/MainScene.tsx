import Phaser from 'phaser';
import Player, { type PartType } from './Player';

// -------------------- [Interfaces: JSON Schema] --------------------

// 1. 공통 팔레트 정의
interface PaletteParams {
    [key: string]: string[];
}

// 2. 색상 참조 타입 ({ "$ref": "..." } 또는 string[])
type ColorDef = string[] | { $ref: string };

// 3. 일반 파츠 설정 (body, head, legs 등)
interface StandardPartConfig {
    prefix?: string;
    path: string;
    colors: ColorDef;
    genders?: string[]; // 없으면 공용
}

// 4. 헤어 스타일 설정
interface HairStyle {
    id: string;
    genders?: string[];
    colors?: string[]; // 오버라이딩용 (rainbow_special 등)
}

// 5. 헤어 파츠 설정 (복잡한 구조)
interface HairPartConfig {
    config: {
        description?: string;
        path_template: string;
        default_colors: ColorDef;
    };
    styles: HairStyle[];
}

// 6. Assets 내부 값 (일반 파츠 OR 헤어 파츠)
type AssetConfig = StandardPartConfig | HairPartConfig;

// 7. 전체 JSON 루트
interface LpcRootData {
    definitions: {
        palettes: PaletteParams;
    };
    assets: {
        [key: string]: AssetConfig;
    };
}

// -------------------- [MainScene Class] --------------------

export default class MainScene extends Phaser.Scene {
    private player!: Player;
    
    // 줌 제어 상수
    private readonly ZOOM_MIN = 1;
    private readonly ZOOM_MAX = 5;
    private readonly ZOOM_FACTOR = 0.1;

    // 카메라 패닝(이동)을 위한 변수
    private isPanning = false;      // 현재 드래그 중인지 여부
    private panStartX = 0;          // 드래그 시작 시 마우스 X 위치
    private panStartY = 0;          // 드래그 시작 시 마우스 Y 위치
    private camScrollX = 0;         // 드래그 시작 시 카메라 Scroll X 위치
    private camScrollY = 0;         // 드래그 시작 시 카메라 Scroll Y 위치
    private spaceKey!: Phaser.Input.Keyboard.Key; // 스페이스바 키 객체

    constructor() {
        super({ key: 'MainScene' });
    }

    preload() {
        this.load.image('bg_image', '/assets/background/sample.png');
        this.load.json('lpc_config', '/assets/lpc_assets.json');

        this.load.on(Phaser.Loader.Events.FILE_COMPLETE + '-json-lpc_config', (key: string, type: string, data: LpcRootData) => {
            if (data && data.assets) {
                this.loadLpcAssets(data);
            }
        });
    }

    /**
     * JSON 데이터를 파싱하여 에셋을 로드합니다.
     */
     private loadLpcAssets(data: LpcRootData) {
        this.registry.set('lpc_data', data);
        const frameConfig = { frameWidth: 64, frameHeight: 64 };
        const palettes = data.definitions.palettes;

        Object.entries(data.assets).forEach(([partName, config]) => {
            
            if (partName === 'hair' && this.isHairConfig(config)) {
                // ... 기존 헤어 로직 유지 ...
                const template = config.config.path_template;
                const defaultColors = this.resolveColors(config.config.default_colors, palettes);

                config.styles.forEach(style => {
                    const styleColors = style.colors ? style.colors : defaultColors;
                    // 성별 배열이 비어있거나 없으면 공용('')으로 처리
                    const styleGenders = (style.genders && style.genders.length > 0) ? style.genders : [''];

                    styleGenders.forEach(gender => {
                        styleColors.forEach(color => {
                            const assetKey = this.getAssetKey(partName, style.id, gender, color);
                            let assetPath = template
                                .replace('{style}', style.id)
                                .replace('{color}', color);
                            if (assetPath.includes('{gender}')) assetPath = assetPath.replace('{gender}', gender);
                            
                            this.load.spritesheet(assetKey, assetPath, frameConfig);
                        });
                    });
                });

            } else if (!this.isHairConfig(config)) {
                const partConfig = config as StandardPartConfig;
                const colors = this.resolveColors(partConfig.colors, palettes);
                const prefix = partConfig.prefix || partName;

                // [중요 수정] genders가 빈 배열([])이거나 없으면 [''](공용)으로 설정하여 로드 누락 방지
                const genders = (partConfig.genders && partConfig.genders.length > 0) 
                    ? partConfig.genders 
                    : [''];

                genders.forEach(gender => {
                    colors.forEach(color => {
                        const assetKey = this.getAssetKey(prefix, null, gender, color);
                        let assetPath = partConfig.path.replace('{color}', color);
                        
                        // 경로에 {gender}가 있는데 gender가 빈 문자열이면 경로가 깨질 수 있으므로 체크
                        if (assetPath.includes('{gender}')) {
                            assetPath = assetPath.replace('{gender}', gender);
                        }

                        this.load.spritesheet(assetKey, assetPath, frameConfig);
                    });
                });
            }
        });
        
        this.load.start();
    }

    create() {
        this.createBackground();
        this.createPlayer();
        this.setupUI();
        this.setupCamera();

         if (this.input.keyboard) {
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        }
    }

    update() {
        if (this.player) {
            this.player.update();
              this.player.refresh();
        }
    }

    // -------------------- [Setup Methods] --------------------

    private createBackground() {
        const { width, height } = this.scale;
        const bg = this.add.image(width / 2, height / 2, 'bg_image');
        bg.setScrollFactor(1); 
        bg.setDepth(-100);
        bg.setDisplaySize(width, height);
    }

    private createPlayer() {
        this.player = new Player(this, 400, 300, '닉네임');
        this.player.setScale(0.5);

        // 로드된 데이터가 있으면 바로 랜덤 적용
        if (this.registry.get('lpc_data')) {
            this.randomizeCharacter();
        }
    }

    private setupUI() {
        const htmlBtn = document.getElementById('html-random-btn');
        if (htmlBtn) {
            const clickHandler = () => this.randomizeCharacter();
            htmlBtn.addEventListener('click', clickHandler);
            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
                htmlBtn.removeEventListener('click', clickHandler);
            });
        }
    }

    private setupCamera() {
        const camera = this.cameras.main;
        
        // 기존: 줌 설정
        camera.setBounds(0, 0, this.scale.width, this.scale.height);
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, _: unknown, __: number, deltaY: number) => {
            this.handleZoom(pointer, deltaY);
        });

        // ---------------------------------------------------------
        // [추가] 스페이스바 + 드래그로 카메라 이동 (Panning)
        // ---------------------------------------------------------

        // 1. 마우스 클릭 시 (드래그 시작)
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            // 스페이스바가 눌린 상태에서만 작동
            if (this.spaceKey && this.spaceKey.isDown) {
                this.isPanning = true;
                
                // 현재 마우스 위치와 카메라 위치 저장
                this.panStartX = pointer.x;
                this.panStartY = pointer.y;
                this.camScrollX = camera.scrollX;
                this.camScrollY = camera.scrollY;
                
                // (선택 사항) 드래그 중 커서 모양 변경
                this.input.setDefaultCursor('grabbing'); 
            }
        });

        // 2. 마우스 이동 시 (카메라 이동)
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isPanning && this.spaceKey.isDown) {
                // 이동한 거리 계산 (현재 마우스 위치 - 시작 위치)
                // 중요: 줌 확대 비율만큼 나누어야 마우스 속도와 화면 이동 속도가 일치함
                const diffX = (pointer.x - this.panStartX) / camera.zoom;
                const diffY = (pointer.y - this.panStartY) / camera.zoom;

                // 초기 카메라 위치에서 이동한 만큼 빼줌 (마우스를 왼쪽으로 끌면 화면은 오른쪽을 보여줘야 하므로)
                camera.scrollX = this.camScrollX - diffX;
                camera.scrollY = this.camScrollY - diffY;
            }
        });

        // 3. 마우스 뗐을 때 (드래그 종료)
        this.input.on('pointerup', () => {
            if (this.isPanning) {
                this.isPanning = false;
                this.input.setDefaultCursor('default'); // 커서 복구
            }
        });
        
        // (예외 처리) 드래그 중 스페이스바를 떼버렸을 때도 멈추게 하려면
        this.input.keyboard?.on('keyup-SPACE', () => {
            this.isPanning = false;
            this.input.setDefaultCursor('default');
        });
    }

    private handleZoom(pointer: Phaser.Input.Pointer, deltaY: number) {
        const camera = this.cameras.main;
        const oldZoom = camera.zoom;

        // 1. 새로운 줌 크기 계산 (최소값 1로 제한)
        const newZoom = Phaser.Math.Clamp(
            oldZoom + (deltaY > 0 ? -this.ZOOM_FACTOR : this.ZOOM_FACTOR), 
            this.ZOOM_MIN, 
            this.ZOOM_MAX
        );

        // 2. 줌 값이 변경되지 않았으면 리턴 (불필요한 연산 방지)
        if (oldZoom === newZoom) return;

        // 3. 줌 설정
        camera.setZoom(newZoom);

        // 4. [핵심 변경] 마우스 오프셋 계산을 제거하고 캐릭터 중심으로 이동
        // this.player가 존재하는지 확인 후 사용하세요.
        if (this.player) {
            camera.centerOn(this.player.x, this.player.y);
        }
    }

    // -------------------- [Logic: Randomization] --------------------

    public randomizeCharacter() {
        const lpcData = this.registry.get('lpc_data') as LpcRootData | undefined;
        if (!lpcData) return;

        const palettes = lpcData.definitions.palettes;
        const assets = lpcData.assets;

        // 1. 공통 속성 결정
        const skinPalette = this.resolveColors(palettes['skin_common'], palettes);
        const selectedSkin = Phaser.Math.RND.pick(skinPalette);
        
        let genderOptions = ['male', 'female'];
        if (assets['head'] && !this.isHairConfig(assets['head'])) {
            const headPart = assets['head'] as StandardPartConfig;
            if (headPart.genders) genderOptions = headPart.genders;
        }
        const selectedGender = Phaser.Math.RND.pick(genderOptions);

        // 2. 파츠별 장착
        Object.keys(assets).forEach(key => {
            const partName = key as PartType;
            const config = assets[key];

            // (A) Hair 처리
            if (partName === 'hair' && this.isHairConfig(config)) {
                const availableStyles = config.styles.filter(style => 
                    !style.genders || style.genders.length === 0 || style.genders.includes(selectedGender)
                );
                
                if (availableStyles.length > 0) {
                    const selectedStyle = Phaser.Math.RND.pick(availableStyles);
                    const styleColors = selectedStyle.colors 
                        ? selectedStyle.colors 
                        : this.resolveColors(config.config.default_colors, palettes);
                    
                    const selectedColor = Phaser.Math.RND.pick(styleColors);
                    
                    // 1차 시도 키 생성
                    let fullKey = this.getAssetKey(partName, selectedStyle.id, selectedGender, selectedColor);

                    // [헤어 Fallback] 특정 성별 키가 없으면 공용 키 시도
                    if (!this.textures.exists(fullKey)) {
                         fullKey = this.getAssetKey(partName, selectedStyle.id, '', selectedColor);
                    }

                    if (this.textures.exists(fullKey)) {
                        this.player.setPart(partName, fullKey);
                    }
                }
            } 
            // (B) 일반 파츠 처리 (눈, 몸통 등)
            else if (!this.isHairConfig(config)) {
                const partConfig = config as StandardPartConfig;
                let colorToUse: string;
                let genderToUse = '';

                // 색상 결정
                if (partName === 'body' || partName === 'head' || partName === 'nose') {
                    colorToUse = selectedSkin;
                } else {
                    const colors = this.resolveColors(partConfig.colors, palettes);
                    // 색상 팔레트가 비어있으면 스킵
                    if (colors.length === 0) return;
                    colorToUse = Phaser.Math.RND.pick(colors);
                }

                // 성별 결정 로직
                // 1. 내 성별이 지원 목록에 있으면 우선 사용
                if (partConfig.genders && partConfig.genders.includes(selectedGender)) {
                    genderToUse = selectedGender;
                } 
                // 2. 아니면 목록의 첫 번째(특정 성별 전용 아이템인 경우) 사용
                else if (partConfig.genders && partConfig.genders.length > 0) {
                    genderToUse = partConfig.genders[0];
                }
                // 3. genders가 없거나 비어있으면 '' (공용) 유지

                const prefix = partConfig.prefix || partName;

                // [핵심 수정] 텍스처 키 Fallback 로직 추가
                // 1차 시도: 결정된 성별(genderToUse)로 키 생성 (예: eyes_male_blue)
                let fullKey = this.getAssetKey(prefix, null, genderToUse, colorToUse);

                if (!this.textures.exists(fullKey)) {
                    // 2차 시도: 성별을 뗀 공용 키로 재시도 (예: eyes_blue)
                    // JSON엔 성별이 있다고 되어있지만 실제 파일은 공용 이름인 경우 등 방어
                    const fallbackKey = this.getAssetKey(prefix, null, '', colorToUse);
                    if (this.textures.exists(fallbackKey)) {
                        fullKey = fallbackKey;
                    } 
                    // 3차 시도(옵션): 내 성별이 아닌 다른 성별이라도 시도 (파일이 존재하는 아무거나)
                    else if (partConfig.genders && partConfig.genders.length > 0) {
                        const otherGender = partConfig.genders.find(g => g !== genderToUse);
                        if (otherGender) {
                            const otherKey = this.getAssetKey(prefix, null, otherGender, colorToUse);
                            if (this.textures.exists(otherKey)) fullKey = otherKey;
                        }
                    }
                }

                // 최종적으로 존재할 때만 적용
                if (this.textures.exists(fullKey)) {
                    this.player.setPart(partName, fullKey);
                } else {
                    // (선택) 텍스처를 못 찾았을 경우 로그 출력 (디버깅용)
                    console.warn(`Missing texture for part: ${partName}, tryKey: ${fullKey}`);
                }
            }
        });
        if (this.player) {
            this.player.refresh();
        }
    }

    // -------------------- [Helpers] --------------------

    /**
     * 타입 가드: Config가 Hair 타입인지 확인
     */
    private isHairConfig(config: AssetConfig): config is HairPartConfig {
        return (config as HairPartConfig).styles !== undefined;
    }

    /**
     * "$ref"를 감지하여 실제 색상 배열로 변환
     */
    private resolveColors(colorDef: ColorDef, palettes: PaletteParams): string[] {
        if (Array.isArray(colorDef)) {
            return colorDef;
        }
        if (colorDef && colorDef.$ref) {
            return palettes[colorDef.$ref] || [];
        }
        return [];
    }

    /**
     * 통합 Asset Key 생성기
     * 일반: prefix_gender_color (gender 없으면 prefix_color)
     * 헤어: prefix_style_gender_color
     */
    private getAssetKey(prefix: string, style: string | null, gender: string, color: string): string {
        const parts = [prefix];
        if (style) parts.push(style);
        if (gender) parts.push(gender);
        parts.push(color);
        return parts.join('_');
    }
}