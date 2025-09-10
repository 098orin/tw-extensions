# Scratch Audio についての研究と実験
## 最終目的
Scratch Audioを使ってScratchのMusic Extension と同等の拡張機能を作る

## 導入
### どこにあるのか
```js
const vm = Scratch.vm;
const runtime = vm.runtime;
const audioEngine = runtime.audioEngine;
```
`audioEngine`に対して呼び出すことができる