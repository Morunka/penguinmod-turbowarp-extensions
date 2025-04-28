//version 1.4

(function (Scratch) {
  'use strict';

  class TelegramMessages {
    constructor() { this.shared = window.TelegramShared || {}; this.lastError = ''; this.lastSent = {}; }

    getInfo() {
      return {
        id: 'TelegramMessages',
        name: 'Telegram Messages',
        color1: '#00AADD',
        blocks: [
          { opcode: 'sendMessage', blockType: Scratch.BlockType.COMMAND, text: 'отправить [TEXT] в чат [CHATID] с кнопками [BUTTONS] и фото [PHOTO]', arguments: { TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Привет!' }, CHATID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 }, BUTTONS: { type: Scratch.ArgumentType.STRING, defaultValue: '[]' }, PHOTO: { type: Scratch.ArgumentType.STRING, defaultValue: '' } } },
          { opcode: 'editMessage', blockType: Scratch.BlockType.COMMAND, text: 'изменить сообщение [MESSAGEID] в чате [CHATID] на [TEXT] с кнопками [BUTTONS] и фото [PHOTO]', arguments: { MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, CHATID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 }, TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Новый текст' }, BUTTONS: { type: Scratch.ArgumentType.STRING, defaultValue: '[]' }, PHOTO: { type: Scratch.ArgumentType.STRING, defaultValue: '' } } },
          { opcode: 'deleteMessage', blockType: Scratch.BlockType.COMMAND, text: 'удалить сообщение [MESSAGEID] в чате [CHATID]', arguments: { MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, CHATID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 } } },
          { opcode: 'getLastError', blockType: Scratch.BlockType.REPORTER, text: 'последняя ошибка' }
        ]
      };
    }

    async sendMessage(args) {
      if (!this.shared.token) { this.lastError = 'Токен не задан'; console.error(this.lastError); return; }
      const url = args.PHOTO ? `https://api.telegram.org/bot${this.shared.token}/sendPhoto` : `https://api.telegram.org/bot${this.shared.token}/sendMessage`;
      const body = args.PHOTO ? { chat_id: args.CHATID, photo: args.PHOTO, caption: args.TEXT } : { chat_id: args.CHATID, text: args.TEXT };
      if (args.BUTTONS !== '[]') body.reply_markup = { inline_keyboard: JSON.parse(args.BUTTONS) };
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        if (data.ok) {
          this.shared.lastBotMessageId = data.result.message_id;
          this.lastSent[data.result.message_id] = { text: args.TEXT, buttons: args.BUTTONS, photo: args.PHOTO };
        } else { this.lastError = data.description; console.error('Ошибка:', this.lastError); }
      } catch (error) { this.lastError = 'Ошибка сети: ' + error.message; console.error('Ошибка:', error); }
    }

    async editMessage(args) {
      if (!this.shared.token) { this.lastError = 'Токен не задан'; console.error(this.lastError); return; }
      const last = this.lastSent[args.MESSAGEID] || {};
      if (last.text === args.TEXT && last.buttons === args.BUTTONS && last.photo === args.PHOTO) {
        this.lastError = 'Сообщение не изменено';
        console.log('Пропущен запрос: данные идентичны');
        return;
      }
      const url = args.PHOTO ? `https://api.telegram.org/bot${this.shared.token}/editMessageMedia` : `https://api.telegram.org/bot${this.shared.token}/editMessageText`;
      const body = args.PHOTO ? { chat_id: args.CHATID, message_id: args.MESSAGEID, media: JSON.stringify({ type: 'photo', media: args.PHOTO, caption: args.TEXT }) } : { chat_id: args.CHATID, message_id: args.MESSAGEID, text: args.TEXT };
      if (args.BUTTONS !== '[]') body.reply_markup = { inline_keyboard: JSON.parse(args.BUTTONS) };
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        if (data.ok) this.lastSent[args.MESSAGEID] = { text: args.TEXT, buttons: args.BUTTONS, photo: args.PHOTO };
        else { this.lastError = data.description; console.error('Ошибка:', this.lastError); }
      } catch (error) { this.lastError = 'Ошибка сети: ' + error.message; console.error('Ошибка:', error); }
    }

    async deleteMessage(args) {
      if (!this.shared.token) { this.lastError = 'Токен не задан'; console.error(this.lastError); return; }
      const url = `https://api.telegram.org/bot${this.shared.token}/deleteMessage`;
      const body = { chat_id: args.CHATID, message_id: args.MESSAGEID };
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        if (!data.ok) { this.lastError = data.description; console.error('Ошибка:', this.lastError); }
      } catch (error) { this.lastError = 'Ошибка сети: ' + error.message; console.error('Ошибка:', error); }
    }

    getLastError() { return this.lastError; }
  }

  Scratch.extensions.register(new TelegramMessages());
})(Scratch);
