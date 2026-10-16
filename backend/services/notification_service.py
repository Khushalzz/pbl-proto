import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime
from typing import Optional
from config import DATA_DIR, SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL
from db import get_collection

EMAIL_LOG_FILE = DATA_DIR / "emails.json"

def _append_email_log(email_record: dict):
    try:
        if EMAIL_LOG_FILE.exists():
            with open(EMAIL_LOG_FILE, "r", encoding="utf-8") as f:
                logs = json.load(f)
        else:
            logs = []
        logs.insert(0, email_record)
        with open(EMAIL_LOG_FILE, "w", encoding="utf-8") as f:
            json.dump(logs[:100], f, indent=2)
    except Exception as e:
        print(f"[Notification] Failed to log simulated email: {e}")

def send_notification(
    recipient_id: str,
    recipient_email: str,
    title: str,
    message: str,
    notification_type: str = "status_change",
    link: Optional[str] = None
):
    # 1. In-App Notification (Database)
    notifications_col = get_collection("notifications")
    now_iso = datetime.utcnow().isoformat()
    doc = {
        "recipient_id": recipient_id,
        "recipient_email": recipient_email,
        "title": title,
        "message": message,
        "type": notification_type,
        "read": False,
        "created_at": now_iso,
        "link": link
    }
    notifications_col.insert_one(doc)

    # 2. Email Notification (Simulated + real SMTP if configured)
    email_entry = {
        "to": recipient_email,
        "from": SMTP_FROM_EMAIL,
        "subject": f"[CivicLens Alert] {title}",
        "body": message,
        "timestamp": now_iso,
        "status": "Delivered (Simulated)"
    }

    if SMTP_SERVER and SMTP_USERNAME and SMTP_PASSWORD:
        try:
            msg = MIMEMultipart()
            msg["From"] = SMTP_FROM_EMAIL
            msg["To"] = recipient_email
            msg["Subject"] = f"[CivicLens Alert] {title}"
            msg.attach(MIMEText(message, "plain"))
            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT, timeout=5) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
            email_entry["status"] = "Sent via SMTP"
        except Exception as e:
            email_entry["status"] = f"SMTP Failed ({str(e)}) - Logged as Simulated"

    _append_email_log(email_entry)
    print(f"[Notification] Sent '{title}' to {recipient_email}")

def get_recent_emails():
    if not EMAIL_LOG_FILE.exists():
        return []
    try:
        with open(EMAIL_LOG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []
