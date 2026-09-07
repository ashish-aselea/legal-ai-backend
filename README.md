# Legal AI Backend

Node.js backend built with Express and MongoDB (via Mongoose). Plain JavaScript, no build step.

## Prerequisites

- Node.js (v18+)
- npm
- MongoDB running locally (default: `mongodb://127.0.0.1:27017`)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your `.env` file (already included for local dev, or copy from example):

   ```bash
   cp .env.example .env
   ```

3. Make sure MongoDB is running locally, e.g.:

   ```bash
   mongod
   ```

## Run

**Development (auto-reload via nodemon):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The server starts on `http://localhost:5000` by default (configurable via `PORT` in `.env`).

## Health Check

```
GET /api/v1/health
```

Returns server status, uptime, and MongoDB connection state:

```json
{
  "status": "ok",
  "uptime": 12.345,
  "timestamp": "2026-09-01T00:00:00.000Z",
  "db": "connected"
}
```

## Authentication Flow

Auth is OTP based (no passwords). Both roles sign in with a **10 digit mobile number**.
While `NODE_ENV` is not `production`, a **static OTP** (`STATIC_OTP`, default `123456`) is used
instead of a real SMS gateway, and it is also returned in the `send-otp` response for easy testing.

```
send-otp  ->  verify-otp  ->  [new number?]
                               |-- yes -> registrationToken -> "How do you want to join"
                               |            |-- As user   -> POST /auth/signup/user   -> accessToken -> home
                               |            |-- As lawyer -> POST /auth/signup/lawyer -> accessToken -> pending screen
                               |-- no  -> accessToken -> home (or pending screen if lawyer not yet approved)
```

Two kinds of JWT are issued:

| Token               | Issued by                    | Lifetime                        | Used for                                     |
| ------------------- | ---------------------------- | ------------------------------- | -------------------------------------------- |
| `registrationToken` | `verify-otp` (new number)    | `REGISTRATION_TOKEN_EXPIRES_IN` | Only the two signup endpoints                 |
| `accessToken`       | `verify-otp` / signup        | `JWT_EXPIRES_IN`                | All logged-in APIs (`Authorization: Bearer`)  |

A lawyer receives an `accessToken` immediately after signup, but their `approvalStatus` stays
`pending` until an admin approves them. The app should call `GET /auth/me` on launch and use
`canAccessHome` to decide between the home screen and the "under review" screen.

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Auth

| Method | Endpoint              | Auth                | Description                                          |
| ------ | --------------------- | ------------------- | ---------------------------------------------------- |
| POST   | `/auth/send-otp`      | –                   | `{ mobile }` – sends (static) OTP                     |
| POST   | `/auth/verify-otp`    | –                   | `{ mobile, otp }` – logs in or starts registration    |
| POST   | `/auth/signup/user`   | `registrationToken` | `{ name, email, city }`                               |
| POST   | `/auth/signup/lawyer` | `registrationToken` | Lawyer form fields (below)                            |
| GET    | `/auth/me`            | `accessToken`       | Current profile, `approvalStatus`, `canAccessHome`    |

**Lawyer signup body:**

```json
{
  "name": "Adv. Rahul Sharma",
  "email": "rahul@example.com",
  "iAmA": "Practicing lawyer",
  "barCouncilEnrollmentNumber": "D/1234/2015",
  "practiceArea": "Criminal",
  "yearsOfExperience": 8,
  "cityJurisdiction": "Jaipur, Rajasthan"
}
```

Allowed dropdown values:

- `iAmA`: `Practicing lawyer`, `Retired judge`
- `practiceArea`: `Criminal`, `Family`, `Corporate & Civil`

### Admin

Admin APIs require an `accessToken` belonging to a user with `role: "admin"`.

| Method | Endpoint                       | Description                                       |
| ------ | ------------------------------ | ------------------------------------------------- |
| GET    | `/admin/lawyers?status=pending`| List lawyers (`pending` / `approved` / `rejected`)|
| PATCH  | `/admin/lawyers/:id/approve`   | Approve a lawyer profile                          |
| PATCH  | `/admin/lawyers/:id/reject`    | `{ rejectionReason }` – reject a lawyer profile   |

There is no admin signup flow. Create an admin (then log in with the normal OTP flow):

```bash
npm run create:admin -- 9000000001 "Super Admin"
```

### Health

| Method | Endpoint      | Description                              |
| ------ | ------------- | ---------------------------------------- |
| GET    | `/health`     | Server status, uptime, MongoDB state     |

## Project Structure

```
server.js                 Entry point: connects to MongoDB and starts the HTTP server
app.js                    Express app setup (middleware, routes, error handling)
config/
  env.js                  Environment variable loading
  db.js                   MongoDB connection (Mongoose)
models/
  User.js                 User account (mobile, role: user | lawyer | admin)
  LawyerProfile.js        Lawyer form data + approvalStatus
  OtpVerification.js      OTP records (auto-expire via TTL index)
controllers/
  auth.controller.js      OTP, signup, /me
  admin.controller.js     Lawyer approve / reject
routes/
  health.routes.js        GET /api/v1/health
  auth.routes.js          /api/v1/auth/*
  admin.routes.js         /api/v1/admin/*
middleware/
  auth.js                 JWT authentication + role guard
  validate.js             Zod request body validation
  errorHandler.js         Centralized error handling + 404 handler
validators/
  auth.validators.js      Zod validation schemas
utils/
  jwt.js                  Token sign / verify helpers
  asyncHandler.js         Async route error forwarding
scripts/
  createAdmin.js          Seed an admin account
```

## Environment Variables

| Variable                        | Description                              | Default                              |
| ------------------------------- | ---------------------------------------- | ------------------------------------ |
| `PORT`                          | Port the server listens on               | `5000`                               |
| `MONGODB_URI`                   | MongoDB connection string                | `mongodb://127.0.0.1:27017/legal-ai` |
| `NODE_ENV`                      | Environment                              | `development`                        |
| `JWT_SECRET`                    | Secret used to sign JWTs                 | –                                    |
| `JWT_EXPIRES_IN`                | Access token lifetime                    | `30d`                                |
| `REGISTRATION_TOKEN_EXPIRES_IN` | Registration token lifetime              | `15m`                                |
| `STATIC_OTP`                    | OTP used while no SMS gateway is wired   | `123456`                             |
| `OTP_EXPIRY_MINUTES`            | OTP validity window                      | `5`                                  |
