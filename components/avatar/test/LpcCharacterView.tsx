import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import Player from '../core/LpcCharacter';
import { LpcRootData, PartType } from '../utils/LpcTypes';
import { LpcLoader } from '../core/LpcLoader';

interface LpcCharacterViewProps {
    width?: number;
    height?: number;
    name: string;
    parts: Partial<Record<PartType, string>>;
    direction?: 'down' | 'up' | 'left' | 'right';
}

const LpcCharacterView: React.FC<LpcCharacterViewProps> = ({
    width = 200,
    height = 200,
    name,
    parts,
    direction = 'down'
}) => {
    const gameContainerRef = useRef<HTMLDivElement>(null);
    const gameRef = useRef<Phaser.Game | null>(null);
    const playerRef = useRef<Player | null>(null);

    // Phaser 게임 인스턴스 초기화
    useEffect(() => {
        if (!gameContainerRef.current) return;

        class PreviewScene extends Phaser.Scene {
            constructor() {
                super({ key: 'PreviewScene' });
            }

            preload() {
                this.load.json('lpc_config', '/assets/lpc_assets.json');
                // JSON 로드 완료 시 에셋 파싱 시작
                this.load.on(Phaser.Loader.Events.FILE_COMPLETE + '-json-lpc_config', (key: string, type: string, data: LpcRootData) => {
                    if (data && data.assets) {
                        LpcLoader.loadAssets(this, data);
                    }
                });
            }

            create() {
                const player = new Player(this, width / 2, height / 2, name);
                
                // 외부(React)에서 제어할 수 있도록 ref에 할당
                playerRef.current = player;

                // 초기 파츠 설정
                (Object.keys(parts) as PartType[]).forEach((part) => {
                    if (parts[part]) {
                        player.setPart(part, parts[part]!);
                    }
                });
                
                player.refresh();
            }

            update() {
                if (playerRef.current) {
                    playerRef.current.update();
                }
            }
        }

        // 2. 게임 설정 (scene은 비워둡니다)
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: gameContainerRef.current,
            width: width,
            height: height,
            backgroundColor: '#00000000', // 투명 배경
            transparent: true,
            physics: {
                default: 'arcade',
                arcade: { debug: false, gravity: { x:0, y: 0 } }
            },
            scene: [] // 여기서 정의하지 않음 (생성자 오류 방지)
        };

        // 3. 게임 인스턴스 생성
        const game = new Phaser.Game(config);
        gameRef.current = game;

        // [핵심 해결책]
        // 게임 생성 후, 명확하게 클래스(Constructor)를 add 합니다.
        // 세 번째 인자 true는 autoStart(자동 시작) 옵션입니다.
        game.scene.add('PreviewScene', PreviewScene, true);

        // Cleanup
        return () => {
            game.destroy(true);
            gameRef.current = null;
            playerRef.current = null;
        };
    }, []); // 의존성 배열 비움 (Mount 시 1회만 실행)

    // Props 변경 감지 및 플레이어 업데이트
    useEffect(() => {
        const player = playerRef.current;
        
        // player가 생성되었고, 씬이 활성 상태인지 확인
        if (player && player.scene) {
            
            // 이름 변경 (Player 클래스에 setDisplayName 메서드가 있다고 가정)
            // 만약 메서드가 없다면 Player.ts에 추가 필요
            if ('setDisplayName' in player && typeof (player as any).setDisplayName === 'function') {
                (player as any).setDisplayName(name);
            }

            // 파츠 변경
            (Object.keys(parts) as PartType[]).forEach((part) => {
                const textureKey = parts[part];
                // 텍스처가 있는지 확인 (비동기 로딩 이슈 방지)
                if (textureKey && player.scene.textures.exists(textureKey)) {
                    player.setPart(part, textureKey);
                } else {
                    player.setPart(part, ''); // 텍스처 없으면 벗기기
                }
            });
            
            player.refresh();
        }
    }, [parts, name]);

    return <div ref={gameContainerRef} style={{ width, height }} />;
};

export default LpcCharacterView;