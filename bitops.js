(function() {
  "use strict";

  class BitStringOps {
    getInfo() {
      return {
        id: 'bitstringops',
        name: 'BitString Operations',
        blocks: [
          {
            opcode: 'and',
            blockType: 'reporter',
            text: '[A] AND [B]',
            arguments: { A: { type: 'string', defaultValue: '1101' }, B: { type: 'string', defaultValue: '1011' } }
          },
          {
            opcode: 'or',
            blockType: 'reporter',
            text: '[A] OR [B]',
            arguments: { A: { type: 'string', defaultValue: '1101' }, B: { type: 'string', defaultValue: '1011' } }
          },
          {
            opcode: 'xor',
            blockType: 'reporter',
            text: '[A] XOR [B]',
            arguments: { A: { type: 'string', defaultValue: '1101' }, B: { type: 'string', defaultValue: '1011' } }
          },
          {
            opcode: 'not',
            blockType: 'reporter',
            text: 'NOT [A]',
            arguments: { A: { type: 'string', defaultValue: '1101' } }
          }
        ]
      };
    }

    _pad(a, b) {
      a = String(a); // 文字列化
      b = String(b);
      const maxLen = Math.max(a.length, b.length);
      return [a.padStart(maxLen, '0'), b.padStart(maxLen, '0')];
    }

    and(args) {
      let [a, b] = this._pad(args.A, args.B);
      let res = '';
      for (let i = 0; i < a.length; i++) res += (a[i] === '1' && b[i] === '1') ? '1' : '0';
      return res;
    }

    or(args) {
      let [a, b] = this._pad(args.A, args.B);
      let res = '';
      for (let i = 0; i < a.length; i++) res += (a[i] === '1' || b[i] === '1') ? '1' : '0';
      return res;
    }

    xor(args) {
      let [a, b] = this._pad(args.A, args.B);
      let res = '';
      for (let i = 0; i < a.length; i++) res += (a[i] !== b[i]) ? '1' : '0';
      return res;
    }

    not(args) {
      let a = String(args.A);
      return a.split('').map(c => (c === '1' ? '0' : '1')).join('');
    }
  }

  Scratch.extensions.register(new BitStringOps());
})();
