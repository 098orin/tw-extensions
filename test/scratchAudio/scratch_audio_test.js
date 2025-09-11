(function (Scratch) {
  'use strict';

  if (!Scratch.extensions.unsandboxed) {
    console.warn('この拡張は unsandboxed モードで実行する必要があります。');
    return;
  }

  const vm = Scratch.vm;
  const runtime = vm.runtime;
  const audioEngine = runtime.audioEngine;

  class ScratchAudioTest {
    constructor() {
      this.tempo = 60; // デフォルトのテンポ
    }
    getInfo() {
      return {
        id: "id",
        name: "scratch_audio_test",
        blocks: [
          {
            opcode: "SoundNote",
            blockType: Scratch.BlockType.COMMAND,
            text: "Sound Note [NOTE] with [INSTRUMENT] for [BEATS] beats",
            arguments: {
              NOTE: { type: Scratch.ArgumentType.STRING, defaultValue: "60" },
              INSTRUMENT: { type: Scratch.ArgumentType.STRING, defaultValue: "piano" },
              BEATS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0.25}
            }
          },
          {
            opcode: "GetTempo",
            blockType: Scratch.BlockType.REPORTER,
            text: "tempo"
          }
        ]
      };
    }

    GetTempo() {
      return this.tempo;
    }

    SoundNote(args, util) {
      const note = Scratch.Cast.toNumber(args.NOTE);
      const instrument = args.INSTRUMENT;
      const beats = Scratch.Cast.toNumber(args.BEATS);
      const tempo = this.tempo
      const seconds = beats * 60 / tempo;

      if (!audioEngine) {
        console.warn('Audio engine not found');
      } else {
        console.log(`Playing note ${note} with instrument ${instrument} for ${seconds} beats`);
        this._playNote(util, note, instrument, seconds);
      }
    }


    _playNote(util, note, instrument, seconds) {
      if (audioEngine === null) {
        console.warn('Audio engine not found');
        return;
      }

      if (util.target.sprite.soundBank === null) {
        console.warn('Sound bank not found');
        return;
      }
      console.log(util.target);
      console.log(util.runtime.audioEngine);

    }

  }

  Scratch.extensions.register(new ScratchAudioTest());
})(Scratch);