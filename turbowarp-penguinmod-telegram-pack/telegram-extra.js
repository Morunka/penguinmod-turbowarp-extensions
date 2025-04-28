//version 2.2

(function (Scratch) {
  'use strict';

  class TelegramExtras {
    constructor() { 
      this.shared = window.TelegramShared || {}; 
      this.rules = 'Нет правил'; 
      this.lastError = ''; 
      this.lastPreCheckoutId = ''; 
      this.lastPreCheckoutQuery = null;
    }

    getInfo() {
      return {
        id: 'TelegramExtras',
        name: 'Telegram Extras',
        color1: '#CCEEFF',
        blocks: [
          { opcode: 'setRules', blockType: Scratch.BlockType.COMMAND, text: 'установить правила [RULES]', arguments: { RULES: { type: Scratch.ArgumentType.STRING, defaultValue: 'Не флудить' } } },
          { opcode: 'getRules', blockType: Scratch.BlockType.REPORTER, text: 'получить правила' },
          { opcode: 'sendPayment', blockType: Scratch.BlockType.COMMAND, text: 'отправить счёт в [CHATID] заголовок [TITLE] описание [DESC] токен [PROVIDER] валюта [CURRENCY] цены [PRICES]', arguments: { CHATID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 }, TITLE: { type: Scratch.ArgumentType.STRING, defaultValue: 'Покупка' }, DESC: { type: Scratch.ArgumentType.STRING, defaultValue: 'Описание' }, PROVIDER: { type: Scratch.ArgumentType.STRING, defaultValue: '' }, CURRENCY: { type: Scratch.ArgumentType.STRING, defaultValue: 'XTR' }, PRICES: { type: Scratch.ArgumentType.STRING, defaultValue: '[{"label": "Товар", "amount": 100}]' } } },
          { opcode: 'answerInline', blockType: Scratch.BlockType.COMMAND, text: 'ответить на inline [INLINEID] результаты [RESULTS]', arguments: { INLINEID: { type: Scratch.ArgumentType.STRING, defaultValue: '' }, RESULTS: { type: Scratch.ArgumentType.STRING, defaultValue: '[{"type": "article", "id": "1", "title": "Пример", "input_message_content": {"message_text": "Привет!"}}]' } } },
          { opcode: 'getInlineQuery', blockType: Scratch.BlockType.REPORTER, text: 'последний inline запрос' },
          { opcode: 'whenInlineReceived', blockType: Scratch.BlockType.HAT, text: 'когда получен inline запрос' },
          { opcode: 'getUsernameById', blockType: Scratch.BlockType.REPORTER, text: 'имя по ID [USERID]', arguments: { USERID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 } } },
          { opcode: 'getDisplayNameById', blockType: Scratch.BlockType.REPORTER, text: 'отображаемое имя по ID [USERID]', arguments: { USERID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 } } },
          { opcode: 'answerPreCheckout', blockType: Scratch.BlockType.COMMAND, text: 'подтвердить предоплату с ID [PRECHECKOUTID] успешно [SUCCESS] с ошибкой [ERROR]', arguments: { PRECHECKOUTID: { type: Scratch.ArgumentType.STRING, defaultValue: '' }, SUCCESS: { type: Scratch.ArgumentType.BOOLEAN, defaultValue: true }, ERROR: { type: Scratch.ArgumentType.STRING, defaultValue: '' } } },
          { opcode: 'whenPaymentReceived', blockType: Scratch.BlockType.HAT, text: 'когда оплата прошла' },
          { opcode: 'whenPreCheckoutReceived', blockType: Scratch.BlockType.HAT, text: 'когда запрос оплаты получен' },
          { opcode: 'getLastPreCheckoutId', blockType: Scratch.BlockType.REPORTER, text: 'ID последнего запроса предоплаты' },
          { opcode: 'getLastPreCheckoutQuery', blockType: Scratch.BlockType.REPORTER, text: 'содержание последнего запроса предоплаты' },
          { opcode: 'getLastError', blockType: Scratch.BlockType.REPORTER, text: 'последняя ошибка' }
        ]
      };
    }

    setRules(args) { this.rules = args.RULES; }
    getRules() { return this.rules; }

    async sendPayment(args) {
      if (!this.shared.token) { this.lastError = 'Токен не задан'; console.error(this.lastError); return; }
      const url = `https://api.telegram.org/bot${this.shared.token}/sendInvoice`;
      const body = {
        chat_id: args.CHATID,
        title: args.TITLE,
        description: args.DESC,
        payload: 'payment_' + Date.now(),
        currency: args.CURRENCY,
        prices: JSON.parse(args.PRICES)
      };
      if (args.CURRENCY !== 'XTR') body.provider_token = args.PROVIDER;
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        if (!data.ok) { this.lastError = data.description; console.error('Ошибка:', this.lastError); }
      } catch (error) { this.lastError = 'Ошибка сети: ' + error.message; console.error('Ошибка:', error); }
    }

    async answerInline(args) {
      if (!this.shared.token) { this.lastError = 'Токен не задан'; console.error(this.lastError); return; }
      const url = `https://api.telegram.org/bot${this.shared.token}/answerInlineQuery`;
      const body = { inline_query_id: args.INLINEID, results: JSON.parse(args.RESULTS) };
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        if (!data.ok) { this.lastError = data.description; console.error('Ошибка:', this.lastError); }
      } catch (error) { this.lastError = 'Ошибка сети: ' + error.message; console.error('Ошибка:', error); }
    }

    async answerPreCheckout(args) {
      if (!this.shared.token) { this.lastError = 'Токен не задан'; console.error(this.lastError); return; }
      const url = `https://api.telegram.org/bot${this.shared.token}/answerPreCheckoutQuery`;
      const body = {
        pre_checkout_query_id: args.PRECHECKOUTID,
        ok: args.SUCCESS
      };
      if (!args.SUCCESS) body.error_message = args.ERROR || 'Ошибка оплаты';
      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await response.json();
        if (!data.ok) { this.lastError = data.description; console.error('Ошибка:', this.lastError); }
      } catch (error) { this.lastError = 'Ошибка сети: ' + error.message; console.error('Ошибка:', error); }
    }

    getInlineQuery() { return this.shared.lastUpdate?.inline_query?.query || ''; }
    whenInlineReceived() { 
      const hasInline = this.shared.updates.length > 0 && !!this.shared.updates[this.shared.updates.length - 1].inline_query; 
      if (hasInline) this.shared.updates.shift(); 
      return hasInline; 
    }

    whenPaymentReceived() {
      const update = this.shared.updates.length > 0 ? this.shared.updates[this.shared.updates.length - 1] : null;
      const hasPayment = update && update.message && update.message.successful_payment;
      if (hasPayment) this.shared.updates.shift();
      return hasPayment;
    }

    whenPreCheckoutReceived() {
      const hasPreCheckout = this.shared.updates.length > 0 && !!this.shared.updates[this.shared.updates.length - 1].pre_checkout_query;
      if (hasPreCheckout) {
        this.lastPreCheckoutQuery = this.shared.updates[this.shared.updates.length - 1].pre_checkout_query;
        this.lastPreCheckoutId = this.lastPreCheckoutQuery.id;
        this.shared.updates.shift();
      }
      return hasPreCheckout;
    }

    getLastPreCheckoutId() {
      return this.lastPreCheckoutId || '';
    }

    getLastPreCheckoutQuery() {
      return this.lastPreCheckoutQuery ? JSON.stringify(this.lastPreCheckoutQuery) : '';
    }

    async getUsernameById(args) {
      if (!this.shared.token) { this.lastError = 'Токен не задан'; console.error(this.lastError); return ''; }
      try {
        const response = await fetch(`https://api.telegram.org/bot${this.shared.token}/getChat?chat_id=${args.USERID}`);
        const data = await response.json();
        if (data.ok) return data.result.username || 'anonymous';
        this.lastError = data.description;
        console.error('Ошибка:', this.lastError);
        return '';
      } catch (error) { this.lastError = 'Ошибка сети: ' + error.message; console.error('Ошибка:', error); return ''; }
    }

    async getDisplayNameById(args) {
      if (!this.shared.token) { this.lastError = 'Токен не задан'; console.error(this.lastError); return ''; }
      try {
        const response = await fetch(`https://api.telegram.org/bot${this.shared.token}/getChatMember`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: this.shared.lastUpdate?.message?.chat?.id || args.USERID, user_id: args.USERID })
        });
        const data = await response.json();
        if (data.ok) return data.result.user.first_name + (data.result.user.last_name ? ' ' + data.result.user.last_name : '');
        this.lastError = data.description;
        console.error('Ошибка:', this.lastError);
        return '';
      } catch (error) { this.lastError = 'Ошибка сети: ' + error.message; console.error('Ошибка:', error); return ''; }
    }

    getLastError() { return this.lastError; }
  }

  Scratch.extensions.register(new TelegramExtras());
})(Scratch);
