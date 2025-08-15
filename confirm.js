(function (Scratch) {
    "use strict";

    if (!Scratch.extensions.unsandboxed) {
        alert("Confirm extention must be ran as unsandboxed!");
        throw new Error("Confirm extention must be run as unsandboxed");
    }

    class ConfirmExtension {
        constructor() {
            this._lastConfirmResult = false;
            this._lastPromptResult = '';
        }

        getInfo() {
            return {
                id: 'confirmExtension',
                name: '確認ダイアログ',
                blocks: [
                    {
                        opcode: 'showDialog',
                        blockType: Scratch.BlockType.COMMAND,
                        text: '[MESSAGE] で [TYPE] を送る',
                        arguments: {
                            MESSAGE: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '続行しますか？'
                            },
                            TYPE: {
                                type: Scratch.ArgumentType.STRING,
                                menu: 'dialogTypes',
                                defaultValue: '確認'
                            }
                        }
                    },
                    {
                        opcode: 'lastConfirmOk',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: '確認でOKされた'
                    },
                    {
                        opcode: 'lastPromptValue',
                        blockType: Scratch.BlockType.REPORTER,
                        text: '最後の入力内容'
                    }
                ],
                menus: {
                    dialogTypes: {
                        acceptReporters: true,
                        items: ['確認', '警告', '情報', '入力']
                    }
                }
            };
        }

        showDialog({ MESSAGE, TYPE }) {
            if (TYPE === '確認') {
                this._lastConfirmResult = confirm(MESSAGE);
                this._lastPromptResult = '';
            } else if (TYPE === '警告') {
                alert('⚠ ' + MESSAGE);
                this._lastConfirmResult = true;
                this._lastPromptResult = '';
            } else if (TYPE === '情報') {
                alert(MESSAGE);
                this._lastConfirmResult = true;
                this._lastPromptResult = '';
            } else if (TYPE === '入力') {
                const result = prompt(MESSAGE, '');
                this._lastPromptResult = result !== null ? result : '';
                this._lastConfirmResult = true;
            } else {
                alert(MESSAGE);
                this._lastConfirmResult = true;
                this._lastPromptResult = '';
            }
        }

        lastConfirmOk() {
            return this._lastConfirmResult;
        }

        lastPromptValue() {
            return this._lastPromptResult;
        }
    }

    Scratch.extensions.register(new ConfirmExtension());
})(Scratch);
