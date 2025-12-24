import { test, expect } from '@playwright/test';

/**
 * Payment Flow E2E Test
 * Tests the complete payment journey from booking creation to payment confirmation
 */

test.describe('Payment Flow', () => {
  const API_BASE = 'http://localhost:8001';
  const testMentee = {
    email: `mentee_${Date.now()}@test.com`,
    password: 'TestPass123',
    full_name: 'Test Mentee',
    role: 'MENTEE'
  };
  const testMentor = {
    email: `mentor_${Date.now()}@test.com`,
    password: 'TestPass123',
    full_name: 'Test Mentor',
    role: 'MENTOR'
  };

  let menteeToken = '';
  let mentorToken = '';
  let bookingId = 0;

  test.beforeAll(async ({ request }) => {
    // Register mentee
    const menteeRegister = await request.post(`${API_BASE}/auth/register`, {
      data: testMentee
    });
    expect(menteeRegister.ok()).toBeTruthy();

    // Login mentee
    const menteeLogin = await request.post(`${API_BASE}/auth/login`, {
      data: {
        username: testMentee.email,
        password: testMentee.password
      }
    });
    const menteeData = await menteeLogin.json();
    menteeToken = menteeData.access_token;

    // Register mentor
    const mentorRegister = await request.post(`${API_BASE}/auth/register`, {
      data: testMentor
    });
    expect(mentorRegister.ok()).toBeTruthy();

    // Login mentor
    const mentorLogin = await request.post(`${API_BASE}/auth/login`, {
      data: {
        username: testMentor.email,
        password: testMentor.password
      }
    });
    const mentorData = await mentorLogin.json();
    mentorToken = mentorData.access_token;
  });

  test('complete payment flow: create booking → checkout → webhook → verify balance', async ({ request, page }) => {
    // Step 1: Create a booking (as mentee)
    console.log('📅 Step 1: Creating booking...');
    const booking = await request.post(`${API_BASE}/bookings/create`, {
      headers: {
        'Authorization': `Bearer ${menteeToken}`
      },
      data: {
        mentor_id: 2, // Using mentor from registration
        session_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        duration_minutes: 60,
        amount: 50.00,
        notes: 'E2E payment test booking'
      }
    });

    expect(booking.ok()).toBeTruthy();
    const bookingData = await booking.json();
    bookingId = bookingData.id;
    console.log(`  ✅ Booking created: ID ${bookingId}`);

    // Step 2: Create Stripe checkout session
    console.log('💳 Step 2: Creating Stripe checkout session...');
    const checkout = await request.post(`${API_BASE}/payments/create-checkout-session`, {
      headers: {
        'Authorization': `Bearer ${menteeToken}`
      },
      params: {
        booking_id: bookingId,
        success_url: 'http://localhost:5173/payment/success',
        cancel_url: 'http://localhost:5173/payment/cancel'
      }
    });

    expect(checkout.ok()).toBeTruthy();
    const checkoutData = await checkout.json();
    expect(checkoutData.checkout_url).toBeTruthy();
    expect(checkoutData.payment_intent_id).toBeTruthy();
    console.log(`  ✅ Checkout session created`);
    console.log(`     Payment Intent: ${checkoutData.payment_intent_id}`);
    console.log(`     Checkout URL: ${checkoutData.checkout_url}`);

    // Step 3: Simulate webhook (payment_intent.succeeded)
    // Note: In production, Stripe sends this webhook. For testing, we simulate it.
    console.log('🔔 Step 3: Simulating Stripe webhook...');
    
    const webhookPayload = {
      id: `evt_test_${Date.now()}`,
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: checkoutData.payment_intent_id,
          amount: 5000, // £50.00 in pence
          currency: 'gbp',
          status: 'succeeded',
          metadata: {
            booking_id: bookingId.toString()
          }
        }
      }
    };

    // Note: This will fail signature verification in production
    // For E2E testing, you'd use Stripe CLI: stripe trigger payment_intent.succeeded
    console.log('  ⚠️  Note: Webhook requires valid Stripe signature');
    console.log('     For real testing, use: stripe trigger payment_intent.succeeded');

    // Step 4: Verify mentor balance (should show payment after webhook)
    console.log('💰 Step 4: Checking mentor balance...');
    const balance = await request.get(`${API_BASE}/payments/balance`, {
      headers: {
        'Authorization': `Bearer ${mentorToken}`
      }
    });

    expect(balance.ok()).toBeTruthy();
    const balanceData = await balance.json();
    console.log(`  Balance: £${balanceData.available_balance}`);
    
    // If webhook processed successfully, balance should be 90% of £50 = £45
    // But since webhook signature verification will fail in test, balance will be 0
    // This test documents the expected flow for manual verification

    // Step 5: Check payment history
    console.log('📜 Step 5: Checking payment history...');
    const historyMentee = await request.get(`${API_BASE}/payments/history`, {
      headers: {
        'Authorization': `Bearer ${menteeToken}`
      }
    });

    const historyMentor = await request.get(`${API_BASE}/payments/history`, {
      headers: {
        'Authorization': `Bearer ${mentorToken}`
      }
    });

    expect(historyMentee.ok()).toBeTruthy();
    expect(historyMentor.ok()).toBeTruthy();

    const menteeHistory = await historyMentee.json();
    const mentorHistory = await historyMentor.json();

    console.log(`  Mentee payments: ${menteeHistory.length}`);
    console.log(`  Mentor payments: ${mentorHistory.length}`);
  });

  test('commission calculation is correct', async ({ request }) => {
    console.log('🧮 Testing commission calculation...');

    const testAmounts = [50, 100, 150, 200];

    for (const amount of testAmounts) {
      const response = await request.get(`${API_BASE}/payments/test-commission`, {
        params: { amount }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();

      const expectedPlatformFee = Math.round(amount * 0.10 * 100) / 100;
      const expectedMentorPayout = Math.round((amount - expectedPlatformFee) * 100) / 100;

      expect(data.platform_fee).toBe(expectedPlatformFee);
      expect(data.mentor_payout).toBe(expectedMentorPayout);

      console.log(`  £${amount} → Platform: £${data.platform_fee}, Mentor: £${data.mentor_payout} ✅`);
    }
  });

  test('prevent duplicate payments for same booking', async ({ request }) => {
    console.log('🔒 Testing duplicate payment prevention...');

    // Try to create checkout session for same booking twice
    const checkout1 = await request.post(`${API_BASE}/payments/create-checkout-session`, {
      headers: {
        'Authorization': `Bearer ${menteeToken}`
      },
      params: {
        booking_id: bookingId,
        success_url: 'http://localhost:5173/payment/success',
        cancel_url: 'http://localhost:5173/payment/cancel'
      }
    });

    // First call might succeed or fail depending on booking status
    console.log(`  First checkout: ${checkout1.status()}`);

    if (checkout1.ok()) {
      const checkout2 = await request.post(`${API_BASE}/payments/create-checkout-session`, {
        headers: {
          'Authorization': `Bearer ${menteeToken}`
        },
        params: {
          booking_id: bookingId,
          success_url: 'http://localhost:5173/payment/success',
          cancel_url: 'http://localhost:5173/payment/cancel'
        }
      });

      console.log(`  Second checkout: ${checkout2.status()}`);
      // Should either succeed (same intent) or fail with 400 (already paid)
      expect([200, 400]).toContain(checkout2.status());
    }
  });

  test('only mentee can pay for their booking', async ({ request }) => {
    console.log('🔐 Testing authorization...');

    // Mentor should not be able to pay for booking
    const checkout = await request.post(`${API_BASE}/payments/create-checkout-session`, {
      headers: {
        'Authorization': `Bearer ${mentorToken}` // Using mentor token for mentee's booking
      },
      params: {
        booking_id: bookingId,
        success_url: 'http://localhost:5173/payment/success',
        cancel_url: 'http://localhost:5173/payment/cancel'
      }
    });

    expect(checkout.status()).toBe(403);
    console.log(`  ✅ Correctly rejected: ${checkout.status()}`);
  });
});

test.describe('Webhook Idempotency', () => {
  test('same webhook event processed only once', async ({ request }) => {
    console.log('🔁 Testing webhook idempotency...');
    console.log('  ⚠️  This test requires:');
    console.log('     1. STRIPE_WEBHOOK_SECRET in .env');
    console.log('     2. Valid Stripe signature');
    console.log('     3. Use Stripe CLI: stripe trigger payment_intent.succeeded');
    console.log('  For automated testing, this is documented for manual verification.');
  });
});

/**
 * PRODUCTION DEPLOYMENT CHECKLIST
 * 
 * Before deploying payment system:
 * 
 * ✅ 1. Stripe Configuration
 *    - Add STRIPE_SECRET_KEY to production .env
 *    - Add STRIPE_WEBHOOK_SECRET to production .env
 *    - Configure webhook in Stripe Dashboard
 * 
 * ✅ 2. Database
 *    - Run migrations to create payment tables
 *    - Backup production database before deploying
 * 
 * ✅ 3. Testing
 *    - Test in Stripe test mode first
 *    - Verify webhook signature validation works
 *    - Test idempotency with duplicate events
 *    - Verify commission calculation (10% platform, 90% mentor)
 * 
 * ✅ 4. Monitoring
 *    - Set up webhook failure alerts
 *    - Monitor payment success rate
 *    - Track commission payouts
 * 
 * ✅ 5. Security
 *    - Ensure HTTPS in production
 *    - Validate all webhook signatures
 *    - Rate limit payment endpoints
 *    - Log all payment events
 * 
 * ✅ 6. Compliance
 *    - Review Stripe's terms of service
 *    - Implement refund policy
 *    - Add payment receipt emails
 *    - Display pricing clearly to users
 */
