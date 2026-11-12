"""
Kisan Rain Alert - Notification Dispatch Service
Handles automated Fast2SMS (India) and Gmail SMTP alerts with delivery logging, error handling, and test simulation.
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from config import Config
from database import Database

logger = logging.getLogger(__name__)

class NotificationService:
    """Dispatches multi-channel alerts (SMS & Email) to registered farmers."""

    @classmethod
    def dispatch_alert(
        cls, 
        alert: Dict[str, Any], 
        farm: Dict[str, Any], 
        recipient_phone: Optional[str] = None, 
        recipient_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send SMS and Email notifications according to farmer preferences and credentials.
        Returns a delivery status summary.
        """
        user_id = farm.get("user_id")
        prefs = Database.get_farmer_preferences(user_id) if user_id else {}

        results = {
            "sms": "disabled",
            "email": "disabled",
            "telegram": "disabled"
        }

        # 1. Mobile SMS Alerts - HARD DISABLED (Protects wallet against carrier deductions)
        results["sms"] = "disabled"

        # 2. Telegram Alerts - DISABLED (User selected Email-only delivery)
        results["telegram"] = "disabled"

        # 3. Gmail SMTP Email Alerts (100% Free, Instant Mobile Push via Gmail)
        target_email = recipient_email
        if not target_email or "@kisanrain.org" in target_email:
            target_email = Config.SMTP_EMAIL or os.getenv("DEFAULT_ALERT_EMAIL", "")

        if prefs.get("email_enabled", True) and target_email:
            results["email"] = cls.send_email(
                to_email=target_email,
                alert=alert,
                farm=farm,
                user_id=user_id
            )

        return results

    @classmethod
    def send_sms(cls, to_phone: str, message_text: str, alert_id: Optional[str] = None, user_id: Optional[str] = None) -> str:
        """Send SMS via Fast2SMS (India), with graceful fallback to simulation."""
        log_entry = {
            "alert_id": alert_id,
            "user_id": user_id,
            "channel": "sms",
            "recipient": to_phone,
            "delivery_status": "queued",
            "message": message_text
        }

        # 1. SMS Gateways (Fast2SMS / Twilio) - INACTIVE & HARD DISABLED
        # Existing integration code preserved below but completely inactive per system requirement.
        ENABLE_PAID_SMS = False

        if False and ENABLE_PAID_SMS and Config.FAST2SMS_API_KEY and not Config.SIMULATION_MODE:
            try:
                import requests
                digits_only = "".join(filter(str.isdigit, to_phone))
                phone_10 = digits_only[-10:] if len(digits_only) >= 10 else digits_only

                url = "https://www.fast2sms.com/dev/bulkV2"
                payload = {
                    "route": "q",
                    "message": message_text,
                    "language": "english",
                    "flash": 0,
                    "numbers": phone_10
                }
                headers = {
                    "authorization": Config.FAST2SMS_API_KEY,
                    "Content-Type": "application/json"
                }

                resp = requests.post(url, json=payload, headers=headers, timeout=12)
                res_data = resp.json() if resp else {}
                if res_data.get("return") is True:
                    req_id = res_data.get("request_id", "F2S-OK")
                    log_entry["delivery_status"] = "delivered"
                    log_entry["provider_message_id"] = str(req_id)
                    Database.log_notification(log_entry)
                    return "delivered"
            except Exception as f2s_err:
                logger.error(f"Fast2SMS request error to {to_phone}: {f2s_err}")

        # SMS is completely disabled. Never make SMS API calls or consume credits.
        logger.info(f"[SMS DISABLED] Notification to {to_phone} suppressed. Zero credits consumed.")
        log_entry["delivery_status"] = "disabled"
        log_entry["provider_message_id"] = f"DISABLED-SMS-{int(hash(to_phone + message_text)) & 0xffffffff:08x}"
        Database.log_notification(log_entry)
        return "disabled"

    @classmethod
    def send_email(cls, to_email: str, alert: Dict[str, Any], farm: Dict[str, Any], user_id: Optional[str] = None) -> str:
        """Send rainfall advisory email via Gmail SMTP, with graceful fallback."""
        log_entry = {
            "alert_id": alert.get("id"),
            "user_id": user_id,
            "channel": "email",
            "recipient": to_email,
            "delivery_status": "queued",
            "message": alert.get("alert_message", "")
        }

        has_smtp = (
            Config.SMTP_EMAIL and 
            Config.SMTP_PASSWORD and 
            "@" in Config.SMTP_EMAIL
        )

        if not has_smtp:
            logger.info(f"[SIMULATION] Gmail SMTP to {to_email} for farm {farm.get('farm_name')}")
            log_entry["delivery_status"] = "simulated"
            log_entry["provider_message_id"] = f"SIM-MAIL-{int(hash(to_email + farm.get('farm_name', ''))) & 0xffffffff:08x}"
            Database.log_notification(log_entry)
            return "simulated"

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"🌧️ Kisan Rain Alert: {alert.get('rainfall_category')} Detected at {farm.get('farm_name')}"
            msg["From"] = f"Kisan Rain Alert <{Config.SMTP_EMAIL}>"
            msg["To"] = to_email

            text_content = (
                f"KISAN RAIN ALERT - FARM ADVISORY\n\n"
                f"Farm Name: {farm.get('farm_name')}\n"
                f"Location: {farm.get('village', 'Farm Location')}\n"
                f"Category: {alert.get('rainfall_category')}\n"
                f"Precipitation Rate: {alert.get('precipitation_rate')} mm/h\n"
                f"Observation: {alert.get('alert_reason')}\n\n"
                f"Actionable Advice: Please protect harvested produce, tarp open threshing floors, and pause pesticide applications.\n\n"
                f"Track live radar at: http://localhost:5000/alerts.html?farm_id={farm.get('id')}\n"
            )

            html_content = f"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #070B14; color: #E2E8F0; padding: 24px; margin: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #0E1626; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.3); padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                        <h2 style="color: #FFFFFF; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Kisan Rain Alert</h2>
                    </div>
                    <div style="background-color: rgba(7,11,20,0.85); border-left: 4px solid #38BDF8; padding: 14px 18px; border-radius: 6px; margin-bottom: 20px;">
                        <span style="font-size: 13px; text-transform: uppercase; color: #38BDF8; letter-spacing: 0.05em; font-weight: bold;">Meteorological Alert</span>
                        <h3 style="margin: 4px 0; color: #FFFFFF;">{alert.get('rainfall_category')} ({alert.get('precipitation_rate')} mm/h)</h3>
                        <p style="margin: 4px 0 0; font-size: 14px; color: #E2E8F0;">{alert.get('alert_message')}</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 22px;">
                        <tr><td style="padding: 8px 0; color: #94A3B8;">Farm Plot:</td><td style="padding: 8px 0; font-weight: bold; color: #FFFFFF;">{farm.get('farm_name')}</td></tr>
                        <tr><td style="padding: 8px 0; color: #94A3B8;">Location:</td><td style="padding: 8px 0; color: #FFFFFF;">{farm.get('village', 'Farm Location')}</td></tr>
                        <tr><td style="padding: 8px 0; color: #94A3B8;">Rule Explanation:</td><td style="padding: 8px 0; color: #CBD5E1;">{alert.get('alert_reason')}</td></tr>
                    </table>
                    <div style="text-align: center; margin-top: 24px;">
                        <a href="http://localhost:5000/alerts.html?farm_id={farm.get('id')}" style="background-color: #2563EB; color: #FFFFFF; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 999px; display: inline-block;">
                            View Live Rain Radar →
                        </a>
                    </div>
                    <p style="font-size: 12px; color: #64748B; text-align: center; margin-top: 28px;">
                        Kisan Rain Alert • Location-Specific Early Warning System for Indian Farmers
                    </p>
                </div>
            </body>
            </html>
            """

            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            clean_password = (Config.SMTP_PASSWORD or "").replace(" ", "").strip()
            with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=12) as server:
                server.starttls()
                server.login(Config.SMTP_EMAIL, clean_password)
                server.send_message(msg)

            log_entry["delivery_status"] = "delivered"
            log_entry["provider_message_id"] = f"SMTP-{int(hash(to_email)) & 0xffffffff:08x}"
            Database.log_notification(log_entry)
            logger.info(f"Gmail SMTP alert sent to {to_email}")
            return "delivered"
        except Exception as e:
            logger.error(f"Gmail SMTP failed for {to_email}: {e}")
            log_entry["delivery_status"] = "failed"
            log_entry["error_message"] = str(e)
            Database.log_notification(log_entry)
            return f"failed: {e}"

    @classmethod
    def send_telegram(cls, alert: Dict[str, Any], farm: Dict[str, Any], user_id: Optional[str] = None) -> str:
        """Send instant mobile push notification via Telegram Bot API (100% Free)."""
        log_entry = {
            "alert_id": alert.get("id"),
            "user_id": user_id,
            "channel": "telegram",
            "recipient": Config.TELEGRAM_CHAT_ID,
            "delivery_status": "queued",
            "message": alert.get("alert_message", "")
        }

        if not (Config.TELEGRAM_BOT_TOKEN and Config.TELEGRAM_CHAT_ID):
            log_entry["delivery_status"] = "simulated"
            log_entry["provider_message_id"] = "SIM-TG-UNCONFIGURED"
            Database.log_notification(log_entry)
            return "simulated"

        try:
            import requests
            bot_token = Config.TELEGRAM_BOT_TOKEN.strip()
            chat_id = Config.TELEGRAM_CHAT_ID.strip()
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

            farm_name = farm.get("farm_name", "Farm Plot")
            village = farm.get("village", "Farm Location")
            category = alert.get("rainfall_category", "Rainfall Alert")
            rate = alert.get("precipitation_rate", 0)
            reason = alert.get("alert_reason", "")
            action = "Please protect harvested produce, tarp open threshing floors, and pause pesticide applications."

            text = (
                f"🚨 <b>KISAN RAIN ALERT</b> 🌧️\n\n"
                f"📍 <b>Farm Plot:</b> {farm_name} ({village})\n"
                f"⚡ <b>IMD Category:</b> {category} ({rate} mm/h)\n"
                f"📋 <b>Observation:</b> {reason}\n\n"
                f"💡 <b>Farmer Advisory:</b> {action}\n\n"
                f"🌾 <i>Kisan Rain Alert • Free Location-Specific Weather Alert</i>"
            )

            payload = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML"
            }

            resp = requests.post(url, json=payload, timeout=12)
            try:
                res_data = resp.json()
            except Exception:
                res_data = {}

            if res_data.get("ok"):
                msg_id = res_data.get("result", {}).get("message_id", "TG-OK")
                log_entry["delivery_status"] = "delivered"
                log_entry["provider_message_id"] = str(msg_id)
                Database.log_notification(log_entry)
                logger.info(f"Telegram alert sent successfully to chat {chat_id}. Message ID: {msg_id}")
                return "delivered"
            else:
                err_desc = res_data.get("description", f"HTTP {resp.status_code}")
                logger.error(f"Telegram dispatch failed: {err_desc}")
                log_entry["delivery_status"] = "failed"
                log_entry["error_message"] = err_desc
                Database.log_notification(log_entry)
                return f"failed: {err_desc}"
        except Exception as e:
            logger.error(f"Telegram exception: {e}")
            log_entry["delivery_status"] = "failed"
            log_entry["error_message"] = str(e)
            Database.log_notification(log_entry)
            return f"failed: {e}"


# Singleton notification service
notification_service = NotificationService()

