(function(Scratch) {
  'use strict';

  class RiffExtension {
    getInfo() {
      return {
        id: 'riffParser',
        name: 'RIFF Parser',
        blocks: [
          {
            opcode: 'chunkToJson',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Chunk to JSON [HEX]',
            arguments: {
              HEX: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              }
            }
          },
          {
            opcode: 'getChunkFrom',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Get chunk [NAME] from [HEX]',
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              },
              HEX: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: ''
              }
            }
          }
        ]
      };
    }

    // hex文字列 → ArrayBuffer
    hexToBytes(hex) {
      if (!hex) return new ArrayBuffer(0);
      const len = hex.length / 2;
      const arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        arr[i] = parseInt(hex.substr(i * 2, 2), 16);
      }
      return arr.buffer;
    }

    // ArrayBuffer → hex文字列
    bytesToHex(buffer, start, length) {
      const arr = new Uint8Array(buffer, start, length);
      return Array.from(arr)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join('');
    }

    // RIFFパーサ
    parseRiff(buffer) {
      const view = new DataView(buffer);
      const bytes = new Uint8Array(buffer);
      const td = new TextDecoder('ascii');
      const readString = (o, l) => td.decode(bytes.subarray(o, o + l));
      const readUint32LE = o => view.getUint32(o, true);

      if (readString(0, 4) !== 'RIFF') throw new Error('Not RIFF');
      const declaredSize = readUint32LE(4);
      const type = readString(8, 4);

      const parseChunks = (offset, end) => {
        const chunks = [];
        let pos = offset;
        while (pos + 8 <= end) {
          const id = readString(pos, 4);
          const size = readUint32LE(pos + 4);
          const dataStart = pos + 8;
          const dataEnd = dataStart + size;
          if (dataEnd > buffer.byteLength) break;

          let chunk = { id, size, dataStart, dataEnd };

          if (id === 'RIFF' || id === 'LIST') {
            const subtype = readString(dataStart, 4);
            chunk.type = subtype;
            chunk.children = parseChunks(dataStart + 4, dataEnd);
          }

          chunks.push(chunk);
          pos = dataEnd + (size % 2); // 偶数境界にアライン
        }
        return chunks;
      };

      return {
        id: 'RIFF',
        size: declaredSize,
        type,
        children: parseChunks(12, buffer.byteLength),
        buffer
      };
    }

    // JSON出力
    chunkToJson(args) {
      try {
        const buffer = this.hexToBytes(args.HEX);
        if (buffer.byteLength === 0) return '';
        const result = this.parseRiff(buffer);

        // dataStart/dataEnd は JSON には不要なので削除
        function clean(node) {
          const { id, size, type, children } = node;
          const obj = { id, size };
          if (type) obj.type = type;
          if (children) obj.children = children.map(clean);
          return obj;
        }

        return JSON.stringify(clean(result));
      } catch (e) {
        return 'Error: ' + e.message;
      }
    }

    // チャンクの生データをHEXで返す
    getChunkFrom(args) {
      try {
        const buffer = this.hexToBytes(args.HEX);
        if (buffer.byteLength === 0) return '';

        const result = this.parseRiff(buffer);

        function findChunk(node, name) {
          if (!node.children) return null;
          for (const c of node.children) {
            if (c.id === name) return c;
            const found = findChunk(c, name);
            if (found) return found;
          }
          return null;
        }

        const found = findChunk(result, args.NAME);
        if (!found) return '';

        // データ部分をHEXにして返す
        return this.bytesToHex(buffer, found.dataStart, found.size);
      } catch (e) {
        return 'Error: ' + e.message;
      }
    }
  }

  Scratch.extensions.register(new RiffExtension());
})(Scratch);