"""Quick diagnostic script to test SMTP and check user existence."""
import os
from dotenv import load_dotenv
load_dotenv()

print("=" * 50)
print("BizManager - Email Diagnostic Test")
print("=" * 50)

# 1. Check SMTP config
smtp_user = os.environ.get('SMTP_USER', '')
smtp_pass = os.environ.get('SMTP_PASS', '')
smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
smtp_port = int(os.environ.get('SMTP_PORT', '587'))

print(f"\n[CONFIG]")
print(f"  SMTP_HOST: {smtp_host}")
print(f"  SMTP_PORT: {smtp_port}")
print(f"  SMTP_USER: {smtp_user}")
print(f"  SMTP_PASS: {'*' * len(smtp_pass)} ({len(smtp_pass)} chars)")

if not smtp_user or not smtp_pass:
    print("\n[FAIL] SMTP_USER or SMTP_PASS is empty! Check your .env file.")
else:
    # 2. Test SMTP connection
    print(f"\n[SMTP TEST] Connecting to {smtp_host}:{smtp_port}...")
    try:
        import smtplib
        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        print("[OK] SMTP login successful!")
        server.quit()
    except Exception as e:
        print(f"[FAIL] SMTP login FAILED: {e}")

# 3. Check if user exists in database
print(f"\n[DATABASE CHECK]")
try:
    from database import SessionLocal
    import models
    db = SessionLocal()
    
    test_email = "akhilpathakota@gmail.com"
    user = db.query(models.User).filter(models.User.email == test_email).first()
    if user:
        print(f"  [OK] User '{test_email}' found (name: {user.name}, role: {user.role})")
    else:
        print(f"  [FAIL] User '{test_email}' NOT FOUND in database!")
        print(f"  >> This is why no email was sent. The forgot-password endpoint")
        print(f"  >> returns a generic success message but skips sending when user doesn't exist.")
    
    # Show all registered users
    all_users = db.query(models.User).all()
    print(f"\n  All registered users ({len(all_users)}):")
    for u in all_users:
        print(f"    - {u.email} (name: {u.name}, role: {u.role})")
    
    db.close()
except Exception as e:
    print(f"  [FAIL] Database error: {e}")

print("\n" + "=" * 50)
