import requests
from typing import Optional
from config import settings

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_email(to_email: str, subject: str, html_content: str, to_name: Optional[str] = None) -> bool:
    """Send transactional email via Brevo (Sendinblue).
    Requires BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME in env.
    """
    if not settings.BREVO_API_KEY:
        print("BREVO_API_KEY not configured")
        return False

    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }

    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [
            {
                "email": to_email,
                **({"name": to_name} if to_name else {}),
            }
        ],
        "subject": subject,
        "htmlContent": html_content,
    }

    try:
        resp = requests.post(BREVO_API_URL, headers=headers, json=payload, timeout=15)
        if resp.status_code in (200, 201, 202):
            return True
        print("Brevo error", resp.status_code, resp.text)
        return False
    except Exception as e:
        print("Brevo exception:", e)
        return False
