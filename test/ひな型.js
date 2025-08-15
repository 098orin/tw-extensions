(function (Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        console.warn('この拡張は unsandboxed モードで実行する必要があります。');
        return;
    }

    class ClassA {
        getInfo() {
            return {
                id: "id",
                name: "name",
                blocks: [
                    {
                        opcode: "opcode",
                        blockType: Scratch.BlockType.COMMAND,
                        text: "text"
                    }
                ]
            };
        }

        }

        Scratch.extensions.register(new ClassA());
})(Scratch);