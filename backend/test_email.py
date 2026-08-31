from email_service import send_test_email
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_email_setup():
    print("🧪 Testing Email Configuration...\n")
    
    # Check if variables are loaded
    sender_email = os.getenv('SENDER_EMAIL')
    sender_password = os.getenv('SENDER_APP_PASSWORD')
    
    print(f"📧 Sender Email: {sender_email}")
    print(f"🔑 App Password: {'*' * len(sender_password) if sender_password else 'NOT SET'}")
    print()
    
    # Validate configuration
    if not sender_email:
        print("❌ ERROR: SENDER_EMAIL is not set in .env file")
        print("\n📝 Create a .env file with:")
        print("SENDER_EMAIL=your-email@gmail.com")
        print("SENDER_APP_PASSWORD=your-16-digit-app-password")
        return
    
    if not sender_password:
        print("❌ ERROR: SENDER_APP_PASSWORD is not set in .env file")
        print("\n🔐 To get App Password:")
        print("1. Go to https://myaccount.google.com/apppasswords")
        print("2. Generate a new App Password")
        print("3. Add it to .env: SENDER_APP_PASSWORD=abcdefghijklmnop")
        return
    
    # Test with your email
    test_recipient = input("✅ Configuration looks good! Enter email to test: ")
    
    if not test_recipient:
        print("❌ No email entered. Exiting.")
        return
    
    print(f"\n📤 Sending test email to {test_recipient}...")
    result = send_test_email(test_recipient)
    
    if result:
        print("\n✅ SUCCESS! Check your inbox (and spam folder).")
    else:
        print("\n❌ FAILED! Check the error message above.")
        print("\n🔧 Troubleshooting Checklist:")
        print("1. ✓ 2FA enabled on Gmail?")
        print("2. ✓ App Password generated (not regular password)?")
        print("3. ✓ .env file in same directory as this script?")
        print("4. ✓ No quotes or spaces in .env values?")
        print("5. ✓ Using correct Gmail account?")

if __name__ == "__main__":
    test_email_setup()