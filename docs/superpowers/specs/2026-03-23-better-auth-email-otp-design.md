# Better Auth Email OTP Design

## Goal

Replace magic-link authentication with Better Auth's email OTP plugin, restore app-level session handling, and expose authenticated user state to the dashboard header.

## Context

- The current app has no working auth implementation.
- `src/components/UserButton.tsx` exists, but the home header currently passes `user={null}`.
- Convex, Better Auth, and `@convex-dev/better-auth` are already installed.
- The product requirement is mail-only sign-in for the CMS admin experience.

## Decision

Use Better Auth email OTP as the only sign-in method for now.

- Users enter an email address.
- The app requests a 6-digit OTP via Better Auth's `emailOTP` plugin.
- Users enter the code to complete sign-in with `signIn.emailOtp`.
- Better Auth remains the session authority.
- Convex receives auth through the `@convex-dev/better-auth` Convex plugin.

## Architecture

### Convex auth component wiring

Install the Better Auth Convex component in `convex/convex.config.ts` with the mounted name `betterAuth`.

This enables generated `components.betterAuth` access and allows server code to register Better Auth routes through Convex HTTP routing.

### Server auth module

Create `convex/auth.ts`.

Responsibilities:

- Create the Better Auth Convex client with `createClient(components.betterAuth)`.
- Export `betterAuthComponent` for route registration and auth helpers.
- Export `createAuth(ctx, opts?)` that returns a Better Auth instance configured with:
  - `database: betterAuthComponent.adapter(ctx)`
  - `basePath: "/api/auth"`
  - `baseURL` pointing at the public app URL
  - `emailOTP(...)`
  - `convex()`
- Implement `sendVerificationOTP` with an app-local transport hook.

The OTP plugin configuration should use:

- 6-digit codes
- short expiration window (5 minutes)
- limited attempts (3)
- sign-up enabled unless the product later restricts invites

### Auth HTTP routing

Create `convex/http.ts` and register Better Auth routes through `betterAuthComponent.registerRoutes(http, createAuth)`.

The app should call Better Auth via the Convex site origin using the same `/api/auth/*` path that the component exposes.

### Client auth module

Create `src/lib/auth-client.ts`.

Responsibilities:

- Create a Better Auth React client.
- Include `emailOTPClient()` and `convexClient()` plugins.
- Point the client `baseURL` to `VITE_CONVEX_SITE_URL` so browser auth requests hit the Convex HTTP routes directly.

### App provider wiring

Update `src/router.tsx` to replace `ConvexProvider` with `ConvexBetterAuthProvider` from `@convex-dev/better-auth/react`.

Responsibilities:

- Keep the existing `ConvexReactClient` singleton behavior.
- Pass the shared Convex client and auth client into `ConvexBetterAuthProvider`.
- Allow Convex auth tokens to be refreshed from the Better Auth session automatically.

### Session-aware UI

Create a dedicated sign-in surface, likely `src/routes/sign-in.tsx`.

The UI is a two-step flow:

1. Enter email and request OTP.
2. Enter OTP and complete sign-in.

Behavior:

- Use `authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })` to send the code.
- Use `authClient.signIn.emailOtp({ email, otp })` to verify the code.
- Show resend, loading, invalid code, expired code, and too-many-attempts states.
- Preserve the requested email between steps in local component state.

### Header integration

Update `src/routes/index.tsx` to read the current session and render either:

- a sign-in CTA when unauthenticated, or
- `UserButton` with email/name/image from session user data when authenticated.

Update `src/components/UserButton.tsx` to integrate with the Better Auth session/logout flow cleanly and remove placeholder-only behavior if needed.

## Email delivery

The server-side OTP sender should be isolated behind a small helper module so the transport can be swapped later.

Recommended shape:

- `src/lib/auth/send-auth-email.ts` or `convex/lib/sendAuthEmail.ts`

For initial development, if no provider credentials are configured, the helper may log the OTP in development rather than silently failing. Production should require a real provider.

## Error handling

- Invalid OTP: inline field error and allow retry.
- Expired OTP: show message and allow resend.
- Too many attempts: require requesting a new code.
- Unknown email: Better Auth may auto-register on first sign-in; the UI should present this as a normal sign-in flow.
- Missing email transport config: fail loudly in development.

## Testing strategy

Add targeted tests before implementation changes:

- auth client/provider wiring test
- sign-in route behavior tests
  - requests OTP
  - transitions to verify step
  - submits OTP
  - surfaces request/verify errors
- header rendering tests
  - signed out shows sign-in action
  - signed in shows `UserButton` data
  - logout calls auth action

If server-side auth config is structured as pure helpers, add unit coverage for config shaping where practical.

## Files expected to change

- Modify `convex/convex.config.ts`
- Create `convex/auth.ts`
- Create `convex/http.ts`
- Create `src/lib/auth-client.ts`
- Create `src/lib/auth/` helper file(s) for email transport or session helpers
- Modify `src/router.tsx`
- Modify `src/routes/index.tsx`
- Create `src/routes/sign-in.tsx`
- Modify `src/components/UserButton.tsx`
- Create test files under `src/**/*.spec.tsx`

## Non-goals

- RBAC
- social login
- password auth
- phone/SMS OTP
- invite-only onboarding
- production email provider selection beyond a thin transport seam
