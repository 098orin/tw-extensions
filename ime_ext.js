(function (Scratch) {
    "use strict";

    class IMEExtension {
        constructor() {
            this.inputElement = null;
            this.enterPressed = false;
            this.composing = false;

            this.baseStageWidth = 480;
            this.baseStageHeight = 360;

            this.defaultWidth = 150;
            this.defaultHeight = 30;
            this.relativeWidth = this.defaultWidth;
            this.relativeHeight = this.defaultHeight;

            this.stageRect = null;

            this.createHiddenInput();
            this.setupEventHandlers();
        }

        createHiddenInput() {
            this.inputElement = document.createElement('input');
            this.inputElement.type = 'text';
            this.inputElement.style.position = 'absolute';
            this.inputElement.style.zIndex = '9999';
            this.inputElement.style.fontSize = '16px';
            this.inputElement.style.display = 'none';
            this.inputElement.style.background = 'white';
            this.inputElement.style.color = 'black';
            document.body.appendChild(this.inputElement);

            this.inputElement.addEventListener('compositionstart', () => { this.composing = true; });
            this.inputElement.addEventListener('compositionend', () => { this.composing = false; });
            this.inputElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !this.composing) this.enterPressed = true;
            });
        }

        setupEventHandlers() {
            // 入力外クリックで終了
            document.addEventListener('click', (e) => {
                if (!this.inputElement.contains(e.target) && this.inputElement.style.display === 'block') {
                    this.stopInput();
                }
            });

            // ステージサイズ変更時に入力欄も自動調整
            const stageCanvas = document.querySelector("canvas");
            if (stageCanvas) {
                this.stageResizeObserver = new ResizeObserver(() => {
                    if (this.inputElement.style.display === 'block') {
                        this.updateStageRect();
                        this.updateInputSize();
                    }
                });
                this.stageResizeObserver.observe(stageCanvas);
            }

            // プロジェクト終了時自動停止
            window.addEventListener("beforeunload", () => this.stopInput());
            if (Scratch.vm) {
                Scratch.vm.runtime.on("PROJECT_STOP_ALL", () => this.stopInput());
            }
        }

        updateStageRect() {
            const stage = document.querySelector("canvas");
            if (stage) this.stageRect = stage.getBoundingClientRect();
        }

        updateInputSize() {
            if (!this.stageRect) this.updateStageRect();
            if (!this.stageRect) return;

            const scaleX = this.stageRect.width / this.baseStageWidth;
            const scaleY = this.stageRect.height / this.baseStageHeight;

            this.inputElement.style.width = `${this.relativeWidth * scaleX}px`;
            this.inputElement.style.height = `${this.relativeHeight * scaleY}px`;
        }

        getCurrentInput() { return this.inputElement.value; }
        isAcceptingInput() { return document.activeElement === this.inputElement; }

        startInputAt(args) {
            const x = Number(args.X), y = Number(args.Y);
            this.updateStageRect();
            if (!this.stageRect) return;

            const scaleX = this.stageRect.width / this.baseStageWidth;
            const scaleY = this.stageRect.height / this.baseStageHeight;

            this.inputElement.style.left = `${this.stageRect.left + x * scaleX}px`;
            this.inputElement.style.top = `${this.stageRect.top + y * scaleY}px`;

            this.inputElement.value = args.DEFAULT_TEXT || '';
            this.inputElement.placeholder = args.PLACEHOLDER || '';
            this.updateInputSize();

            this.inputElement.style.display = 'block';
            this.inputElement.focus();
            this.enterPressed = false;
        }

        stopInput() {
            this.inputElement.blur();
            this.inputElement.style.display = 'none';
        }

        setInputSize(args) {
            const value = Number(args.VALUE);
            if (args.SIZE_TYPE === '幅' && value > 0) this.relativeWidth = value;
            if (args.SIZE_TYPE === '高さ' && value > 0) this.relativeHeight = value;
            this.updateInputSize();
        }

        getInputSize(args) {
            if (args.SIZE_TYPE === '幅') return this.relativeWidth;
            if (args.SIZE_TYPE === '高さ') return this.relativeHeight;
            return 0;
        }

        setInputColor(args) {
            const color = args.COLOR;
            if (args.COLOR_TYPE === '背景色') this.inputElement.style.background = color;
            if (args.COLOR_TYPE === '文字色') this.inputElement.style.color = color;
        }

        getInputColor(args) {
            if (args.COLOR_TYPE === '背景色') return this.inputElement.style.background;
            if (args.COLOR_TYPE === '文字色') return this.inputElement.style.color;
            return '';
        }

        enterKeyPressed() {
            const pressed = this.enterPressed;
            this.enterPressed = false;
            return pressed;
        }

        getInfo() {
            return {
                id: 'imeExt',
                name: 'IME拡張',
                blocks: [
                    { opcode: 'getCurrentInput', blockType: Scratch.BlockType.REPORTER, text: '現在入力されている文字' },
                    { opcode: 'isAcceptingInput', blockType: Scratch.BlockType.BOOLEAN, text: '現在入力を受け付けているか' },
                    {
                        opcode: 'startInputAt', blockType: Scratch.BlockType.COMMAND,
                        text: '入力の受付を [X] [Y] で開始する 既定文字: [DEFAULT_TEXT] 背景文字: [PLACEHOLDER]',
                        arguments: {
                            X: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 },
                            Y: { type: Scratch.ArgumentType.NUMBER, defaultValue: 100 },
                            DEFAULT_TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: '' },
                            PLACEHOLDER: { type: Scratch.ArgumentType.STRING, defaultValue: '' }
                        }
                    },
                    { opcode: 'stopInput', blockType: Scratch.BlockType.COMMAND, text: '入力をやめる' },
                    {
                        opcode: 'setInputSize', blockType: Scratch.BlockType.COMMAND,
                        text: '入力欄の [SIZE_TYPE] を [VALUE] にする',
                        arguments: {
                            SIZE_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'sizeMenu' },
                            VALUE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 150 }
                        }
                    },
                    {
                        opcode: 'getInputSize', blockType: Scratch.BlockType.REPORTER,
                        text: '入力欄の [SIZE_TYPE] の現在の値',
                        arguments: { SIZE_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'sizeMenu' } }
                    },
                    {
                        opcode: 'setInputColor', blockType: Scratch.BlockType.COMMAND,
                        text: '入力欄の [COLOR_TYPE] を [COLOR] にする',
                        arguments: {
                            COLOR_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'colorMenu' },
                            COLOR: { type: Scratch.ArgumentType.STRING, defaultValue: 'white' }
                        }
                    },
                    {
                        opcode: 'getInputColor', blockType: Scratch.BlockType.REPORTER,
                        text: '入力欄の [COLOR_TYPE] の現在の値',
                        arguments: { COLOR_TYPE: { type: Scratch.ArgumentType.STRING, menu: 'colorMenu' } }
                    },
                    { opcode: 'enterKeyPressed', blockType: Scratch.BlockType.BOOLEAN, text: 'エンターキーが押された（入力確定された）' }
                ],
                menus: {
                    sizeMenu: { acceptReporters: false, items: ['幅','高さ'] },
                    colorMenu: { acceptReporters: false, items: ['背景色','文字色'] }
                }
            };
        }
    }

    Scratch.extensions.register(new IMEExtension());
})(Scratch);
