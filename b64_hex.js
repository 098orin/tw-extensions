class b64 {
    getInfo() {
        return {
            id: "b64hex",
            name: "base64 to hex",
            blocks: [
                {
                    opcode: "b64ToHex",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "Decode [DATA] as hex",
                    arguments: {
                        DATA: {
                            type: Scratch.ArgumentType.STRING
                        }
                    }
                },
                {
                    opcode: "b64FromDataURL",
                    blockType: Scratch.BlockType.REPORTER,
                    text: "Get base64 from data URL [DATA]",
                    arguments: {
                        DATA: {
                            type: Scratch.ArgumentType.STRING
                        }
                    }
                }
            ]
        }
    }

    b64ToHex(args) {
        const base64 = args.DATA.toString()
        // Decode Base64 to binary string
        const binaryString = atob(base64);

        // Convert binary string to hexadecimal
        return Array.from(binaryString)
            .map(char => char.charCodeAt(0).toString(16).padStart(2, "0"))
            .join("");

    }

    b64FromDataURL(args) {
        const dataURL = args.DATA.toString();
        const match = dataURL.match(/^data:.*;base64,(.*)$/);
        return match ? match[1] : "";
    }
}

Scratch.extensions.register(new b64());