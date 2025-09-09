(function(Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    console.warn('この拡張は unsandboxed モードで実行する必要があります。');
    return;
  }

  class FileToHexExtension {
    getInfo() {
      return {
        id: 'fileLoader',
        name: 'File to HEX',
        blocks: [
          {
            opcode: 'loadFileAsHex',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Load file as HEX'
          }
        ]
      };
    }

    // 安全に HEX 変換
    bytesToHex(buffer) {
      const bytes = new Uint8Array(buffer);
      let hex = '';
      const chunkSize = 65536; // 64KB ごとに処理
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        for (let j = 0; j < chunk.length; j++) {
          hex += chunk[j].toString(16).padStart(2, '0').toUpperCase();
        }
      }
      return hex;
    }

    loadFileAsHex() {
      return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';

        input.onchange = e => {
          const file = e.target.files[0];
          if (!file) {
            // キャンセル時は空文字で終了
            resolve('');
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            const buffer = reader.result;
            const hex = this.bytesToHex(buffer);
            resolve(hex);
          };
          reader.onerror = () => resolve('');
          reader.readAsArrayBuffer(file);
        };

        // 直接ダイアログを開く
        input.click();
      });
    }
  }

  Scratch.extensions.register(new FileToHexExtension());
})(Scratch);
