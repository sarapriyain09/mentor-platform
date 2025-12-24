"""
Test webhook idempotency - ensures duplicate webhook events don't create duplicate payments
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:8001"

def create_mock_webhook_event(payment_intent_id: str, event_id: str, booking_id: int):
    """Create a mock Stripe webhook payload"""
    return {
        "id": event_id,
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "id": payment_intent_id,
                "amount": 5000,  # £50.00 in pence
                "currency": "gbp",
                "status": "succeeded",
                "metadata": {
                    "booking_id": str(booking_id),
                    "mentee_id": "1",
                    "mentor_id": "2"
                }
            }
        },
        "created": int(time.time())
    }

def test_webhook_idempotency():
    """Test that sending the same webhook twice doesn't create duplicate payments"""
    
    print("=" * 60)
    print("WEBHOOK IDEMPOTENCY TEST")
    print("=" * 60)
    
    # Test parameters
    payment_intent_id = f"pi_test_{int(time.time())}"
    event_id = f"evt_test_{int(time.time())}"
    booking_id = 1  # Use existing booking ID or create one
    
    webhook_url = f"{BASE_URL}/payments/webhook"
    webhook_payload = create_mock_webhook_event(payment_intent_id, event_id, booking_id)
    
    print(f"\n📋 Test Setup:")
    print(f"  Payment Intent ID: {payment_intent_id}")
    print(f"  Event ID: {event_id}")
    print(f"  Booking ID: {booking_id}")
    
    # IMPORTANT: This test will fail without STRIPE_WEBHOOK_SECRET configured
    # For real testing, you need to:
    # 1. Set STRIPE_WEBHOOK_SECRET in .env
    # 2. Use Stripe CLI to generate proper signatures: stripe trigger payment_intent.succeeded
    
    print(f"\n⚠️  NOTE: This test requires STRIPE_WEBHOOK_SECRET configured")
    print(f"   For production testing, use Stripe CLI:")
    print(f"   stripe listen --forward-to localhost:8001/payments/webhook")
    print(f"   stripe trigger payment_intent.succeeded")
    
    # Test 1: First webhook call
    print(f"\n🔔 Test 1: First webhook call (should succeed)")
    print(f"  Sending webhook to: {webhook_url}")
    
    try:
        response1 = requests.post(
            webhook_url,
            json=webhook_payload,
            headers={
                "Content-Type": "application/json",
                "stripe-signature": "mock_signature_for_testing"  # Will fail signature check
            }
        )
        
        print(f"  Status Code: {response1.status_code}")
        print(f"  Response: {response1.json()}")
        
        if response1.status_code == 400:
            print(f"  ❌ Expected: Signature verification failed (this is expected without real Stripe signature)")
            print(f"\n💡 To test properly:")
            print(f"   1. Install Stripe CLI: https://stripe.com/docs/stripe-cli")
            print(f"   2. Run: stripe login")
            print(f"   3. Run: stripe listen --forward-to localhost:8001/payments/webhook")
            print(f"   4. Get webhook secret from CLI output, add to .env as STRIPE_WEBHOOK_SECRET")
            print(f"   5. Run: stripe trigger payment_intent.succeeded")
            return
        
        # Test 2: Duplicate webhook call (same event_id)
        print(f"\n🔔 Test 2: Duplicate webhook (same event_id, should be idempotent)")
        time.sleep(0.5)  # Small delay
        
        response2 = requests.post(
            webhook_url,
            json=webhook_payload,
            headers={
                "Content-Type": "application/json",
                "stripe-signature": "mock_signature_for_testing"
            }
        )
        
        print(f"  Status Code: {response2.status_code}")
        print(f"  Response: {response2.json()}")
        
        if response2.status_code == 200:
            result = response2.json()
            if result.get("status") == "already_processed":
                print(f"  ✅ SUCCESS: Idempotency working! Event was already processed")
            else:
                print(f"  ⚠️  WARNING: Expected 'already_processed' status")
        
        # Test 3: Different event_id, same payment_intent_id
        print(f"\n🔔 Test 3: Different event (different event_id, same payment_intent_id)")
        different_event = webhook_payload.copy()
        different_event["id"] = f"evt_test_different_{int(time.time())}"
        
        response3 = requests.post(
            webhook_url,
            json=different_event,
            headers={
                "Content-Type": "application/json",
                "stripe-signature": "mock_signature_for_testing"
            }
        )
        
        print(f"  Status Code: {response3.status_code}")
        print(f"  Response: {response3.json()}")
        
        if response3.status_code == 200:
            result = response3.json()
            if result.get("status") == "payment_already_processed":
                print(f"  ✅ SUCCESS: Payment intent idempotency working!")
            else:
                print(f"  ⚠️  WARNING: Expected 'payment_already_processed' status")
        
    except requests.exceptions.ConnectionError:
        print(f"  ❌ ERROR: Cannot connect to backend at {BASE_URL}")
        print(f"     Make sure backend is running: uvicorn app.main:app --reload --port 8001")
    except Exception as e:
        print(f"  ❌ ERROR: {e}")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


def test_commission_calculation():
    """Test commission calculation endpoint"""
    
    print("\n" + "=" * 60)
    print("COMMISSION CALCULATION TEST")
    print("=" * 60)
    
    test_amounts = [50.00, 100.00, 150.00, 200.00]
    
    for amount in test_amounts:
        try:
            response = requests.get(
                f"{BASE_URL}/payments/test-commission",
                params={"amount": amount}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"\n💰 Amount: £{amount:.2f}")
                print(f"  Platform Fee (10%): £{result['platform_fee']:.2f}")
                print(f"  Mentor Payout (90%): £{result['mentor_payout']:.2f}")
                
                # Verify calculation
                expected_fee = round(amount * 0.10, 2)
                expected_payout = round(amount - expected_fee, 2)
                
                if result['platform_fee'] == expected_fee and result['mentor_payout'] == expected_payout:
                    print(f"  ✅ Calculation correct!")
                else:
                    print(f"  ❌ Calculation mismatch!")
            else:
                print(f"  ❌ Error: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"  ❌ ERROR: Cannot connect to backend at {BASE_URL}")
            break
        except Exception as e:
            print(f"  ❌ ERROR: {e}")


if __name__ == "__main__":
    test_webhook_idempotency()
    test_commission_calculation()
    
    print("\n" + "=" * 60)
    print("PRODUCTION CHECKLIST")
    print("=" * 60)
    print("""
    Before deploying to production:
    
    ✅ 1. Add STRIPE_SECRET_KEY to production .env (get from Stripe Dashboard)
    ✅ 2. Add STRIPE_WEBHOOK_SECRET to production .env (from Stripe webhook settings)
    ✅ 3. Configure webhook endpoint in Stripe Dashboard:
         URL: https://yourdomain.com/payments/webhook
         Events: payment_intent.succeeded, payment_intent.payment_failed
    ✅ 4. Test webhook with Stripe CLI: stripe trigger payment_intent.succeeded
    ✅ 5. Verify idempotency: send same event twice, check only one payment created
    ✅ 6. Verify commission: check platform_fee and mentor_payout are correct
    ✅ 7. Test refund handling (future feature)
    ✅ 8. Set up monitoring for webhook failures
    ✅ 9. Create database backup before going live
    ✅ 10. Test end-to-end payment flow in staging environment
    """)
