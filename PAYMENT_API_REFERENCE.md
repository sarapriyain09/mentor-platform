# Payment System API Quick Reference

## Base URL
```
http://localhost:8001  (Development)
https://yourdomain.com (Production)
```

---

## Endpoints

### 1. Create Checkout Session
**Create Stripe checkout for booking payment**

```http
POST /payments/create-checkout-session
```

**Headers:**
```
Authorization: Bearer <mentee_jwt_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| booking_id | integer | Yes | ID of booking to pay for |
| success_url | string | Yes | URL to redirect after successful payment |
| cancel_url | string | Yes | URL to redirect if payment cancelled |

**Example Request:**
```bash
curl -X POST "http://localhost:8001/payments/create-checkout-session?booking_id=1&success_url=http://localhost:5173/payment/success&cancel_url=http://localhost:5173/payment/cancel" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_...",
  "session_id": "cs_test_...",
  "payment_intent_id": "pi_3AbC..."
}
```

**Error Responses:**
- `403 Forbidden` - Not authorized to pay for this booking
- `404 Not Found` - Booking not found
- `400 Bad Request` - Booking already paid

---

### 2. Stripe Webhook Handler
**Receive and process Stripe webhook events (idempotent)**

```http
POST /payments/webhook
```

**Headers:**
```
stripe-signature: t=1234567890,v1=abc123...
```

**Body (from Stripe):**
```json
{
  "id": "evt_1AbC...",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3AbC...",
      "amount": 5000,
      "currency": "gbp",
      "status": "succeeded",
      "metadata": {
        "booking_id": "1"
      }
    }
  }
}
```

**Success Response (200) - First Time:**
```json
{
  "status": "success",
  "payment_id": 42,
  "mentor_payout": 45.0,
  "platform_fee": 5.0,
  "event_id": "evt_1AbC..."
}
```

**Success Response (200) - Duplicate Event:**
```json
{
  "status": "already_processed",
  "event_id": "evt_1AbC..."
}
```

**Success Response (200) - Same Payment Intent, Different Event:**
```json
{
  "status": "payment_already_processed",
  "payment_id": 42
}
```

**Error Responses:**
- `400 Bad Request` - Invalid payload or signature
- `404 Not Found` - Booking not found

---

### 3. Get Mentor Balance
**Retrieve current balance for logged-in mentor**

```http
GET /payments/balance
```

**Headers:**
```
Authorization: Bearer <mentor_jwt_token>
```

**Example Request:**
```bash
curl http://localhost:8001/payments/balance \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "mentor_id": 2,
  "total_earned": 450.0,
  "available_balance": 450.0,
  "pending_balance": 0.0,
  "withdrawn": 0.0
}
```

**Error Responses:**
- `403 Forbidden` - Only mentors can view balance
- `401 Unauthorized` - Not logged in

---

### 4. Get Payment History
**Retrieve payment history for current user**

```http
GET /payments/history
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Example Request:**
```bash
curl http://localhost:8001/payments/history \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200) - Mentee:**
```json
[
  {
    "id": 1,
    "booking_id": 5,
    "amount": 50.0,
    "currency": "gbp",
    "status": "succeeded",
    "platform_fee": null,
    "mentor_payout": null,
    "created_at": "2024-01-15T10:30:00",
    "succeeded_at": "2024-01-15T10:30:15"
  }
]
```

**Success Response (200) - Mentor:**
```json
[
  {
    "id": 1,
    "booking_id": 5,
    "amount": 50.0,
    "currency": "gbp",
    "status": "succeeded",
    "platform_fee": 5.0,
    "mentor_payout": 45.0,
    "created_at": "2024-01-15T10:30:00",
    "succeeded_at": "2024-01-15T10:30:15"
  }
]
```

---

### 5. Test Commission Calculation
**Test endpoint to verify commission split**

```http
GET /payments/test-commission?amount=<amount>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| amount | float | Yes | Total amount to calculate commission for |

**Example Request:**
```bash
curl "http://localhost:8001/payments/test-commission?amount=100"
```

**Success Response (200):**
```json
{
  "total_amount": 100.0,
  "platform_fee": 10.0,
  "platform_fee_percentage": "10.0%",
  "mentor_payout": 90.0,
  "mentor_payout_percentage": "90.0%"
}
```

---

## Payment Flow Diagram

```
┌─────────┐                                      ┌─────────┐
│ Mentee  │                                      │ Mentor  │
└────┬────┘                                      └────┬────┘
     │                                                │
     │ 1. POST /payments/create-checkout-session     │
     ├──────────────────────────────────────────────►│
     │                                                │
     │ 2. Redirect to Stripe Checkout                │
     ├──────────────────────────────────────────────►│
     │                                                │
     │ 3. Enter card details on Stripe               │
     ├──────────────────────────────────────────────►│
     │                                                │
     │ 4. Stripe processes payment                   │
     │    and sends webhook                          │
     │                                                │
     │ ┌────────────────────────────────────────┐    │
     │ │ POST /payments/webhook                 │    │
     │ │ (from Stripe)                          │    │
     │ │                                        │    │
     │ │ - Verify signature                     │    │
     │ │ - Check idempotency                    │    │
     │ │ - Calculate commission (10%/90%)       │    │
     │ │ - Update booking status                │    │
     │ │ - Update mentor balance (+£45)         │    │
     │ └────────────────────────────────────────┘    │
     │                                                │
     │ 5. Redirect to success_url                    │
     ◄──────────────────────────────────────────────┤
     │                                                │
     │                     6. GET /payments/balance   │
     │                     ◄─────────────────────────┤
     │                                                │
     │                     (Returns: £45 available)   │
     │                     ──────────────────────────►│
```

---

## Commission Breakdown

| Total Payment | Platform Fee (10%) | Mentor Payout (90%) |
|---------------|-------------------|---------------------|
| £25           | £2.50             | £22.50              |
| £50           | £5.00             | £45.00              |
| £75           | £7.50             | £67.50              |
| £100          | £10.00            | £90.00              |
| £150          | £15.00            | £135.00             |
| £200          | £20.00            | £180.00             |

**Formula:**
```python
platform_fee = round(total_amount * 0.10, 2)
mentor_payout = round(total_amount - platform_fee, 2)
```

---

## Webhook Events Handled

| Event Type | Description | Action Taken |
|-----------|-------------|--------------|
| `payment_intent.succeeded` | Payment succeeded | Update booking, credit mentor balance |
| `payment_intent.payment_failed` | Payment failed | (Future: notify mentee) |
| `charge.refunded` | Payment refunded | (Future: deduct from mentor balance) |

---

## Testing

### With Stripe CLI

1. **Install Stripe CLI:**
   ```bash
   stripe login
   ```

2. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:8001/payments/webhook
   ```

3. **Trigger test payment:**
   ```bash
   stripe trigger payment_intent.succeeded
   ```

### Test Cards (Stripe Test Mode)

| Card Number | Description | Result |
|------------|-------------|--------|
| 4242 4242 4242 4242 | Successful payment | Payment succeeds |
| 4000 0000 0000 0002 | Card declined | Payment fails |
| 4000 0000 0000 9995 | Insufficient funds | Payment fails |

**Any future expiry date (e.g., 12/34) and any 3-digit CVC works**

---

## Idempotency

Webhook handler prevents duplicate payments using **two levels of idempotency**:

1. **Event-level:** Checks `webhook_event_id` in database
   - If event ID already processed → return `"already_processed"`

2. **Payment-level:** Checks `payment_intent_id` in database
   - If payment already succeeded → return `"payment_already_processed"`

**Example:**
```bash
# First webhook call
POST /payments/webhook (event: evt_123, payment: pi_456)
→ Creates payment record, updates balance
→ Response: {"status": "success"}

# Duplicate webhook (same event ID)
POST /payments/webhook (event: evt_123, payment: pi_456)
→ Finds existing event_id
→ Response: {"status": "already_processed"}

# Different event, same payment
POST /payments/webhook (event: evt_789, payment: pi_456)
→ Finds existing payment_intent_id with webhook_processed=True
→ Response: {"status": "payment_already_processed"}
```

---

## Environment Variables

```bash
# Required for payment system
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe webhook settings)

# Existing variables
DATABASE_URL=postgresql://user:pass@localhost:5432/mentor_db
SECRET_KEY=your-jwt-secret
FRONTEND_URL=http://localhost:5173
```

---

## Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid signature` | Webhook secret mismatch | Check `STRIPE_WEBHOOK_SECRET` in .env |
| `Booking not found` | Invalid booking_id in metadata | Verify booking exists |
| `Not authorized` | Mentee trying to pay different booking | Check booking ownership |
| `Booking already paid` | Duplicate checkout attempt | Check booking payment_status |
| `Connection refused` | Backend not running | Start backend: `uvicorn app.main:app --reload --port 8001` |

---

## Security Checklist

✅ Always verify webhook signature  
✅ Use HTTPS in production  
✅ Never log full card numbers (Stripe handles cards)  
✅ Rate limit payment endpoints  
✅ Validate booking ownership before checkout  
✅ Use environment variables for secrets  
✅ Enable Stripe Radar for fraud detection  
✅ Monitor webhook success rate  

---

## Production URLs

**Stripe Dashboard:**
- Test mode: https://dashboard.stripe.com/test/payments
- Live mode: https://dashboard.stripe.com/payments

**Webhook Configuration:**
- https://dashboard.stripe.com/webhooks

**API Keys:**
- https://dashboard.stripe.com/apikeys

---

**For detailed deployment guide, see:** `PAYMENT_DEPLOYMENT_GUIDE.md`  
**For implementation summary, see:** `PAYMENT_IMPLEMENTATION.md`
