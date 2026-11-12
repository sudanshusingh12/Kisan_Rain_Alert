"""
Send live test email alert via Gmail SMTP.
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

host = os.getenv("SMTP_HOST", "smtp.gmail.com")
port = int(os.getenv("SMTP_PORT", "587"))
email = os.getenv("SMTP_EMAIL", "").strip()
password = os.getenv("SMTP_PASSWORD", "").replace(" ", "").strip()

if not email or not password:
    print("Error: SMTP_EMAIL or SMTP_PASSWORD not set in .env")
    exit(1)

msg = MIMEMultipart("alternative")
msg["Subject"] = "🌧️ Kisan Rain Alert: Email Notifications Active"
msg["From"] = f"Kisan Rain Alert <{email}>"
msg["To"] = email

text = (
    "KISAN RAIN ALERT - LIVE ADVISORY\n\n"
    "Status: Email-Only Notifications Configured\n"
    "Cost: ₹0.00 (Free & Unlimited)\n"
    "Mobile SMS: Completely Disabled\n\n"
    "You will now receive all unseasonal rainfall advisories and farm protection alerts directly in this inbox."
)

html = f"""
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background-color: #0B132B; color: #E2E8F0; padding: 20px;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #1C2541; border-radius: 12px; border: 1px solid #3A86FF; padding: 24px;">
    <h2 style="color: #60A5FA; margin-top: 0;">🌧️ Kisan Rain Alert — Live Active</h2>
    <div style="background-color: #0B132B; border-left: 4px solid #10B981; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
      <span style="color: #10B981; font-weight: bold;">CHANNEL: EMAIL-ONLY ALERTS (FREE)</span>
      <p style="margin: 6px 0 0; color: #FFFFFF; font-size: 15px;">
        All farm rainfall warnings and Doppler radar alerts are now routed exclusively to your Gmail inbox.
      </p>
    </div>
    <ul style="color: #CBD5E1; line-height: 1.8; font-size: 14px;">
      <li><strong>Mobile SMS:</strong> Completely stopped (₹0 wallet cost)</li>
      <li><strong>Recipient:</strong> {email}</li>
      <li><strong>Advisory Type:</strong> IMD Rainfall Intensity & Harvesting Action Tips</li>
    </ul>
    <p style="font-size: 12px; color: #64748B; text-align: center; margin-top: 24px;">
      Kisan Rain Alert • Location-Specific Early Warning System for Indian Farmers
    </p>
  </div>
</body>
</html>
"""

msg.attach(MIMEText(text, "plain"))
msg.attach(MIMEText(html, "html"))

try:
    with smtplib.SMTP(host, port, timeout=15) as server:
        server.starttls()
        server.login(email, password)
        server.send_message(msg)
    print("SUCCESS: Live test email successfully sent to " + email)
except Exception as e:
    print("FAILED to send email: " + str(e))

