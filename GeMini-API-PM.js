// Разработчик: By ROlil Studio

(function (Scratch) {
    "use strict";

    if (!Scratch.extensions.unsandboxed) {
        throw new Error("Расширение Gemini API должно работать без песочницы!");
    }

    const menuIconURI = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiB4MT0iMCIgeTE9IjAiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzAwRkYwMCIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0ZGRkYwMCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjYwIiBmaWxsPSJ1cmwoI2dyYWQpIi8+PHRleHQgeD0iNTAiIHk9IjgwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNTAiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSIjMDAwMDAwIj5HPC90ZXh0Pjwvc3ZnPg==";

    class GeminiExtension {
        constructor() {
            this.history = [];
            this.initialized = false;
            this.apiKey = "";
        }

        getInfo() {
            return {
                id: "geminiAPIs",
 name: "Gemini API",
 color1: "#00CC00",
color2: "#FFFF99",
color3: "#FFD700",
menuIconURI: menuIconURI
 blocks: [
     {
         opcode: "sendRequest",
 blockType: Scratch.BlockType.REPORTER,
 text: "отправить запрос Gemini API: [REQUEST]",
 arguments: {
     REQUEST: {
         type: Scratch.ArgumentType.STRING,
 defaultValue: "Привет!"
     }
 }
     },
 {
     opcode: "forgetContext",
     blockType: Scratch.BlockType.COMMAND,
     text: "забыть контекст Gemini"
 },
 {
     opcode: "setPrompt",
     blockType: Scratch.BlockType.COMMAND,
     text: "установить промпт: [PROMPT]",
     arguments: {
         PROMPT: {
             type: Scratch.ArgumentType.STRING,
             defaultValue: "Ваш промпт"
         }
     }
 },
 {
     opcode: "setApiKey",
     blockType: Scratch.BlockType.COMMAND,
     text: "установить API-токен: [API_KEY]",
     arguments: {
         API_KEY: {
             type: Scratch.ArgumentType.STRING,
             defaultValue: "Вставьте ваш токен сюда"
         }
     }
 },
 {
     opcode: "getContext",
     blockType: Scratch.BlockType.REPORTER,
     text: "получить запомненный контекст"
 }
 ],
 menus: {}
            };
        }

        sendRequest(args) {
            if (!this.apiKey) {
                return "API-токен не установлен. Используйте 'установить API-токен'";
            }
            if (!this.initialized) {
                return "Промпт не установлен. Используйте 'установить промпт'";
            }

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

            this.history.push({
                role: "user",
                parts: [{ text: args.REQUEST }]
            });

            const requestBody = {
                contents: this.history
            };

            return fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error("Ошибка запроса API: " + response.status + " - " + text);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log("Ответ Gemini:", data);
                if (
                    data &&
                    data.candidates &&
                    data.candidates.length > 0 &&
                    data.candidates[0].content &&
                    data.candidates[0].content.parts &&
                    data.candidates[0].content.parts[0].text
                ) {
                    const responseText = data.candidates[0].content.parts[0].text;
                    this.history.push({
                        role: "model",
                        parts: [{ text: responseText }]
                    });
                    return responseText;
                }
                return "Нет ответа от Gemini";
            })
            .catch(error => {
                console.error("Ошибка Gemini API:", error);
                return "Ошибка: " + error.message;
            });
        }

        forgetContext() {
            this.history = [];
            this.initialized = false;
            console.log("Контекст Gemini сброшен");
        }

        setPrompt(args) {
            this.history = [];
            this.history.push({
                role: "user",
                parts: [{ text: args.PROMPT }]
            });
            this.initialized = true;
            console.log("Промпт установлен");
        }

        setApiKey(args) {
            this.apiKey = args.API_KEY;
            console.log("API-токен установлен");
        }

        getContext() {
            if (this.history.length === 0) {
                return "Контекст пуст";
            }
            return this.history
            .map(entry => `${entry.role}: ${entry.parts[0].text}`)
            .join("\n");
        }
    }

    Scratch.extensions.register(new GeminiExtension());
})(Scratch);
