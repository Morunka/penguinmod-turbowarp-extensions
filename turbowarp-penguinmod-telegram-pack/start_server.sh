#!/bin/bash

echo "=== Запуск Telegram сервера ==="

# Переходим в директорию скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Текущая директория: $SCRIPT_DIR"
cd "$SCRIPT_DIR"

# Проверяем, существует ли виртуальное окружение
if [ ! -d "venv" ]; then
    echo "Создание виртуального окружения..."
    python -m venv venv
    if [ $? -ne 0 ]; then
        echo "Ошибка при создании виртуального окружения!"
        exit 1
    fi
    echo "Виртуальное окружение создано успешно"
else
    echo "Виртуальное окружение уже существует"
fi

# Активируем виртуальное окружение
echo "Активация виртуального окружения..."
source venv/bin/activate
if [ $? -ne 0 ]; then
    echo "Ошибка при активации виртуального окружения!"
    exit 1
fi
echo "Виртуальное окружение активировано"

# Проверяем установлены ли необходимые пакеты
echo "Проверка установленных пакетов..."
if ! pip show telethon fastapi uvicorn pydantic > /dev/null 2>&1; then
    echo "Установка необходимых пакетов..."
    pip install telethon fastapi uvicorn pydantic
    if [ $? -ne 0 ]; then
        echo "Ошибка при установке пакетов!"
        exit 1
    fi
    echo "Пакеты установлены успешно"
else
    echo "Все необходимые пакеты уже установлены"
fi

# Запускаем сервер
echo "Запуск сервера..."
echo "Сервер будет доступен по адресу: http://127.0.0.1:5000"
echo "Для остановки сервера нажмите Ctrl+C"
echo "================================="
python telegram_server.py 