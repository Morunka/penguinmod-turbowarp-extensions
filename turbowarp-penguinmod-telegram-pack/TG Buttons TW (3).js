// @name Telegram Buttons
// @description Работа с кнопками и клавиатурами в Telegram.
// @id TelegramButtons
// @version 1.3

(function (Scratch) {
  'use strict';

  class TelegramButtons {
    constructor() { this.shared = window.TelegramShared || {}; this.buttons = []; this.lastError = ''; }

    getInfo() {
      return {
        id: 'TelegramButtons',
        name: 'Telegram Buttons',
        color1: '#33CCFF',
        blocks: [
          { opcode: 'addButton', blockType: Scratch.BlockType.COMMAND, text: 'добавить кнопку [TEXT] тип [TYPE] данные [DATA]', arguments: { TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Кнопка' }, TYPE: { type: Scratch.ArgumentType.STRING, menu: 'TYPE_MENU' }, DATA: { type: Scratch.ArgumentType.STRING, defaultValue: 'data' } } },
          { opcode: 'resetButtons', blockType: Scratch.BlockType.COMMAND, text: 'сбросить кнопки' },
          { opcode: 'resetCallback', blockType: Scratch.BlockType.COMMAND, text: 'сбросить последние данные callback' },
          { opcode: 'getButtons', blockType: Scratch.BlockType.REPORTER, text: 'получить JSON кнопок' },
          { opcode: 'whenCallbackReceived', blockType: Scratch.BlockType.HAT, text: 'когда получен callback' },
          { opcode: 'getCallbackData', blockType: Scratch.BlockType.REPORTER, text: 'последние данные callback' },
          { opcode: 'getLastError', blockType: Scratch.BlockType.REPORTER, text: 'последняя ошибка' }
        ],
        menus: { TYPE_MENU: { items: ['callback_data', 'url'] } }
      };
    }

    addButton(args) {
      const button = { text: args.TEXT };
      if (args.TYPE === 'url' && !args.DATA.includes('://')) this.lastError = 'Некорректный URL';
      else button[args.TYPE] = args.DATA;
      this.buttons.push([button]);
    }
    resetButtons() { this.buttons = []; }
    resetCallback() { if (this.shared.lastUpdate) this.shared.lastUpdate.callback_query = null; }
    getButtons() { return JSON.stringify(this.buttons); }
    whenCallbackReceived() {
      const hasCallback = this.shared.updates.length > 0 && !!this.shared.updates[this.shared.updates.length - 1].callback_query;
      if (hasCallback) this.shared.updates.shift();
      return hasCallback;
    }
    getCallbackData() { return this.shared.lastUpdate?.callback_query?.data || ''; }
    getLastError() { return this.lastError; }
  }

  Scratch.extensions.register(new TelegramButtons());
})(Scratch);