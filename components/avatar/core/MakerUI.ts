import { LpcRootData, CharacterState, PartType, StandardPartConfig } from '../utils/LpcTypes';
import { LpcUtils } from '../utils/LpcUtils';

export class MakerUI {
    private root: HTMLDivElement | null = null;
    private data: LpcRootData;
    private currentState: CharacterState;
    private onStateChange: (newState: CharacterState) => void;

    constructor(data: LpcRootData, initialState: CharacterState, onUpdate: (s: CharacterState) => void) {
        this.data = data;
        this.currentState = initialState;
        this.onStateChange = onUpdate;
        this.render();
    }

    // UI 전체 다시 그리기
    public render() {
        this.destroy(); // 기존 UI 제거

        this.root = document.createElement('div');
        this.root.id = 'maker-ui';
        this.root.style.cssText = `position:absolute; top:10px; right:10px; width:280px; background:rgba(0,0,0,0.85); color:white; padding:15px; border-radius:8px; font-family:sans-serif; max-height:90vh; overflow-y:auto; box-shadow: 0 4px 6px rgba(0,0,0,0.3);`;
        document.body.appendChild(this.root);

        // 성별
        this.createSelectGroup(this.root, 'GENDER', ['male', 'female'], this.currentState.gender, (val) => {
            this.currentState.gender = val;
            this.render(); // 성별 바뀌면 UI 갱신 (스타일 목록 변경됨)
            this.triggerUpdate();
        });

        // 파츠들
        const partOrder = ['body', 'eyes', 'hair', 'torso', 'legs', 'feet'];
        partOrder.forEach(partName => this.renderPartControl(partName));

        // 랜덤 버튼
        const randomBtn = document.createElement('button');
        randomBtn.innerText = "🎲 RANDOMIZE";
        randomBtn.style.cssText = "width:100%; padding:12px; background:#4CAF50; color:white; border:none; border-radius:4px; margin-top:15px; cursor:pointer; font-weight:bold; font-size:14px;";
        randomBtn.onclick = () => {
            const randomState = LpcUtils.getRandomState(this.data);
            this.currentState = randomState; // 상태 덮어쓰기
            this.render();
            this.triggerUpdate();
        };
        this.root.appendChild(randomBtn);
    }

    private renderPartControl(partName: string) {
        const config = this.data.assets[partName];
        if (!config || !this.root) return;

        const container = document.createElement('div');
        container.style.cssText = "margin-bottom: 12px; border-bottom: 1px solid #444; padding-bottom: 8px;";
        container.innerHTML = `<div style="font-size:12px; color:#aaa; margin-bottom:4px; text-transform:uppercase;">${partName}</div>`;
        this.root.appendChild(container);

        if (LpcUtils.isStyledPart(config)) {
            // 스타일형 파츠
            const validStyles = config.styles.filter(s => 
                !s.genders || s.genders.length === 0 || s.genders.includes(this.currentState.gender)
            );

            // 현재 스타일 유효성 검사
            let curStyleId = this.currentState.parts[partName as PartType]?.styleId;
            if (!curStyleId || !validStyles.find(s => s.id === curStyleId)) {
                curStyleId = validStyles[0]?.id;
            }

            // 스타일 Select
            const styleSelect = document.createElement('select');
            styleSelect.style.cssText = "width:100%; padding:5px; background:#333; color:white; border:1px solid #555; border-radius:4px; margin-bottom:5px;";
            validStyles.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.innerText = (s.tier === 'point') ? `${s.name || s.id} [${s.price}P]` : (s.name || s.id);
                if (s.tier === 'point') opt.style.color = '#ffd700';
                if (s.id === curStyleId) opt.selected = true;
                styleSelect.appendChild(opt);
            });
            container.appendChild(styleSelect);

            // 색상 Select
            const colorSelect = document.createElement('select');
            colorSelect.style.cssText = "width:100%; padding:5px; background:#333; color:white; border:1px solid #555; border-radius:4px;";
            container.appendChild(colorSelect);

            const updateColorOptions = (styleId: string) => {
                const styleObj = validStyles.find(s => s.id === styleId);
                if (!styleObj) return;

                const colorDef = styleObj.colors || config.config.default_colors;
                const availableColors = LpcUtils.resolveColors(colorDef, this.data.definitions.palettes);
                
                // 현재 색상 유지 노력
                let curColor = this.currentState.parts[partName as PartType]?.color;
                if (!curColor || !availableColors.includes(curColor)) curColor = availableColors[0];

                colorSelect.innerHTML = '';
                availableColors.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c;
                    opt.innerText = c;
                    opt.selected = c === curColor;
                    colorSelect.appendChild(opt);
                });

                this.updateState(partName as PartType, styleId, curColor!);
            };

            styleSelect.onchange = (e) => updateColorOptions((e.target as HTMLSelectElement).value);
            colorSelect.onchange = (e) => this.updateState(partName as PartType, styleSelect.value, (e.target as HTMLSelectElement).value);
            
            // 초기 실행
            updateColorOptions(curStyleId!);

        } else {
            // 일반 파츠
            const standardConfig = config as StandardPartConfig;
            const colors = LpcUtils.resolveColors(standardConfig.colors, this.data.definitions.palettes);
            let curColor = this.currentState.parts[partName as PartType]?.color;
            if (!curColor || !colors.includes(curColor)) curColor = colors[0];

            this.updateState(partName as PartType, undefined, curColor);
            
            this.createSelectBox(container, colors.map(c => ({ value: c, text: c })), curColor, (val) => {
                this.updateState(partName as PartType, undefined, val);
            });
        }
    }

    private updateState(partName: PartType, styleId: string | undefined, color: string) {
        if (!this.currentState.parts[partName]) this.currentState.parts[partName] = { color: 'default' };
        
        const part = this.currentState.parts[partName]!;
        if (styleId) part.styleId = styleId;
        part.color = color;

        // Body 색상 변경 시 Head, Nose 동기화 로직
        if (partName === 'body') {
            this.currentState.parts['head'] = { color };
            this.currentState.parts['nose'] = { color };
        }

        this.triggerUpdate();
    }

    private triggerUpdate() {
        this.onStateChange(this.currentState);
    }

    private createSelectGroup(parent: HTMLElement, label: string, options: string[], selected: string, onChange: (val: string) => void) {
        const div = document.createElement('div');
        div.style.marginBottom = '15px';
        div.innerHTML = `<div style="font-weight:bold; margin-bottom:5px;">${label}</div>`;
        this.createSelectBox(div, options.map(o => ({ value: o, text: o })), selected, onChange);
        parent.appendChild(div);
    }

    private createSelectBox(parent: HTMLElement, options: { value: string, text: string }[], selected: string, onChange: (val: string) => void) {
        const select = document.createElement('select');
        select.style.cssText = "width:100%; padding:5px; background:#333; color:white; border:1px solid #555; border-radius:4px; margin-bottom:5px;";
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.innerText = opt.text;
            option.selected = (opt.value === selected);
            select.appendChild(option);
        });
        select.onchange = (e) => onChange((e.target as HTMLSelectElement).value);
        parent.appendChild(select);
    }

    public destroy() {
        if (this.root) {
            this.root.remove();
            this.root = null;
        }
    }
}