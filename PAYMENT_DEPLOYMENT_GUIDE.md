# Payment System Production Deployment Guide

## Overview
This guide covers deploying the Stripe payment system to production, including webhook configuration, testing, and monitoring.

---

## 1. Pre-Deployment Checklist

### Database Preparation
- [ ] **Backup production database** before deploying
  ```bash
  pg_dump -U postgres -d mentor_db > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Run database migrations** to create payment tables
  ```bash
  # The app auto-creates tables on startup via SQLAlchemy
  # Verify tables exist: payments, mentor_balances, payout_requests
  ```

- [ ] **Test database connectivity** from production environment

### Stripe Configuration

- [ ] **Create Stripe account** (if not already done)
  - Visit: https://dashboard.stripe.com/register

- [ ] **Get API keys** from Stripe Dashboard
  - Navigate to: Developers → API keys
  - Copy **Secret key** (starts with `sk_live_` for production)
  - Copy **Publishable key** (starts with `pk_live_` for production)

- [ ] **Configure webhook endpoint** in Stripe Dashboard
  1. Navigate to: Developers → Webhooks
  2. Click "Add endpoint"
  3. Enter webhook URL: `https://yourdomain.com/payments/webhook`
  4. Select events to listen for:
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
     - ✅ `charge.refunded` (optional, for future refund support)
  5. Click "Add endpoint"
  6. Copy the **Signing secret** (starts with `whsec_`)

### Environment Variables

- [ ] **Add Stripe secrets to production .env**
  ```bash
  # Backend .env file
  STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_KEY_HERE
  STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_SECRET_HERE
  DATABASE_URL=postgresql://user:password@host:port/database
  SECRET_KEY=your-jwt-secret-key
  FRONTEND_URL=https://yourfrontend.com
  ```

- [ ] **Verify .env is NOT committed to git**
  ```bash
  # Should be in .gitignore
  git check-ignore backend/.env
  ```

---

## 2. Testing in Stripe Test Mode

Before going live, test thoroughly with Stripe test keys.

### Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows (Scoop)
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

### Login to Stripe CLI
```bash
stripe login
```

### Forward webhooks to local development
```bash
# Start backend server
cd backend
uvicorn app.main:app --reload --port 8001

# In another terminal, forward webhooks
stripe listen --forward-to localhost:8001/payments/webhook
```

**Copy the webhook signing secret** from the output and add to `.env`:
```
whsec_...
```

### Trigger test payments
```bash
# Trigger successful payment
stripe trigger payment_intent.succeeded

# Trigger failed payment
stripe trigger payment_intent.payment_failed
```

### Run automated tests
```bash
# Backend webhook idempotency test
cd backend
python test_webhook_idempotency.py

# Frontend E2E payment test
cd frontend
npx playwright test payment-e2e.spec.js
```

---

## 3. Deployment Steps

### Deploy Backend
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
cd backend
pip install -r requirements.txt

# 3. Update .env with production Stripe keys

# 4. Restart backend service
# Example with systemd:
sudo systemctl restart mentor-platform-backend

# Example with PM2:
pm2 restart mentor-platform-backend

# Example with Docker:
docker-compose up -d backend
```

### Deploy Frontend
```bash
# 1. Update Stripe publishable key in frontend
# (if using Stripe Elements for card input)

# 2. Build production bundle
cd frontend
npm run build

# 3. Deploy to hosting (Vercel/Netlify/etc)
vercel --prod
# or
netlify deploy --prod
```

---

## 4. Post-Deployment Verification

### Test Webhook Endpoint
```bash
# From Stripe CLI
stripe events resend evt_XXXXX  # Use a real event ID from dashboard
```

### Create Test Payment
1. Log in as mentee
2. Create a booking with a mentor
3. Initiate payment checkout
4. Complete payment with test card: `4242 4242 4242 4242`
5. Verify:
   - ✅ Payment appears in Stripe Dashboard
   - ✅ Webhook received and processed
   - ✅ Booking status updated to "completed"
   - ✅ Mentor balance increased by 90%
   - ✅ Platform fee (10%) calculated correctly

### Verify Database
```sql
-- Check payment was recorded
SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;

-- Check mentor balance updated
SELECT * FROM mentor_balances;

-- Check webhook idempotency
SELECT payment_intent_id, webhook_event_id, webhook_processed 
FROM payments 
WHERE payment_intent_id = 'pi_xxx';
```

### Test Idempotency
1. From Stripe Dashboard, go to Webhooks → Events
2. Find a `payment_intent.succeeded` event
3. Click "..." menu → "Resend event"
4. Verify in database: only ONE payment record exists
5. Check logs: should show "already_processed" status

---

## 5. Monitoring & Alerts

### Webhook Monitoring
- **Stripe Dashboard**: Developers → Webhooks → Your endpoint
  - Check "Last 30 days" for failed deliveries
  - Investigate any 4xx/5xx responses

### Database Monitoring
```sql
-- Daily payment summary
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_payments,
    SUM(amount) as total_amount,
    SUM(platform_fee) as total_platform_fee,
    SUM(mentor_payout) as total_mentor_payout
FROM payments
WHERE status = 'succeeded'
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;

-- Unprocessed webhooks (requires investigation)
SELECT * FROM payments 
WHERE status = 'succeeded' 
AND webhook_processed = FALSE;

-- Failed payments
SELECT * FROM payments WHERE status = 'failed';
```

### Set Up Alerts
- **Webhook failures**: Alert if webhook success rate < 95%
- **Payment failures**: Alert on spike in failed payments
- **Commission discrepancies**: Alert if `platform_fee + mentor_payout != amount`

---

## 6. Security Hardening

### Webhook Security
- ✅ **Always verify Stripe signatures** (already implemented)
- ✅ **Use HTTPS** in production (Stripe requires HTTPS for webhooks)
- ✅ **Rate limit webhook endpoint** (prevent abuse)
- ✅ **Log all webhook events** for audit trail

### API Security
- ✅ **Require authentication** for all payment endpoints
- ✅ **Validate booking ownership** (mentee can only pay their bookings)
- ✅ **Prevent double payments** (idempotency checks)
- ✅ **Use environment variables** for secrets (never hardcode)

### PCI Compliance
- ✅ **Never store card details** (Stripe handles this)
- ✅ **Use Stripe Elements** for card input (iframe isolation)
- ✅ **Log payment events** (without sensitive card data)

---

## 7. Common Issues & Troubleshooting

### Webhook not receiving events
**Symptoms**: Payments succeed in Stripe but not reflected in database

**Solutions**:
1. Check webhook URL is publicly accessible (not localhost)
2. Verify HTTPS is enabled
3. Check firewall allows Stripe IPs
4. View webhook logs in Stripe Dashboard
5. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard

### Signature verification failures
**Error**: `Invalid signature`

**Solutions**:
1. Ensure `STRIPE_WEBHOOK_SECRET` is correct
2. Check raw request body is used (not parsed JSON)
3. Verify timestamp tolerance (Stripe rejects old events)

### Duplicate payments
**Symptoms**: Same booking charged twice

**Solutions**:
1. Check idempotency logic in webhook handler
2. Verify `webhook_event_id` is unique in database
3. Look for duplicate `payment_intent.succeeded` events in Stripe logs

### Commission calculation wrong
**Symptoms**: Mentor balance doesn't match expected amount

**Solutions**:
1. Test commission endpoint: `/payments/test-commission?amount=100`
2. Verify `PLATFORM_COMMISSION_RATE = 0.10` (10%)
3. Check rounding: `platform_fee + mentor_payout == amount`

---

## 8. Testing Checklist

Before launching to real customers:

- [ ] Create test payment with test card (`4242 4242 4242 4242`)
- [ ] Verify webhook signature validation works
- [ ] Test idempotency: resend same webhook event twice
- [ ] Verify commission split: 10% platform, 90% mentor
- [ ] Test failed payment handling (use card `4000 0000 0000 0002`)
- [ ] Test unauthorized access (mentor trying to pay mentee's booking)
- [ ] Test duplicate payment prevention (pay same booking twice)
- [ ] Verify mentor balance updates correctly
- [ ] Test payment history endpoint for mentee and mentor
- [ ] Load test: 100 concurrent payments (use tools like `locust` or `k6`)

---

## 9. Go-Live Checklist

- [ ] Switch from Stripe test keys to live keys
- [ ] Update webhook endpoint URL to production domain
- [ ] Backup production database
- [ ] Run smoke tests with live keys (small amounts)
- [ ] Monitor first 10 payments closely
- [ ] Set up error monitoring (Sentry, Rollbar, etc.)
- [ ] Enable Stripe Radar for fraud detection
- [ ] Prepare customer support for payment inquiries
- [ ] Document refund process for team

---

## 10. Rollback Plan

If critical issues occur after deployment:

1. **Immediate**: Disable webhook endpoint in Stripe Dashboard
2. **Backend**: Revert to previous deployment
3. **Database**: Restore from backup if data corruption
4. **Communication**: Notify affected users via email
5. **Investigation**: Review logs, fix issue, test in staging
6. **Redeployment**: Deploy fix with extra monitoring

---

## Contact & Support

- **Stripe Support**: https://support.stripe.com/
- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Status**: https://status.stripe.com/
- **Internal Team**: [Add your team's contact info]

---

## Additional Resources

- [Stripe Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Error Codes](https://stripe.com/docs/error-codes)
- [PCI Compliance](https://stripe.com/docs/security/guide)

---

**Last Updated**: [Current Date]  
**Maintained By**: Shiva's Team - Week 5 Payment Integration
