//version 1.3

(function (Scratch) {
  'use strict';

  class TelegramReactions {
    constructor() { this.shared = window.TelegramShared || {}; this.lastError = ''; this.reactions = {}; }

    getInfo() {
      return {
        id: 'TelegramReactions',
        name: 'Telegram Reactions',
        color1: '#FFCC33',
        blocks: [
          { opcode: 'setReaction', blockType: Scratch.BlockType.COMMAND, text: 'установить реакцию [EMOJI] на сообщение [MESSAGEID] в чате [CHATID]', arguments: { EMOJI: { type: Scratch.ArgumentType.STRING, defaultValue: '👍' }, MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, CHATID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 } } },
          { opcode: 'removeReaction', blockType: Scratch.BlockType.COMMAND, text: 'убрать реакцию с сообщения [MESSAGEID] в чате [CHATID]', arguments: { MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, CHATID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 } } },
          { opcode: 'getReactions', blockType: Scratch.BlockType.REPORTER, text: 'реакции на сообщение [MESSAGEID] в чате [CHATID]', arguments: { MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, CHATID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 } } },
          { opcode: 'getLastError', blockType: Scratch.BlockType.REPORTER, text: 'последняя ошибка' }
        ]
      };
    }

    async setReaction(args) {
      if (!this.shared.token) { this.lastError = 'Токен не задан'; console.error(this.lastError); return; }
      const url = `https://api.telegram.org/bot${this.shared.token}/setMessageReaction`;
      const reaction = [{ type: 'emoji', emoji: args.EMOJI }];
      const body = { chat_id: args.CHATID, message_id: args.MESSAGEID, reaction };
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        if (data.ok) {
          const key = `${args.CHATID}_${args.MESSAGEID}`;
          this.reactions[key] = this.reactions[key] ? this.reactions[key] + ', ' + args.EMOJI : args.EMOJI;
        } else { this.lastError = data.description; console.error('Ошибка:', this.lastError); }
      } catch (error) { this.lastError = 'Ошибка сети: ' + error.message; console.error('Ошибка:', error); }
    }

    async removeReaction(args) {
      if (!this.shared.token) { this.lastError = 'Токен не задан'; console.error(this.lastError); return; }
      const key = `${args.CHATID}_${args.MESSAGEID}`;
      if (!this.reactions[key]) { this.lastError = 'Реакция не установлена'; console.log(this.lastError); return; }
      const url = `https://api.telegram.org/bot${this.shared.token}/setMessageReaction`;
      const body = { chat_id: args.CHATID, message_id: args.MESSAGEID, reaction: [] };
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        if (data.ok) delete this.reactions[key];
        else { this.lastError = data.description; console.error('Ошибка:', this.lastError); }
      } catch (error) { this.lastError = 'Ошибка сети: ' + error.message; console.error('Ошибка:', error); }
    }

    getReactions(args) { return this.reactions[`${args.CHATID}_${args.MESSAGEID}`] || ''; }
    getLastError() { return this.lastError; }
  }

  Scratch.extensions.register(new TelegramReactions());
})(Scratch);
