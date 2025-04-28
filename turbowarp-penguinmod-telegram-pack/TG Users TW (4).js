// @name Telegram Users
// @description Управление пользователями и банами в Telegram.
// @id TelegramUsers
// @version 1.4

(function (Scratch) {
  'use strict';

  class TelegramUsers {
    constructor() { this.shared = window.TelegramShared || {}; this.allUsers = new Set(); this.botRole = ''; this.userRole = ''; this.lastError = ''; }

    getInfo() {
      return {
        id: 'TelegramUsers',
        name: 'Telegram Users',
        color1: '#66CCFF',
        blocks: [
          { opcode: 'manageUser', blockType: Scratch.BlockType.COMMAND, text: '[ACTION] пользователя [USERID] в чате [CHATID] до [UNTIL_DATE]', arguments: { ACTION: { type: Scratch.ArgumentType.STRING, menu: 'ACTION_MENU' }, USERID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 }, CHATID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 }, UNTIL_DATE: { type: Scratch.ArgumentType.NUMBER, defaultValue: 0 } } },
          { opcode: 'getLastUsername', blockType: Scratch.BlockType.REPORTER, text: 'имя последнего пользователя' },
          { opcode: 'getAllUsers', blockType: Scratch.BlockType.REPORTER, text: 'все пользователи' },
          { opcode: 'getLastBotMessageId', blockType: Scratch.BlockType.REPORTER, text: 'ID последнего сообщения бота' },
          { opcode: 'getLastMessageId', blockType: Scratch.BlockType.REPORTER, text: 'ID последнего сообщения' },
          { opcode: 'getChatType', blockType: Scratch.BlockType.REPORTER, text: 'тип последнего чата' },
          { opcode: 'getBotRole', blockType: Scratch.BlockType.REPORTER, text: 'роль бота в последнем чате' },
          { opcode: 'getUserRole', blockType: Scratch.BlockType.REPORTER, text: 'роль последнего пользователя' },
          { opcode: 'getLastUserId', blockType: Scratch.BlockType.REPORTER, text: 'ID последнего пользователя' },
          { opcode: 'getLastError', blockType: Scratch.BlockType.REPORTER, text: 'последняя ошибка' }
        ],
        menus: { ACTION_MENU: { items: ['бан', 'мут', 'кик', 'разбан', 'размут', 'добавить'] } }
      };
    }

    async manageUser(args) {
      if (!this.shared.token) { this.lastError = 'Токен не задан'; console.error(this.lastError); return; }
      let url, body;
      switch (args.ACTION) {
        case 'бан': url = `https://api.telegram.org/bot${this.shared.token}/banChatMember`; body = { chat_id: args.CHATID, user_id: args.USERID, until_date: args.UNTIL_DATE }; break;
        case 'мут': url = `https://api.telegram.org/bot${this.shared.token}/restrictChatMember`; body = { chat_id: args.CHATID, user_id: args.USERID, permissions: { can_send_messages: false }, until_date: args.UNTIL_DATE }; break;
        case 'кик': url = `https://api.telegram.org/bot${this.shared.token}/kickChatMember`; body = { chat_id: args.CHATID, user_id: args.USERID }; break;
        case 'разбан': url = `https://api.telegram.org/bot${this.shared.token}/unbanChatMember`; body = { chat_id: args.CHATID, user_id: args.USERID }; break;
        case 'размут': url = `https://api.telegram.org/bot${this.shared.token}/restrictChatMember`; body = { chat_id: args.CHATID, user_id: args.USERID, permissions: { can_send_messages: true } }; break;
        case 'добавить': url = `https://api.telegram.org/bot${this.shared.token}/inviteChatMember`; body = { chat_id: args.CHATID, user_id: args.USERID }; break;
      }
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        if (!data.ok) { this.lastError = data.description; console.error('Ошибка:', this.lastError); } else this.lastError = '';
      } catch (error) { this.lastError = error.message; console.error('Ошибка:', error); }
    }

    getLastUsername() { return this.shared.lastUpdate?.message?.from?.username || 'anonymous'; }
    getAllUsers() { if (this.shared.lastUpdate?.message?.from?.username) this.allUsers.add(this.shared.lastUpdate.message.from.username || 'anonymous'); return Array.from(this.allUsers).join(', '); }
    getLastBotMessageId() { return this.shared.lastBotMessageId || ''; }
    getLastMessageId() { return this.shared.lastUpdate?.message?.message_id || ''; }
    getChatType() { return this.shared.lastChatType || ''; }
    async getBotRole() {
      if (!this.shared.token || !this.shared.lastUpdate) return '';
      const chatId = this.shared.lastUpdate.message?.chat?.id;
      const botId = (await (await fetch(`https://api.telegram.org/bot${this.shared.token}/getMe`)).json()).result.id;
      const response = await fetch(`https://api.telegram.org/bot${this.shared.token}/getChatMember`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, user_id: botId }) });
      const data = await response.json();
      if (data.ok) this.botRole = data.result.status + (data.result.can_send_messages ? ' (может писать)' : '');
      else { this.lastError = data.description; console.error('Ошибка:', this.lastError); }
      return this.botRole;
    }
    async getUserRole() {
      if (!this.shared.token || !this.shared.lastUpdate) return '';
      const chatId = this.shared.lastUpdate.message?.chat?.id;
      const userId = this.shared.lastUpdate.message?.from?.id;
      const response = await fetch(`https://api.telegram.org/bot${this.shared.token}/getChatMember`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, user_id: userId }) });
      const data = await response.json();
      if (data.ok) this.userRole = data.result.status + (data.result.can_send_messages ? ' (может писать)' : '');
      else { this.lastError = data.description; console.error('Ошибка:', this.lastError); }
      return this.userRole;
    }
    getLastUserId() { return this.shared.lastUpdate?.message?.from?.id || ''; }
    getLastError() { return this.lastError; }
  }

  Scratch.extensions.register(new TelegramUsers());
})(Scratch);