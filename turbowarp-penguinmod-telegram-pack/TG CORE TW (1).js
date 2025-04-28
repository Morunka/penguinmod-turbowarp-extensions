// @name Telegram Core
// @description Базовые функции для Telegram бота.
// @id TelegramCore
// @version 1.2

(function (Scratch) {
  'use strict';

  class TelegramCore {
    constructor() {
      window.TelegramShared = window.TelegramShared || {
        token: '',
        updates: [],
        lastUpdate: null,
        offset: 0,
        pollingActive: false,
        lastChatType: '',
        lastBotMessageId: ''
      };
      this.shared = window.TelegramShared;
    }

    getInfo() {
      return {
        id: 'TelegramCore',
        name: 'Telegram Core',
        color1: '#0088CC',
        blocks: [
          { opcode: 'initBot', blockType: Scratch.BlockType.COMMAND, text: 'инициализировать бота с токеном [TOKEN]', arguments: { TOKEN: { type: Scratch.ArgumentType.STRING, defaultValue: 'ТОКЕН_БОТА' } } },
          { opcode: 'resetBot', blockType: Scratch.BlockType.COMMAND, text: 'сбросить бота' },
          { opcode: 'startPolling', blockType: Scratch.BlockType.COMMAND, text: 'начать поллинг каждые [SECONDS] сек', arguments: { SECONDS: { type: Scratch.ArgumentType.NUMBER, defaultValue: 5 } } },
          { opcode: 'stopPolling', blockType: Scratch.BlockType.COMMAND, text: 'остановить поллинг' },
          { opcode: 'getLastMessage', blockType: Scratch.BlockType.REPORTER, text: 'последнее сообщение' },
          { opcode: 'getLastChatId', blockType: Scratch.BlockType.REPORTER, text: 'ID последнего чата' },
          { opcode: 'hasNewMessages', blockType: Scratch.BlockType.BOOLEAN, text: 'есть новые сообщения?' },
          { opcode: 'whenMessageReceived', blockType: Scratch.BlockType.HAT, text: 'когда получено сообщение' }
        ]
      };
    }

    initBot(args) { this.shared.token = args.TOKEN; }
    resetBot() { this.shared.token = ''; this.shared.updates = []; this.shared.lastUpdate = null; this.shared.offset = 0; this.shared.pollingActive = false; this.shared.lastChatType = ''; this.shared.lastBotMessageId = ''; }

    async startPolling(args) {
      if (this.shared.pollingActive) return;
      this.shared.pollingActive = true;
      const interval = args.SECONDS * 1000;
      const poll = async () => {
        if (!this.shared.pollingActive || !this.shared.token) return;
        try {
          const response = await fetch(`https://api.telegram.org/bot${this.shared.token}/getUpdates?offset=${this.shared.offset}&timeout=10`);
          const data = await response.json();
          if (data.ok && data.result.length > 0) {
            this.shared.updates = data.result;
            this.shared.lastUpdate = data.result[data.result.length - 1];
            this.shared.offset = this.shared.updates[this.shared.updates.length - 1].update_id + 1;
            this.shared.lastChatType = this.shared.lastUpdate.message?.chat?.type || '';
          }
        } catch (error) { console.error('Ошибка поллинга:', error); }
        setTimeout(poll, interval);
      };
      poll();
    }

    stopPolling() { this.shared.pollingActive = false; }
    getLastMessage() { return this.shared.lastUpdate?.message?.text || ''; }
    getLastChatId() { return this.shared.lastUpdate?.message?.chat?.id || ''; }
    hasNewMessages() { return this.shared.updates.length > 0; }
    whenMessageReceived() {
      const hasMessage = this.shared.updates.length > 0 && !!this.shared.updates[this.shared.updates.length - 1].message;
      if (hasMessage) this.shared.updates.shift(); // Удаляем только первое обновление
      return hasMessage;
    }
  }

  Scratch.extensions.register(new TelegramCore());
})(Scratch);