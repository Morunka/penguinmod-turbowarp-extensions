from telethon import TelegramClient
from telethon.sessions import StringSession
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timedelta
import uvicorn
import asyncio
import json
import os
import pytz
from pyrogram import Client, filters
from pyrogram.types import User, Chat

app = FastAPI()

# Настройка CORS более детально
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Конфигурация
API_ID = "your_api_id"
API_HASH = "your_api_hash"

# Глобальные переменные
client = None
session_string = None
auth_step = "code"  # Может быть "code" или "2fa"
current_phone = None

# Путь к файлу с сессиями
SESSIONS_FILE = 'telegram_sessions.json'
session_file = "telegram_session.json"

def load_sessions():
    """Загружает сохраненные сессии из файла"""
    if os.path.exists(SESSIONS_FILE):
        try:
            with open(SESSIONS_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_session(phone, session):
    """Сохраняет сессию для номера телефона"""
    sessions = load_sessions()
    sessions[phone] = session
    with open(SESSIONS_FILE, 'w') as f:
        json.dump(sessions, f)

def get_saved_session(phone):
    """Получает сохраненную сессию для номера телефона"""
    sessions = load_sessions()
    return sessions.get(phone)

def format_date_with_timezone(date):
    """Форматирует дату с учетом часового пояса +3"""
    if not date:
        return ""
    # Преобразуем в московское время (UTC+3)
    moscow_tz = pytz.timezone('Europe/Moscow')
    if isinstance(date, int):
        date = datetime.fromtimestamp(date)
    moscow_date = date.astimezone(moscow_tz)
    return moscow_date.strftime("%d.%m.%Y %H:%M")

# Модели данных
class MessageRequest(BaseModel):
    chat_id: int = Field(default=0)
    text: Optional[str] = Field(default=None)
    message_id: Optional[int] = Field(default=None)
    code: Optional[str] = Field(default=None)
    password: Optional[str] = Field(default=None)
    phone: Optional[str] = Field(default=None)

@app.get("/")
async def root():
    print("[DEBUG] Получен запрос к корневому пути")
    return {"status": "ok", "message": "Telegram API Server is running"}

async def init_client(phone=None):
    global client, session_string, auth_step, current_phone
    try:
        if not client and phone:
            print("[DEBUG] Создание клиента Telegram...")
            # Пробуем загрузить сохраненную сессию
            saved_session = get_saved_session(phone)
            if saved_session:
                print("[DEBUG] Найдена сохраненная сессия")
                session_string = saved_session
            
            client = TelegramClient(StringSession(session_string), API_ID, API_HASH)
            current_phone = phone
            print("[DEBUG] Подключение к Telegram...")
            await client.connect()
            
            if not await client.is_user_authorized():
                if saved_session:
                    print("[DEBUG] Сохраненная сессия недействительна")
                    session_string = None
                print("[DEBUG] Отправка кода авторизации...")
                await client.send_code_request(phone)
                auth_step = "code"
                return False
            print("[DEBUG] Клиент уже авторизован")
            return True
        return bool(client and await client.is_user_authorized())
    except Exception as e:
        print(f"[DEBUG] Ошибка при инициализации клиента: {str(e)}")
        return False

@app.options("/{path:path}")
async def options_handler(request: Request):
    """Обработчик для всех OPTIONS запросов"""
    return JSONResponse(
        content={},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        }
    )

@app.get("/connect")
async def connect_get(phone: str = None):
    global client
    print(f"[DEBUG] GET /connect с номером: {phone}")
    
    if client and client.is_connected:
        print("[DEBUG] Клиент уже подключен")
        return {"status": "connected"}
        
    try:
        session_string = load_session()
        if session_string:
            print("[DEBUG] Пробуем подключиться с сохраненной сессией")
            client = TelegramClient(StringSession(session_string), API_ID, API_HASH)
            await client.connect()
            return {"status": "connected"}
    except Exception as e:
        print(f"[DEBUG] Ошибка подключения с сохраненной сессией: {e}")
        client = None

    if not phone:
        return {"status": "phone_required"}

    try:
        print(f"[DEBUG] Создаем нового клиента для номера {phone}")
        client = TelegramClient(API_ID, API_HASH)
        await client.connect()
        code = await client.send_code_request(phone)
        print("[DEBUG] Код отправлен")
        return {"status": "code_required"}
    except Exception as e:
        print(f"[DEBUG] Ошибка отправки кода: {e}")
        return JSONResponse(status_code=400, content={"status": "error", "detail": str(e)})

@app.post("/connect")
async def connect_post(request: Request):
    try:
        data = await request.json()
        code = data.get('code', '')
        password = data.get('password', '')
        phone = data.get('phone', '')
        print(f"[DEBUG] POST /connect с данными: code={code}, password={password}, phone={phone}")

        if not client:
            return JSONResponse(status_code=400, content={"status": "error", "detail": "Сначала выполните GET /connect"})

        try:
            if password:
                print("[DEBUG] Пробуем войти с паролем 2FA")
                await client.sign_in(phone, password)
            elif code:
                print("[DEBUG] Пробуем войти с кодом")
                await client.sign_in(phone, code)
            
            session_string = client.session.save()
            save_session(phone, session_string)
            return {"status": "connected"}
        except Exception as e:
            print(f"[DEBUG] Ошибка входа: {e}")
            if "2FA" in str(e):
                return {"status": "2fa_required"}
            return JSONResponse(status_code=400, content={"status": "error", "detail": str(e)})
            
    except Exception as e:
        print(f"[DEBUG] Общая ошибка в POST /connect: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "detail": str(e)})

@app.post("/send_message")
async def send_message(request: Request):
    try:
        data = await request.json()
        chat_id = data.get('chat_id')
        text = data.get('text', '')
        print(f"[DEBUG] Отправка сообщения в чат {chat_id}: {text}")

        if not client or not client.is_connected():
            return JSONResponse(status_code=400, content={"status": "error", "detail": "Не подключено к Telegram"})

        try:
            await client.send_message(chat_id, text)
            return {"status": "success"}
        except Exception as e:
            print(f"[DEBUG] Ошибка отправки сообщения: {e}")
            return JSONResponse(status_code=400, content={"status": "error", "detail": str(e)})
            
    except Exception as e:
        print(f"[DEBUG] Общая ошибка в send_message: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "detail": str(e)})

@app.post("/get_message")
async def get_message(request: Request):
    try:
        data = await request.json()
        chat_id = data.get('chat_id')
        message_id = data.get('message_id')
        print(f"[DEBUG] Получение сообщения {message_id} из чата {chat_id}")

        if not client or not client.is_connected():
            return JSONResponse(status_code=400, content={"status": "error", "detail": "Не подключено к Telegram"})

        try:
            message = await client.get_messages(chat_id, message_id)
            if message and message.text:
                return {
                    "status": "success",
                    "text": message.text,
                    "date": format_date_with_timezone(message.date)
                }
            return JSONResponse(status_code=404, content={"status": "error", "detail": "Сообщение не найдено"})
        except Exception as e:
            print(f"[DEBUG] Ошибка получения сообщения: {e}")
            return JSONResponse(status_code=400, content={"status": "error", "detail": str(e)})
            
    except Exception as e:
        print(f"[DEBUG] Общая ошибка в get_message: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "detail": str(e)})

@app.post("/get_chat_title")
async def get_chat_title(request: MessageRequest):
    try:
        if not await init_client():
            raise HTTPException(status_code=401, detail="Не авторизован")
        
        chat = await client.get_entity(request.chat_id)
        return {
            "status": "success",
            "title": chat.title
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/logout")
async def logout():
    global client, session_string, auth_step
    try:
        if client:
            print("[DEBUG] Выход из аккаунта...")
            await client.log_out()
            client = None
            session_string = None
            auth_step = "code"
            if os.path.exists(session_file):
                os.remove(session_file)
            print("[DEBUG] Успешный выход")
            return {"status": "success"}
        return {"status": "success", "detail": "Уже не в системе"}
    except Exception as e:
        print(f"[DEBUG] Ошибка при выходе: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/get_chat_info")
async def get_chat_info(request: Request):
    try:
        data = await request.json()
        chat_id = data.get('chat_id')
        print(f"[DEBUG] Получение информации о чате {chat_id}")
        
        if not client or not client.is_connected():
            return JSONResponse(status_code=400, content={"status": "error", "detail": "Не подключено к Telegram"})

        try:
            chat = await client.get_chat(chat_id)
            print(f"[DEBUG] Получен чат: {chat}")
            
            if isinstance(chat, User):
                return JSONResponse(content={
                    "status": "success",
                    "type": "private",
                    "first_name": chat.first_name,
                    "last_name": chat.last_name if chat.last_name else "",
                    "username": chat.username if chat.username else ""
                })
            else:
                return JSONResponse(content={
                    "status": "success",
                    "type": chat.type,
                    "title": chat.title
                })
                
        except ValueError as e:
            print(f"[DEBUG] Ошибка получения чата: {e}")
            try:
                user = await client.get_users(chat_id)
                print(f"[DEBUG] Получен пользователь: {user}")
                return JSONResponse(content={
                    "status": "success",
                    "type": "private",
                    "first_name": user.first_name,
                    "last_name": user.last_name if user.last_name else "",
                    "username": user.username if user.username else ""
                })
            except Exception as e:
                print(f"[DEBUG] Ошибка получения пользователя: {e}")
                return JSONResponse(status_code=404, content={
                    "status": "error",
                    "detail": "Чат или пользователь не найден"
                })
                
    except Exception as e:
        print(f"[DEBUG] Общая ошибка в get_chat_info: {e}")
        return JSONResponse(status_code=500, content={
            "status": "error",
            "detail": str(e)
        })

@app.post("/get_user_info")
async def get_user_info(request: Request):
    try:
        data = await request.json()
        user_id = data.get('user_id')
        print(f"[DEBUG] Получение информации о пользователе {user_id}")
        
        if not client or not client.is_connected():
            return JSONResponse(status_code=400, content={"status": "error", "detail": "Не подключено к Telegram"})

        try:
            user = await client.get_users(user_id)
            print(f"[DEBUG] Получен пользователь: {user}")
            return JSONResponse(content={
                "status": "success",
                "first_name": user.first_name,
                "last_name": user.last_name if user.last_name else "",
                "username": user.username if user.username else ""
            })
        except Exception as e:
            print(f"[DEBUG] Ошибка получения пользователя: {e}")
            return JSONResponse(status_code=404, content={
                "status": "error",
                "detail": "Пользователь не найден"
            })
                
    except Exception as e:
        print(f"[DEBUG] Общая ошибка в get_user_info: {e}")
        return JSONResponse(status_code=500, content={
            "status": "error",
            "detail": str(e)
        })

def save_session():
    if client and client.is_connected:
        try:
            session_string = client.export_session_string()
            with open(session_file, "w") as f:
                json.dump({"session_string": session_string}, f)
            print("[DEBUG] Сессия сохранена")
        except Exception as e:
            print(f"[DEBUG] Ошибка сохранения сессии: {e}")

def load_session():
    try:
        if os.path.exists(session_file):
            with open(session_file, "r") as f:
                data = json.load(f)
                return data.get("session_string")
    except Exception as e:
        print(f"[DEBUG] Ошибка загрузки сессии: {e}")
    return None

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000) 