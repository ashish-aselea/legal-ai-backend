# Lawyer Voice/Video Call — Flutter Integration Guide

This is the frontend-facing companion to `ZEGOCLOUD_CALL_BACKEND.md`. It only contains what's safe for the app: no AppSign, no ServerSecret, no CallbackSecret — those stay server-side. Everything here is a normal authenticated REST call, same pattern as the wallet APIs.

Base URL: `{{base_url}}` = `http://localhost:5000/api/v1` (local) or `https://legal-ai-backend-g86o.onrender.com/api/v1` (live).

Billing is server-driven, not app-driven: the backend only starts/stops charging the wallet once **ZEGOCLOUD's own server** confirms the call actually connected/ended (a webhook, invisible to the app). The app's job is to register the call and then poll for live billing state — it can never itself cause a charge.

---

## 1. AppID

```
670525599
```
Safe to hardcode or fetch — this is the equivalent of a "publishable" identifier, not a secret.

---

## 2. Get a Kit token

Call once at login/app-start, and again whenever the previous token is close to `expiresAt`.

**POST** `{{base_url}}/calls/zego-token`
Header: `Authorization: Bearer <userToken>`
Body: `{}`

Response `200`:
```json
{
  "status": "success",
  "data": {
    "appId": 670525599,
    "userId": "6a995abc8fb97804251d354f",
    "token": "04AAAAAgAAAAAA...(opaque)",
    "expiresAt": "2026-09-08T16:30:00.000Z"
  }
}
```

Pass `token` into `ZegoUIKitPrebuiltCallInvitationService().init(...)` — do not pass a raw AppSign, the app should never have one.

---

## 3. Before showing the "Call" button as tappable

**POST** `{{base_url}}/calls/can-start`
Header: `Authorization: Bearer <userToken>`
Body:
```json
{ "lawyerId": "6a995abc8fb97804251d354f", "mode": "voice" }
```
`mode` is `"voice"` or `"video"`.

Response `200` — allowed:
```json
{ "status": "success", "data": { "allowed": true, "callFeePerMinute": 20 } }
```

Response `200` — not allowed (still HTTP 200 — this is a normal outcome, not an error):
```json
{
  "status": "success",
  "data": {
    "allowed": false,
    "reason": "insufficient_balance",
    "message": "Insufficient balance for at least one minute of this call."
  }
}
```

`reason` values: `insufficient_balance`, `lawyer_busy`, `lawyer_not_found`, `mode_not_supported`, `no_call_rate_set`.

---

## 4. Register the call, then send the ZEGOCLOUD invitation

Call this **right before** sending the ZEGOCLOUD invitation — it re-checks balance/availability (things can change between step 3 and now) and tells the backend which room to watch for.

**POST** `{{base_url}}/calls/register`
Header: `Authorization: Bearer <userToken>`
Body:
```json
{
  "lawyerId": "6a995abc8fb97804251d354f",
  "mode": "voice",
  "zegoRoomId": "call_9f2c1e7a"
}
```
`zegoRoomId` — whatever room/call identifier the `zego_uikit_prebuilt_call` Kit exposes for this invitation (check the Kit's invitation-sent callback for the exact field in your installed SDK version). This is what lets the backend match ZEGOCLOUD's own signal back to this call.

Response `201`:
```json
{
  "status": "success",
  "data": { "callSessionId": "665f1a2b3c4d5e6f7a8b9c0d", "callFeePerMinute": 20 }
}
```

Response `409` if balance/availability changed since step 3 — treat exactly like a `can-start` rejection and don't send the invitation:
```json
{ "status": "error", "message": "This lawyer is currently on another call" }
```

**Immediately after this succeeds**, send the actual ZEGOCLOUD invitation using the Kit as normal. Save `callSessionId` — you'll need it for polling.

---

## 5. While the call is active — poll for live billing

Poll every ~5 seconds while the call is on screen, to drive the "₹X so far" indicator.

**GET** `{{base_url}}/calls/tick/:callSessionId`
Header: `Authorization: Bearer <userToken>`

Response `200` — waiting for the callee to answer (before ZEGOCLOUD confirms the room is live):
```json
{ "status": "success", "data": { "status": "pending", "elapsedSeconds": 0, "costSoFar": 0, "walletBalance": 100, "lowBalanceWarning": null, "ended": null } }
```

Response `200` — call connected and billing:
```json
{ "status": "success", "data": { "status": "ongoing", "elapsedSeconds": 95, "costSoFar": 20, "walletBalance": 80, "lowBalanceWarning": null, "ended": null } }
```

Response `200` — low-balance warning (balance won't cover the *next* minute):
```json
{ "status": "success", "data": { "status": "ongoing", "elapsedSeconds": 115, "costSoFar": 20, "walletBalance": 5, "lowBalanceWarning": { "secondsRemaining": 5 }, "ended": null } }
```
Show a "call will end soon — balance running low" banner when `lowBalanceWarning` is non-null.

Response `200` — call has ended (**stop polling once you see this**):
```json
{
  "status": "success",
  "data": {
    "status": "ended",
    "elapsedSeconds": 120,
    "costSoFar": 40,
    "walletBalance": 5,
    "ended": {
      "forced": true,
      "reason": "insufficient_balance",
      "durationSeconds": 120,
      "totalCost": 40,
      "callerNewBalance": 5
    }
  }
}
```
`ended.forced: true` means the **backend** ended the call (ran out of balance, or a stale-call timeout) — show a distinct "call ended: balance ran out" message instead of the normal end-of-call summary. If the Kit's own `onCallEnd` fires locally at the same time, that's expected — both are describing the same end, just from two different signals.

`404` if `callSessionId` doesn't exist or belongs to a different user.

---

## 6. When the call ends (Kit's own `onCallEnd` event)

You don't need to call anything to *end* billing — that happens automatically once ZEGOCLOUD's server confirms the room closed (usually within a second or two of the Kit's own `onCallEnd` firing locally). Just:

1. Stop polling `/calls/tick`.
2. Do one final `GET /calls/tick/:callSessionId` — it should already show `status: "ended"` with the authoritative final numbers. If it still says `"ongoing"`, wait ~2s and poll once more (there's a brief window between the call actually ending and ZEGOCLOUD's webhook reaching the backend).
3. Show the post-call summary from that response's `ended` object — `durationSeconds`, `totalCost`, `callerNewBalance`. Don't compute these client-side; the backend's numbers are authoritative (billing runs off wall-clock time and real debits, not anything the app tracked locally).

---

## 7. Full flow at a glance

```
1. App start/login → POST /calls/zego-token → init the Kit
2. User taps "Call" → POST /calls/can-start → show/hide the button accordingly
3. User confirms → POST /calls/register → then send the ZEGOCLOUD invitation
4. While call screen is open → poll GET /calls/tick/:id every ~5s
5. Kit's onCallEnd fires → poll /calls/tick once more for final numbers → show summary
```
