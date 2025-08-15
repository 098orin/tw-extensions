(function (Scratch) {
    "use strict";

if (!Scratch.extensions.unsandboxed) {
        alert("Mouce caption extention must be ran as unsandboxed!");
        throw new Error("Mouce caption extention must be run as unsandboxed");
    }

    class MouseCaption {
        constructor() {
            this._caption = document.body.title || "";
        }

        getInfo() {
            return {
                id: "mouseCaption",
                name: "マウスキャプション",
                blocks: [
                    {
                        opcode: "getCaption",
                        blockType: Scratch.BlockType.REPORTER,
                        text: "現在設定されているキャプション"
                    },
                    {
                        opcode: "setCaption",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "マウスのキャプションを [TEXT] にする",
                        arguments: {
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: "Hello!"
                            }
                        }
                    }
                ]
            };
        }

        getCaption() {
            return this._caption;
        }

        setCaption(args) {
            const text = args.TEXT || "";
            this._caption = text;
            document.body.title = text;
        }
    }

    // マウスのツールチップというらしいですね
    Scratch.extensions.register(new MouseCaption());

})(Scratch);
