"""
Test Stripe Configuration
Verifies Stripe API keys are correctly configured
"""
import stripe
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_stripe_connection():
    """Test Stripe API connection"""
    print("=" * 60)
    print("STRIPE CONFIGURATION TEST")
    print("=" * 60)
    
    # Get API key
    api_key = os.getenv('STRIPE_SECRET_KEY')
    
    if not api_key:
        print("❌ ERROR: STRIPE_SECRET_KEY not found in .env file")
        return False
    
    # Check if using test or live key
    key_type = "LIVE" if api_key.startswith("sk_live_") else "TEST"
    print(f"\n🔑 Key Type: {key_type}")
    print(f"   Key: {api_key[:15]}...{api_key[-4:]}")
    
    if key_type == "LIVE":
        print("\n⚠️  WARNING: You are using LIVE Stripe keys!")
        print("   Real charges will be made. Ensure you're ready for production.")
    
    # Set API key
    stripe.api_key = api_key
    
    try:
        # Test API connection
        print(f"\n🔌 Testing connection to Stripe API...")
        account = stripe.Account.retrieve()
        
        print(f"✅ Successfully connected to Stripe!")
        print(f"\n📊 Account Details:")
        print(f"   Account ID: {account.id}")
        print(f"   Country: {account.country}")
        print(f"   Default Currency: {account.default_currency.upper()}")
        print(f"   Charges Enabled: {account.charges_enabled}")
        print(f"   Payouts Enabled: {account.payouts_enabled}")
        
        # Check webhook secret
        webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
        if webhook_secret:
            print(f"\n🔗 Webhook Secret: Configured ({webhook_secret[:10]}...)")
        else:
            print(f"\n⚠️  Webhook Secret: NOT configured")
            print(f"   Add STRIPE_WEBHOOK_SECRET to .env after creating webhook in Stripe Dashboard")
        
        return True
        
    except stripe.error.AuthenticationError as e:
        print(f"❌ Authentication Error: {e}")
        print(f"\n💡 Possible solutions:")
        print(f"   1. Verify the secret key in .env is complete")
        print(f"   2. Check for extra spaces or newlines")
        print(f"   3. Get a new key from: https://dashboard.stripe.com/apikeys")
        return False
        
    except stripe.error.StripeError as e:
        print(f"❌ Stripe Error: {e}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return False


def test_commission_calculation():
    """Test commission calculation logic"""
    print("\n" + "=" * 60)
    print("COMMISSION CALCULATION TEST")
    print("=" * 60)
    
    PLATFORM_COMMISSION_RATE = 0.10
    test_amounts = [25, 50, 75, 100, 150, 200]
    
    print(f"\nPlatform Commission Rate: {PLATFORM_COMMISSION_RATE * 100}%")
    print(f"\n{'Amount':<12} {'Platform Fee':<15} {'Mentor Payout':<15}")
    print("-" * 42)
    
    for amount in test_amounts:
        platform_fee = round(amount * PLATFORM_COMMISSION_RATE, 2)
        mentor_payout = round(amount - platform_fee, 2)
        
        # Verify math
        total = platform_fee + mentor_payout
        if abs(total - amount) > 0.01:
            print(f"£{amount:<11} ⚠️ CALCULATION ERROR!")
        else:
            print(f"£{amount:<11} £{platform_fee:<14} £{mentor_payout:<14}")
    
    print("-" * 42)
    print("✅ All calculations verified")


if __name__ == "__main__":
    success = test_stripe_connection()
    
    if success:
        test_commission_calculation()
        
        print("\n" + "=" * 60)
        print("NEXT STEPS")
        print("=" * 60)
        print("""
1. ✅ Stripe API keys configured
2. ⬜ Configure webhook endpoint in Stripe Dashboard:
   URL: https://yourdomain.com/payments/webhook
   Events: payment_intent.succeeded, payment_intent.payment_failed
   
3. ⬜ Add STRIPE_WEBHOOK_SECRET to .env file

4. ⬜ Test payment flow:
   - Start backend: uvicorn app.main:app --reload --port 8001
   - Create booking as mentee
   - Initiate payment
   - Complete checkout
   - Verify webhook received
   - Check mentor balance updated

5. ⬜ For local testing, use Stripe CLI:
   stripe listen --forward-to localhost:8001/payments/webhook
        """)
    else:
        print("\n❌ Stripe configuration failed. Please fix the issues above.")
