//version 1.1

(function (Scratch) {
  'use strict';

  class FSM {
    constructor() {
      this.states = {};
      this.currentState = 'start';
      this.context = {};
    }

    getInfo() {
      return {
        id: 'FSM',
        name: 'Finite State Machine',
        color1: '#FF6666',
        blocks: [
          { opcode: 'setState', blockType: Scratch.BlockType.COMMAND, text: 'установить состояние [STATE]', arguments: { STATE: { type: Scratch.ArgumentType.STRING, defaultValue: 'start' } } },
          { opcode: 'getState', blockType: Scratch.BlockType.REPORTER, text: 'текущее состояние' },
          { opcode: 'whenState', blockType: Scratch.BlockType.HAT, text: 'когда состояние [STATE]', arguments: { STATE: { type: Scratch.ArgumentType.STRING, defaultValue: 'start' } } },
          { opcode: 'setContext', blockType: Scratch.BlockType.COMMAND, text: 'установить контекст [KEY] = [VALUE]', arguments: { KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'key' }, VALUE: { type: Scratch.ArgumentType.STRING, defaultValue: 'value' } } },
          { opcode: 'getContext', blockType: Scratch.BlockType.REPORTER, text: 'получить контекст [KEY]', arguments: { KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'key' } } },
          { opcode: 'resetContext', blockType: Scratch.BlockType.COMMAND, text: 'сбросить контекст' }
        ]
      };
    }

    setState(args) { this.currentState = args.STATE; }
    getState() { return this.currentState; }
    whenState(args) { return this.currentState === args.STATE; }
    setContext(args) { this.context[args.KEY] = args.VALUE; }
    getContext(args) { return this.context[args.KEY] || ''; }
    resetContext() { this.context = {}; }
  }

  Scratch.extensions.register(new FSM());
})(Scratch);
