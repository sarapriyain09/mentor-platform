import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function StripePayment({ clientSecret, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    setLoading(true);
    setError('');
    if (!stripe || !elements) {
      setError('Stripe not loaded');
      setLoading(false);
      return;
    }

    const card = elements.getElement(CardElement);
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card }
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        onSuccess(result.paymentIntent);
      }
    } catch (e) {
      setError(e.message || 'Payment error');
    }

    setLoading(false);
  };

  return (
    <div className="stripe-payment-modal">
      <div className="stripe-payment-card">
        <h3>Enter card details</h3>
        <CardElement />
        {error && <div className="error">{error}</div>}
        <div className="actions">
          <button onClick={onCancel} className="btn-cancel">Cancel</button>
          <button onClick={handlePay} className="btn-pay" disabled={loading || !stripe}>
            {loading ? 'Processing…' : 'Pay'}
          </button>
        </div>
      </div>
    </div>
  );
}
