"""
Send live test weather alert to farmer via Telegram Bot.
"""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
chat_id = os.getenv("TELEGRAM_CHAT_ID", "").strip()

if not bot_token or not chat_id:
    print(f"Error: Missing credentials in .env. Bot token: {bool(bot_token)}, Chat ID: {bool(chat_id)}")
    exit(1)

url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

text = (
    "🚨 <b>KISAN RAIN ALERT</b> 🌧️\n\n"
    "📍 <b>Farm Plot:</b> Golden Fields (Samrala, Ludhiana)\n"
    "⚡ <b>IMD Status:</b> Moderate Rain (4.8 mm/h)\n"
    "📋 <b>Observation:</b> Heavy rain clouds approaching within next 30-45 minutes.\n\n"
    "💡 <b>Farmer Action Advisory:</b>\n"
    "• Protect harvested wheat / grains immediately\n"
    "• Cover open threshing floors with tarpaulin sheets\n"
    "• Postpone planned pesticide/fertilizer spray\n\n"
    "🌾 <i>Kisan Rain Alert • Real-time Free Weather Alert System</i>"
)

payload = {
    "chat_id": chat_id,
    "text": text,
    "parse_mode": "HTML"
}

try:
    resp = requests.post(url, json=payload, timeout=15)
    data = resp.json()
    if data.get("ok"):
        print("SUCCESS: Telegram alert delivered to your phone!")
        print(f"Message ID: {data.get('result', {}).get('message_id')}")
    else:
        print("FAILED to send message:")
        print(data)
except Exception as e:
    print(f"ERROR: {e}")

