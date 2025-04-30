#!/bin/bash

# Проверяем, запущен ли уже CORS Anywhere
if pgrep -f "node server.js" > /dev/null; then
    echo "CORS Anywhere уже запущен"
    exit 0
fi

# Проверяем, установлен ли Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js не установлен. Установите Node.js и попробуйте снова."
    exit 1
fi

# Проверяем, установлен ли cors-anywhere
if [ ! -d "node_modules/cors-anywhere" ]; then
    echo "Установка cors-anywhere..."
    npm install cors-anywhere
fi

# Запускаем CORS Anywhere
echo "Запуск CORS Anywhere..."
node server.js &

# Проверяем, запустился ли сервер
sleep 2
if pgrep -f "node server.js" > /dev/null; then
    echo "CORS Anywhere успешно запущен на http://127.0.0.1:8080"
else
    echo "Ошибка запуска CORS Anywhere"
    exit 1
fi 