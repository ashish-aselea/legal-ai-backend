# Razorpay Integration — Flutter Integration Guide

This document explains how to wire wallet recharges and consultation booking payments to the backend and to Razorpay Checkout. Both use the exact same order-create → Checkout → verify mechanics, just on different resources — see §1–§5 for wallet recharge, §6 for booking payment.

Base URL: `{{base_url}}` = `http://localhost:5000/api/v1` (local) or `https://legal-ai-backend-g86o.onrender.com/api/v1` (live).

---

## 1. How the flow works

```
┌──────────────┐        ┌───────────────┐        ┌──────────────────┐
│  Flutter App │        │  Our Backend  │        │  Razorpay         │
└──────┬───────┘        └───────┬───────┘        └─────────┬─────────┘
       │  1. GET payment-config │                          │
       │────────────────────────>                          │
       │  <── keyId ─────────────                          │
       │                        │                          │
       │  2. POST create-order  │                          │
       │────────────────────────>  creates order via SDK   │
       │                        │─────────────────────────>│
       │                        │ <── orderId ──────────── │
       │  <── orderId, keyId ────                          │
       │                        │                          │
       │  3. Open Razorpay Checkout (keyId + orderId)      │
       │───────────────────────────────────────────────────>
       │         user pays with UPI / card / etc.          │
       │  <── razorpay_payment_id, razorpay_signature ──────
       │                        │                          │
       │  4. POST recharge/verify (all 3 razorpay_* values)│
       │────────────────────────>  verifies signature       │
       │                        │  using key SECRET (never  │
       │                        │  sent to the app)         │
       │  <── new wallet balance ─                          │
```

**The key security rule:** the Razorpay **Key Secret** never leaves the backend. The app only ever sees the **Key ID** (safe to embed in an app — it's the equivalent of a "publishable key"). Verification of the payment happens on the server using the secret, so a user can never fake a successful payment by tampering with the app.

---

## 2. Flutter setup

Add the official Razorpay Flutter package:

```yaml
dependencies:
  razorpay_flutter: ^1.3.7
```

Android needs `minSdkVersion 19` or higher (already the default for most Flutter projects) and internet permission (already present by default).

---

## 3. Step-by-step integration

### Step 1 — Get the Razorpay Key ID

Call this once, e.g. on app startup or when the wallet screen opens.

**GET** `{{base_url}}/wallet/payment-config`
No auth required.

Response `200`:
```json
{
  "status": "success",
  "data": {
    "razorpayKeyId": "rzp_test_TZQxfuU9KSwZns",
    "isPaymentGatewayConfigured": true
  }
}
```

If `isPaymentGatewayConfigured` is `false`, the admin hasn't set up Razorpay credentials yet — grey out "Add Money" and show a message instead of proceeding.

### Step 2 — Load the wallet screen

**GET** `{{base_url}}/wallet/preset-amounts` (no auth) — the quick-select amount buttons (₹10, ₹50, ₹100...).

Response `200`:
```json
{
  "status": "success",
  "results": 14,
  "data": { "presetAmounts": [10, 50, 100, 200, 500, 1000, 2000, 3000, 4000, 8000, 15000, 20000, 50000, 100000] }
}
```

**GET** `{{base_url}}/wallet` (needs `Authorization: Bearer <userToken>`) — current balance, shown top-right on the wallet screen.

Response `200`:
```json
{
  "status": "success",
  "data": { "balance": 0 }
}
```

### Step 3 — User picks/types an amount, taps "Proceed"

**POST** `{{base_url}}/wallet/recharge/create-order`
Header: `Authorization: Bearer <userToken>`
Body:
```json
{ "amount": 500 }
```

Response `201`:
```json
{
  "status": "success",
  "data": {
    "orderId": "order_TZRtls0bXF8oz3",
    "amount": 500,
    "currency": "INR",
    "keyId": "rzp_test_TZQxfuU9KSwZns"
  }
}
```

Possible error — `503` if the admin hasn't configured Razorpay yet:
```json
{ "status": "error", "message": "Payment gateway is not configured yet. Contact the admin." }
```

### Step 4 — Open Razorpay Checkout with the order

This is the "Payment Information" screen (GPay / other UPI apps / Cards) — it's Razorpay's own UI, not something we build.

```dart
import 'package:razorpay_flutter/razorpay_flutter.dart';

final razorpay = Razorpay();
razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);

var options = {
  'key': keyId,          // from Step 1 or Step 3's response
  'amount': amount * 100, // paise
  'order_id': orderId,    // from Step 3's response — Razorpay requires this
  'currency': 'INR',
  'name': 'Legal AI',
  'description': 'Wallet Recharge',
};

razorpay.open(options);
```

### Step 5 — Verify the payment and credit the wallet

`EVENT_PAYMENT_SUCCESS` hands you a `PaymentSuccessResponse` with `orderId`, `paymentId`, and `signature`. Send all three to the backend — **do not credit the wallet locally in the app**; only the verify call actually credits it.

**POST** `{{base_url}}/wallet/recharge/verify`
Header: `Authorization: Bearer <userToken>`
Body:
```json
{
  "razorpay_order_id": "order_TZRtls0bXF8oz3",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxxx",
  "razorpay_signature": "abc123...signature_from_razorpay"
}
```

Response `200` — success, wallet credited:
```json
{
  "status": "success",
  "message": "Payment verified, wallet credited",
  "data": { "balance": 500, "creditedAmount": 500 }
}
```

Refresh the balance shown on screen from `data.balance` (don't just add the amount locally — always trust the server's number).

```dart
void _handlePaymentSuccess(PaymentSuccessResponse response) async {
  final result = await api.post('/wallet/recharge/verify', body: {
    'razorpay_order_id': response.orderId,
    'razorpay_payment_id': response.paymentId,
    'razorpay_signature': response.signature,
  });
  // update UI with result['data']['balance']
}

void _handlePaymentError(PaymentFailureResponse response) {
  // response.code, response.message — show a "payment failed / cancelled" message
  // no backend call needed; no order was verified, nothing was charged
}
```

---

## 4. Error reference for `verify`

| HTTP | Meaning | What to show the user |
|---|---|---|
| 400 | Signature didn't match (tampered or corrupted data) | "Payment verification failed, please try again" |
| 404 | No matching order for this user/order id | "Something went wrong, please contact support" |
| 409 | This order was already verified once | Treat as success — refresh balance, it's already credited |

---

## 5. Test mode

The credentials currently configured (via Admin → Settings) are **Razorpay test keys** (`rzp_test_...`). In test mode:
- Use Razorpay's test card numbers / test UPI flow (see Razorpay's own test-mode docs) — no real money moves.
- Everything else (order creation, signature verification, wallet crediting) behaves exactly like production.

When the app is ready to go live, the admin swaps the test keys for live keys (`rzp_live_...`) in the same Settings page — no app changes needed on the Flutter side, since the app never hardcodes the key, it always fetches it from `/wallet/payment-config` or the `create-order` response.

---

## 6. Booking payment (consultation booking)

Same mechanics as the wallet recharge above (real Razorpay order, Checkout, server-side signature verification) — applied to a booking instead of a wallet top-up. Unlike the wallet flow, creating the booking **and** creating its payment order happen in one call.

### Step 1 — Create the booking (this also creates the payment order)

**POST** `{{base_url}}/bookings`
Header: `Authorization: Bearer <userToken>`
Body:
```json
{ "lawyerId": "6a995abc8fb97804251d3550", "consultationType": "Chat", "date": "2026-09-10", "timeSlot": "10:00 AM" }
```

Response `201`:
```json
{
  "status": "success",
  "message": "Booking created. Complete the payment to confirm it.",
  "data": {
    "booking": { "id": "6aa1614e91910ef53aa76b8b", "lawyer": "6a995abc8fb97804251d3550", "consultationType": "Chat", "date": "2026-09-10", "timeSlot": "10:00 AM", "amount": 700, "status": "pending_payment", "createdAt": "2026-09-09T13:38:22.586Z" },
    "payment": { "orderId": "order_TZxQe9gNfY4M6w", "amount": 700, "currency": "INR", "keyId": "rzp_test_TZQxfuU9KSwZns" }
  }
}
```
If the Razorpay order fails to create (gateway not configured, Razorpay error), the booking is rolled back too — you won't end up with a `pending_payment` booking stuck holding the slot with no way to pay for it. Just show the error and let the user retry.

### Step 2 — Open Razorpay Checkout

`key: payment.keyId`, `amount: payment.amount * 100`, `order_id: payment.orderId`.

### Step 3 — Confirm

**PATCH** `{{base_url}}/bookings/:bookingId/confirm-payment`
Header: `Authorization: Bearer <userToken>`
Body (from `PaymentSuccessResponse`, same as the wallet flow):
```json
{
  "razorpay_order_id": "order_TZxGkc4JC2bDcA",
  "razorpay_payment_id": "pay_xxxxxxxxxxxxxx",
  "razorpay_signature": "abc123...signature_from_razorpay"
}
```

Response `200` — booking confirmed:
```json
{
  "status": "success",
  "message": "Payment successful, your consultation is confirmed",
  "data": { "booking": { "id": "...", "lawyer": { "id": "...", "name": "...", "practiceArea": "..." }, "consultationType": "Chat", "date": "2026-09-10", "timeSlot": "10:00 AM", "amount": 600, "status": "confirmed", "createdAt": "..." } }
}
```

Errors: `400` signature mismatch, order-id mismatch, or booking already confirmed/cancelled; `404` booking not found or belongs to a different user.
