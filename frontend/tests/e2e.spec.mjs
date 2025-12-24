import { test, expect } from '@playwright/test';

const BACKEND = process.env.TEST_BACKEND_URL || 'http://127.0.0.1:8000';
const FRONTEND = process.env.TEST_FRONTEND_URL || 'http://localhost:5173';

async function apiFetch(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BACKEND}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

test('e2e booking + retry-payment (simulated webhook)', async ({ page }) => {
  // 1) Register mentor
  const mentorEmail = `mentor+pwtest@local`;
  await apiFetch('/auth/register', 'POST', { email: mentorEmail, password: 'Test1234', role: 'mentor', full_name: 'E2E Mentor' });
  const mentorLogin = await apiFetch('/auth/login', 'POST', { email: mentorEmail, password: 'Test1234' });
  expect(mentorLogin.status).toBe(200);
  const mentorToken = mentorLogin.body.access_token;

  // create mentor profile with hourly_rate and availability via API
  await apiFetch('/profiles/mentor', 'POST', {
    full_name: 'E2E Mentor', domains: 'Testing', skills: 'testing', years_experience: 5, bio: 'bio', hourly_rate: 50.0, availability: '[]'
  }, mentorToken);

  // 2) Register mentee
  const menteeEmail = `mentee+pwtest@local`;
  await apiFetch('/auth/register', 'POST', { email: menteeEmail, password: 'Test1234', role: 'mentee', full_name: 'E2E Mentee' });
  const menteeLogin = await apiFetch('/auth/login', 'POST', { email: menteeEmail, password: 'Test1234' });
  expect(menteeLogin.status).toBe(200);
  const menteeToken = menteeLogin.body.access_token;

  // 3) Create a booking as the mentee (use mentor id 1 if not known)
  // Attempt to discover mentor id by listing mentors
  const mentors = await apiFetch('/profiles/mentors', 'GET');
  let mentorId = 1;
  if (Array.isArray(mentors.body) && mentors.body.length) {
    mentorId = mentors.body[0].user_id || mentorId;
  }

  const today = new Date().toISOString().split('T')[0];
  const bookingResp = await apiFetch('/bookings/', 'POST', {
    mentor_id: mentorId,
    session_date: today,
    start_time: '10:00:00',
    duration_minutes: 60,
    mentee_message: 'E2E test booking'
  }, menteeToken);
  expect(bookingResp.status).toBe(201);
  const booking = bookingResp.body;

  // 4) Create PaymentIntent for booking via backend to get payment_id and intent id
  const createIntent = await apiFetch('/payments/create-payment-intent', 'POST', { booking_id: booking.id, amount: booking.amount }, menteeToken);
  expect(createIntent.status).toBe(200);
  const { client_secret, payment_id, payment_intent_id } = createIntent.body;

  // 5) Visit frontend bookings page as mentee (set token/role in localStorage)
  await page.addInitScript(({ token, role }) => {
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('role', role);
  }, { token: menteeToken, role: 'mentee' });

  await page.goto(`${FRONTEND}/bookings`);
  await page.waitForLoadState('networkidle');

  // Assert booking is shown and retry button exists
  const bookingCard = page.locator(`text=E2E test booking`).first();
  await expect(bookingCard).toBeVisible();
  const retryBtn = page.locator('button', { hasText: 'Retry Payment' }).first();
  await expect(retryBtn).toBeVisible();

  // 6) Simulate Stripe webhook to mark payment_intent as succeeded
  const webhookEvent = {
    id: `evt_test_${Date.now()}`,
    type: 'payment_intent.succeeded',
    data: { object: { id: payment_intent_id, metadata: { payment_id: String(payment_id), booking_id: String(booking.id) } } }
  };
  const wh = await apiFetch('/payments/webhook', 'POST', webhookEvent);
  expect(wh.status === 200 || wh.status === 201 || wh.status === 202).toBeTruthy();

  // 7) Refresh frontend and assert payment badge shows Paid
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('text=✓ Paid').first()).toBeVisible();
});
