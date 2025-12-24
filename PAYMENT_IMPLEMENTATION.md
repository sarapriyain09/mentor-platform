# Payment System Implementation - Complete ✅

## What Was Built

### 1. Payment Models (`backend/app/models/payment.py`)
Created three new database models:
- **Payment**: Tracks all payment transactions with Stripe integration
  - Stores: payment_intent_id, amount, currency, status
  - Commission tracking: platform_fee (10%), mentor_payout (90%)
  - Idempotency: webhook_processed, webhook_event_id (prevents duplicates)
  
- **MentorBalance**: Tracks mentor earnings
  - total_earned, available_balance, pending_balance, withdrawn
  - One balance record per mentor
  
- **PayoutRequest**: For future mentor payout functionality
  - Tracks withdrawal requests from mentors

### 2. Payment Routes (`backend/app/routes/payment_routes.py`)
Implemented complete payment flow:

**Endpoints:**
- `POST /payments/create-checkout-session` - Create Stripe checkout for booking
  - Validates booking ownership (only mentee can pay)
  - Prevents duplicate payments
  - Returns checkout URL for Stripe hosted page
  
- `POST /payments/webhook` - Stripe webhook handler with idempotency
  - Verifies webhook signature for security
  - Checks for duplicate events (by webhook_event_id)
  - Checks for duplicate payments (by payment_intent_id)
  - Calculates 10% platform fee, 90% mentor payout
  - Updates mentor balance atomically
  - Returns status: "success", "already_processed", or "payment_already_processed"
  
- `GET /payments/balance` - Get mentor's current balance
  - Returns total_earned, available_balance, pending_balance, withdrawn
  
- `GET /payments/history` - Payment history for current user
  - Mentors see their earnings
  - Mentees see their payments
  
- `GET /payments/test-commission` - Test commission calculation
  - Verifies 10% platform / 90% mentor split

**Commission Logic:**
```python
PLATFORM_COMMISSION_RATE = 0.10  # 10%
platform_fee = round(amount * 0.10, 2)
mentor_payout = round(amount - platform_fee, 2)
```

**Idempotency Strategy:**
1. Check if webhook_event_id already processed → return "already_processed"
2. Check if payment_intent_id already succeeded → return "payment_already_processed"
3. Process payment only if both checks pass

### 3. Testing Infrastructure

**Webhook Idempotency Test (`backend/test_webhook_idempotency.py`)**
- Tests sending same webhook event multiple times
- Verifies only ONE payment created
- Tests commission calculation accuracy
- Includes production deployment checklist

**E2E Payment Test (`frontend/tests/payment-e2e.spec.js`)**
- Complete payment flow: booking → checkout → webhook → balance
- Commission calculation verification
- Duplicate payment prevention
- Authorization testing (only mentee can pay)
- Webhook idempotency documentation

### 4. Production Deployment Guide (`PAYMENT_DEPLOYMENT_GUIDE.md`)
Comprehensive 10-section guide covering:
1. Pre-deployment checklist (database backup, Stripe config)
2. Testing in Stripe test mode with Stripe CLI
3. Deployment steps (backend + frontend)
4. Post-deployment verification
5. Monitoring & alerts (webhook failures, payment tracking)
6. Security hardening (signature verification, PCI compliance)
7. Common issues & troubleshooting
8. Testing checklist (15+ tests before go-live)
9. Go-live checklist
10. Rollback plan

### 5. Configuration

**Environment Variables Added to `.env.example`:**
```bash
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

**Routes Registered in `main.py`:**
- Added payment_routes router with `/payments` prefix
- Imported payment models for table creation

---

## How to Use

### Setup
1. **Get Stripe keys** from https://dashboard.stripe.com/test/apikeys
2. **Add to .env:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env and add your actual Stripe keys
   ```
3. **Install Stripe:** `pip install stripe` (already done)
4. **Create tables:** Tables auto-created on server startup

### Testing Locally
1. **Install Stripe CLI:** https://stripe.com/docs/stripe-cli
   ```bash
   stripe login
   ```

2. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:8001/payments/webhook
   ```
   Copy the webhook secret from output, add to `.env` as `STRIPE_WEBHOOK_SECRET`

3. **Start backend:**
   ```bash
   uvicorn app.main:app --reload --port 8001
   ```

4. **Trigger test payment:**
   ```bash
   stripe trigger payment_intent.succeeded
   ```

5. **Run tests:**
   ```bash
   # Backend test
   python backend/test_webhook_idempotency.py
   
   # Frontend E2E test
   npx playwright test frontend/tests/payment-e2e.spec.js
   ```

### Production Deployment
Follow the complete guide in `PAYMENT_DEPLOYMENT_GUIDE.md`:
1. Switch to live Stripe keys (sk_live_...)
2. Configure webhook in Stripe Dashboard
3. Update .env with production credentials
4. Deploy backend + frontend
5. Verify with test payment
6. Monitor webhook success rate

---

## Database Schema

### New Tables Created
```sql
-- payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    payment_intent_id VARCHAR UNIQUE NOT NULL,
    amount FLOAT NOT NULL,
    currency VARCHAR DEFAULT 'gbp',
    status VARCHAR NOT NULL,
    platform_fee FLOAT NOT NULL,
    mentor_payout FLOAT NOT NULL,
    commission_paid BOOLEAN DEFAULT FALSE,
    webhook_processed BOOLEAN DEFAULT FALSE,
    webhook_event_id VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    succeeded_at TIMESTAMP
);

-- mentor_balances table
CREATE TABLE mentor_balances (
    id SERIAL PRIMARY KEY,
    mentor_id INTEGER UNIQUE REFERENCES users(id),
    total_earned FLOAT DEFAULT 0.0,
    available_balance FLOAT DEFAULT 0.0,
    pending_balance FLOAT DEFAULT 0.0,
    withdrawn FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- payout_requests table (for future use)
CREATE TABLE payout_requests (
    id SERIAL PRIMARY KEY,
    mentor_id INTEGER REFERENCES users(id),
    amount FLOAT NOT NULL,
    status VARCHAR DEFAULT 'pending',
    stripe_payout_id VARCHAR,
    bank_account_last4 VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);
```

---

## Security Features

✅ **Webhook Signature Verification** - All webhooks verified with Stripe signature  
✅ **Idempotency** - Duplicate webhook events are detected and ignored  
✅ **Authorization** - Only booking owner (mentee) can initiate payment  
✅ **No Card Data Storage** - Card details handled entirely by Stripe  
✅ **Atomic Transactions** - Database updates happen within transaction  
✅ **Rate Limiting** - (Recommended: add rate limiting middleware)  

---

## Commission Split

| Amount | Platform Fee (10%) | Mentor Payout (90%) |
|--------|-------------------|---------------------|
| £50    | £5.00             | £45.00              |
| £100   | £10.00            | £90.00              |
| £150   | £15.00            | £135.00             |
| £200   | £20.00            | £180.00             |

---

## Next Steps (Future Enhancements)

1. **Refund Handling** - Add webhook for `charge.refunded` events
2. **Payout System** - Implement mentor balance withdrawal to bank account
3. **Email Notifications** - Send payment receipts to mentee and mentor
4. **Dispute Management** - Handle Stripe disputes and chargebacks
5. **Analytics Dashboard** - Track payment metrics, conversion rates
6. **Multi-Currency Support** - Support USD, EUR, etc.
7. **Subscription Plans** - Recurring payments for monthly mentorship
8. **Partial Refunds** - Allow refunding specific amounts

---

## Troubleshooting

**Webhook not working?**
- Check `STRIPE_WEBHOOK_SECRET` is set correctly
- Verify webhook URL is publicly accessible (use ngrok for local testing)
- Check Stripe Dashboard → Webhooks for error logs

**Commission calculation wrong?**
- Test endpoint: `GET /payments/test-commission?amount=100`
- Should return: platform_fee=10.00, mentor_payout=90.00

**Duplicate payments?**
- Check `webhook_event_id` is unique in database
- Verify idempotency logic in webhook handler
- Look for error logs during webhook processing

**Backend not starting?**
- Ensure all imports in `main.py` are correct
- Check database connection (DATABASE_URL)
- Verify Python packages installed: `pip install -r requirements.txt`

---

## Files Modified/Created

**New Files:**
- `backend/app/models/payment.py` - Payment models
- `backend/app/routes/payment_routes.py` - Payment endpoints
- `backend/test_webhook_idempotency.py` - Idempotency test script
- `frontend/tests/payment-e2e.spec.js` - E2E payment tests
- `PAYMENT_DEPLOYMENT_GUIDE.md` - Production deployment guide
- `PAYMENT_IMPLEMENTATION.md` - This summary

**Modified Files:**
- `backend/app/main.py` - Added payment router
- `backend/.env.example` - Added Stripe environment variables
- `backend/requirements.txt` - Already had stripe==11.3.0

---

**Implementation Status:** ✅ Complete  
**Ready for Testing:** ✅ Yes (with Stripe test keys)  
**Ready for Production:** ⚠️ After configuring live Stripe keys and testing  

**Developer:** GitHub Copilot  
**Date:** Week 5 - Payment System Integration  
**Based on:** Shiva's Week 5 Plan
