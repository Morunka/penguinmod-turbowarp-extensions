//version 1.16

(function (Scratch) {
  'use strict';

  // Добавляем jQuery если его нет
  if (!window.jQuery) {
    const script = document.createElement('script');
    script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
    document.head.appendChild(script);
  }

  class TelegramClient {
    constructor() {
      this.shared = window.TelegramShared || {};
      this.lastError = '';
      this.isConnected = false;
      this.targetUrl = 'http://127.0.0.1:5000';
      this.corsProxy = 'http://127.0.0.1:8080';
      this.codeInput = null;
      this.codeDialog = null;
      
      // Проверяем сохраненное состояние авторизации
      const savedAuth = localStorage.getItem('telegramAuth');
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        if (authData.isConnected) {
          console.log('[DEBUG] Найдена сохраненная сессия');
          this.checkSavedSession();
        }
      }
    }

    async checkSavedSession() {
      try {
        const result = await this.makeRequest('/connect', 'GET');
        if (result.status === 'connected') {
          console.log('[DEBUG] Сохраненная сессия активна');
          this.isConnected = true;
        } else {
          console.log('[DEBUG] Сохраненная сессия истекла');
          localStorage.removeItem('telegramAuth');
        }
      } catch (error) {
        console.error('[DEBUG] Ошибка проверки сохраненной сессии:', error);
        localStorage.removeItem('telegramAuth');
      }
    }

    getInfo() {
      return {
        id: 'TelegramClient',
        name: 'Telegram Client',
        color1: '#00AADD',
        blocks: [
          { 
            opcode: 'connect', 
            blockType: Scratch.BlockType.COMMAND, 
            text: 'подключиться к Telegram с номером [PHONE]',
            arguments: {
              PHONE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: '+7XXXXXXXXXX'
              }
            }
          },
          { opcode: 'logout', blockType: Scratch.BlockType.COMMAND, text: 'выйти из Telegram' },
          { opcode: 'getAccountInfo', blockType: Scratch.BlockType.REPORTER, text: 'получить [INFO] пользователя [USERID]',
            arguments: {
              INFO: {
                type: Scratch.ArgumentType.STRING,
                menu: 'accountInfoMenu'
              },
              USERID: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 0
              }
            }
          },
          { opcode: 'getChatType', blockType: Scratch.BlockType.REPORTER, text: 'получить тип чата [CHATID]',
            arguments: {
              CHATID: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: 123456789
              }
            }
          },
          { opcode: 'sendMessage', blockType: Scratch.BlockType.COMMAND, text: 'отправить сообщение [TEXT] в чат [CHATID]', arguments: { TEXT: { type: Scratch.ArgumentType.STRING, defaultValue: 'Привет!' }, CHATID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 } } },
          { opcode: 'getMessageText', blockType: Scratch.BlockType.REPORTER, text: 'получить текст сообщения с ИД [MESSAGEID] в чате [CHATID]', arguments: { MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, CHATID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 } } },
          { opcode: 'getMessageDate', blockType: Scratch.BlockType.REPORTER, text: 'получить дату сообщения с ИД [MESSAGEID] в чате [CHATID]', arguments: { MESSAGEID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 1 }, CHATID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 } } },
          { opcode: 'getChatTitle', blockType: Scratch.BlockType.REPORTER, text: 'получить название чата [CHATID]', arguments: { CHATID: { type: Scratch.ArgumentType.NUMBER, defaultValue: 123456789 } } },
          { opcode: 'getLastError', blockType: Scratch.BlockType.REPORTER, text: 'последняя ошибка' }
        ],
        menus: {
          accountInfoMenu: {
            acceptReporters: false,
            items: ['имя', 'фамилия', 'юзернейм', 'номер телефона']
          }
        }
      };
    }

    formatUrl(path) {
      return `${this.targetUrl}${path}`;
    }

    async checkConnection() {
      if (!this.isConnected) {
        try {
          const result = await this.makeRequest('/connect', 'GET');
          if (result.status === 'connected') {
            this.isConnected = true;
            return true;
          }
        } catch (error) {
          console.error('[DEBUG] Ошибка проверки подключения:', error);
        }
        return false;
      }
      return true;
    }

    async makeRequest(path = '', method = 'GET', body = null) {
      return new Promise((resolve, reject) => {
        try {
          const url = this.formatUrl(path);
          console.log(`[DEBUG] Отправка ${method} запроса на ${url}`);
          console.log('[DEBUG] Тело запроса:', body);

          $.ajax({
            url: url,
            method: method,
            data: body ? JSON.stringify(body) : null,
            contentType: 'application/json',
            xhrFields: {
              withCredentials: true
            },
            crossDomain: true,
            success: function(data) {
              console.log('[DEBUG] Успешный ответ:', data);
              resolve(data);
            },
            error: function(xhr, status, error) {
              console.error('[DEBUG] Ошибка запроса:', status, error);
              console.error('[DEBUG] Ответ сервера:', xhr.responseText);
              console.error('[DEBUG] Статус:', xhr.status);
              
              let errorMessage = 'Ошибка подключения к серверу';
              try {
                const response = JSON.parse(xhr.responseText);
                errorMessage = response.detail || response.message || error;
              } catch (e) {
                errorMessage = xhr.responseText || error;
              }
              
              reject(new Error(errorMessage));
            }
          });
        } catch (error) {
          console.error('[DEBUG] Ошибка запроса:', error);
          reject(error);
        }
      });
    }

    async checkServer() {
      try {
        console.log('[DEBUG] Начало проверки сервера...');
        const data = await this.makeRequest('', 'GET');
        console.log('[DEBUG] Ответ от сервера:', data);
        return data.status === 'ok';
      } catch (error) {
        console.error('[DEBUG] Ошибка проверки сервера:', error);
        return false;
      }
    }

    createCodeDialog(is2FA = false, phone = null) {
      this.codeDialog = document.createElement('div');
      this.codeDialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        z-index: 1000;
      `;

      const title = document.createElement('h3');
      title.textContent = is2FA ? 'Введите пароль двухфакторной аутентификации' : 'Введите код подтверждения';
      title.style.marginBottom = '10px';
      this.codeDialog.appendChild(title);

      this.codeInput = document.createElement('input');
      this.codeInput.type = is2FA ? 'password' : 'text';
      this.codeInput.placeholder = is2FA ? 'Пароль 2FA' : 'Код из Telegram';
      this.codeInput.style.cssText = `
        width: 200px;
        padding: 5px;
        margin-bottom: 10px;
        display: block;
      `;
      this.codeDialog.appendChild(this.codeInput);

      const submitButton = document.createElement('button');
      submitButton.textContent = 'Подтвердить';
      submitButton.style.cssText = `
        padding: 5px 15px;
        background: #0088cc;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-right: 10px;
      `;
      submitButton.onclick = () => this.handleCodeSubmit(is2FA, phone);
      
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Отмена';
      cancelButton.style.cssText = `
        padding: 5px 15px;
        background: #cc0000;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      `;
      cancelButton.onclick = () => {
        console.log('[DEBUG] Отмена ввода кода');
        this.lastError = 'Ввод кода отменён пользователем';
        this.removeCodeDialog();
      };

      this.codeDialog.appendChild(submitButton);
      this.codeDialog.appendChild(cancelButton);

      document.body.appendChild(this.codeDialog);
    }

    removeCodeDialog() {
      if (this.codeDialog && this.codeDialog.parentNode) {
        this.codeDialog.parentNode.removeChild(this.codeDialog);
        this.codeDialog = null;
        this.codeInput = null;
      }
    }

    async handleCodeSubmit(is2FA = false, phone = null) {
      if (!this.codeInput || !this.codeInput.value) {
        console.log('[DEBUG] Пустой код');
        return;
      }

      const code = this.codeInput.value;
      console.log(`[DEBUG] Отправка ${is2FA ? 'пароля 2FA' : 'кода подтверждения'}`);

      try {
        const result = await this.makeRequest('/connect', 'POST', {
          code: is2FA ? null : code,
          password: is2FA ? code : null,
          phone: phone
        });

        if (result.status === 'connected') {
          console.log('[DEBUG] Успешное подключение');
          this.isConnected = true;
          localStorage.setItem('telegramAuth', JSON.stringify({ isConnected: true }));
          this.removeCodeDialog();
        } else if (result.status === '2fa_required') {
          console.log('[DEBUG] Требуется 2FA');
          this.removeCodeDialog();
          this.createCodeDialog(true, phone);
        } else {
          throw new Error('Неизвестный ответ от сервера');
        }
      } catch (error) {
        console.error('[DEBUG] Ошибка отправки кода:', error);
        this.lastError = error.message || 'Ошибка отправки кода';
        alert(this.lastError);
      }
    }

    async connect(args) {
      try {
        console.log('[DEBUG] Начало подключения...');
        
        // Проверяем формат номера телефона
        const phone = args.PHONE;
        if (!phone.match(/^\+\d{11,}$/)) {
          this.lastError = 'Неверный формат номера телефона. Используйте формат: +7XXXXXXXXXX';
          return;
        }

        // Проверяем доступность сервера
        if (!await this.checkServer()) {
          this.lastError = 'Ошибка подключения к серверу. Убедитесь, что сервер запущен';
          return;
        }

        console.log('[DEBUG] Отправка запроса на подключение с номером:', phone);
        const connectResult = await this.makeRequest(`/connect?phone=${encodeURIComponent(phone)}`, 'GET');
        
        if (connectResult.status === 'connected') {
          console.log('[DEBUG] Уже подключено');
          this.isConnected = true;
          localStorage.setItem('telegramAuth', JSON.stringify({ isConnected: true }));
          return;
        }

        if (connectResult.status === 'code_required') {
          return new Promise((resolve) => {
            this.createCodeDialog(false, phone);
            const checkInterval = setInterval(async () => {
              if (!this.codeDialog) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 100);
          });
        }

        this.lastError = 'Неизвестный ответ от сервера';
        
      } catch (error) {
        console.error('[DEBUG] Ошибка в процессе подключения:', error);
        this.lastError = error.message || 'Ошибка подключения';
      }
    }

    async sendMessage(args) {
      if (!await this.checkConnection()) {
        this.lastError = 'Не подключено к Telegram';
        return;
      }

      try {
        const result = await this.makeRequest('/send_message', 'POST', {
          chat_id: args.CHATID,
          text: args.TEXT
        });

        if (result.status !== 'success') {
          this.lastError = result.detail || 'Ошибка отправки сообщения';
        }
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        this.lastError = 'Ошибка подключения к серверу';
      }
    }

    async getMessageText(args) {
      if (!await this.checkConnection()) {
        this.lastError = 'Не подключено к Telegram';
        return '';
      }

      try {
        const result = await this.makeRequest('/get_message', 'POST', {
          chat_id: args.CHATID,
          message_id: args.MESSAGEID
        });

        if (result.status === 'success') {
          return result.text || '';
        }
        this.lastError = result.detail || 'Сообщение не найдено';
        return '';
      } catch (error) {
        console.error('Ошибка получения сообщения:', error);
        this.lastError = 'Ошибка подключения к серверу';
        return '';
      }
    }

    async getMessageDate(args) {
      if (!await this.checkConnection()) {
        this.lastError = 'Не подключено к Telegram';
        return '';
      }

      try {
        const result = await this.makeRequest('/get_message', 'POST', {
          chat_id: args.CHATID,
          message_id: args.MESSAGEID
        });

        if (result.status === 'success') {
          return result.date || '';
        }
        this.lastError = result.detail || 'Сообщение не найдено';
        return '';
      } catch (error) {
        console.error('Ошибка получения даты сообщения:', error);
        this.lastError = 'Ошибка подключения к серверу';
        return '';
      }
    }

    async getChatType(args) {
      if (!await this.checkConnection()) {
        this.lastError = 'Не подключено к Telegram';
        return '';
      }

      try {
        // Сначала пробуем получить информацию о чате
        const chatResult = await this.makeRequest('/get_chat_info', 'POST', {
          chat_id: args.CHATID
        });

        if (chatResult.status === 'success') {
          switch (chatResult.type) {
            case 'private':
              return 'личные сообщения';
            case 'group':
              return 'группа';
            case 'supergroup':
              return 'супергруппа';
            case 'channel':
              return 'канал';
            default:
              return chatResult.type || '';
          }
        }

        // Если чат не найден, пробуем получить информацию о пользователе
        const userResult = await this.makeRequest('/get_user_info', 'POST', {
          user_id: args.CHATID
        });

        if (userResult.status === 'success') {
          return 'личные сообщения';
        }

        this.lastError = 'Не удалось определить тип чата';
        return '';
      } catch (error) {
        // Пробуем получить информацию о пользователе в случае ошибки
        try {
          const userResult = await this.makeRequest('/get_user_info', 'POST', {
            user_id: args.CHATID
          });

          if (userResult.status === 'success') {
            return 'личные сообщения';
          }
        } catch (userError) {
          console.error('Ошибка получения информации о пользователе:', userError);
        }

        console.error('Ошибка получения типа чата:', error);
        this.lastError = 'Не удалось определить тип чата';
        return '';
      }
    }

    async getChatTitle(args) {
      if (!await this.checkConnection()) {
        this.lastError = 'Не подключено к Telegram';
        return '';
      }

      try {
        // Сначала пробуем получить информацию о чате
        const chatResult = await this.makeRequest('/get_chat_info', 'POST', {
          chat_id: args.CHATID
        });

        if (chatResult.status === 'success') {
          if (chatResult.type === 'private') {
            const name = [];
            if (chatResult.first_name) name.push(chatResult.first_name);
            if (chatResult.last_name) name.push(chatResult.last_name);
            const displayName = name.join(' ');
            return displayName || (chatResult.username ? '@' + chatResult.username : String(args.CHATID));
          } else {
            return chatResult.title || String(args.CHATID);
          }
        }

        // Если чат не найден, пробуем получить информацию о пользователе
        const userResult = await this.makeRequest('/get_user_info', 'POST', {
          user_id: args.CHATID
        });

        if (userResult.status === 'success') {
          const name = [];
          if (userResult.first_name) name.push(userResult.first_name);
          if (userResult.last_name) name.push(userResult.last_name);
          const displayName = name.join(' ');
          return displayName || (userResult.username ? '@' + userResult.username : String(args.CHATID));
        }

        // Если и это не сработало, пробуем получить базовую информацию о пользователе
        const basicUserResult = await this.makeRequest('/get_basic_user_info', 'POST', {
          user_id: args.CHATID
        });

        if (basicUserResult.status === 'success') {
          return basicUserResult.name || String(args.CHATID);
        }

        this.lastError = 'Чат или пользователь не найден';
        return '';
      } catch (error) {
        // Пробуем получить информацию о пользователе в случае ошибки
        try {
          const userResult = await this.makeRequest('/get_user_info', 'POST', {
            user_id: args.CHATID
          });

          if (userResult.status === 'success') {
            const name = [];
            if (userResult.first_name) name.push(userResult.first_name);
            if (userResult.last_name) name.push(userResult.last_name);
            const displayName = name.join(' ');
            return displayName || (userResult.username ? '@' + userResult.username : String(args.CHATID));
          }
        } catch (userError) {
          console.error('Ошибка получения информации о пользователе:', userError);
        }

        console.error('Ошибка получения названия:', error);
        this.lastError = 'Не удалось получить информацию о чате или пользователе';
        return '';
      }
    }

    async logout() {
      try {
        console.log('[DEBUG] Начало процесса выхода...');
        
        if (!this.isConnected) {
          console.log('[DEBUG] Уже отключено');
          return;
        }

        const result = await this.makeRequest('/logout', 'POST');
        
        if (result.status === 'success') {
          console.log('[DEBUG] Успешный выход');
          this.isConnected = false;
          localStorage.removeItem('telegramAuth');
          return;
        }
        
        throw new Error(result.detail || 'Неизвестная ошибка при выходе');
        
      } catch (error) {
        console.error('[DEBUG] Ошибка при выходе:', error);
        this.lastError = error.message || 'Ошибка при выходе';
        throw error;
      }
    }

    getLastError() {
      return this.lastError;
    }

    async getAccountInfo(args) {
      if (!await this.checkConnection()) {
        this.lastError = 'Не подключено к Telegram';
        return '';
      }

      try {
        const result = await this.makeRequest('/get_account_info', 'POST', {
          user_id: args.USERID
        });
        
        if (result.status === 'success') {
          switch (args.INFO) {
            case 'имя':
              return result.first_name || '';
            case 'фамилия':
              return result.last_name || '';
            case 'юзернейм':
              return result.username ? '@' + result.username : '';
            case 'номер телефона':
              return result.phone || '';
            default:
              return '';
          }
        }
        this.lastError = result.detail || 'Не удалось получить информацию о пользователе';
        return '';
      } catch (error) {
        console.error('Ошибка получения информации о пользователе:', error);
        this.lastError = 'Ошибка подключения к серверу';
        return '';
      }
    }
  }

  function waitForJQuery(callback) {
    if (window.jQuery) {
      callback();
    } else {
      setTimeout(() => waitForJQuery(callback), 100);
    }
  }

  waitForJQuery(() => {
    Scratch.extensions.register(new TelegramClient());
  });

})(Scratch); 
