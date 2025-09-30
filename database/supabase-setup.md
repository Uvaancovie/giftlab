# Supabase Setup

1. Create project → copy Project URL and anon + service_role keys.
2. SQL editor → run `schema.sql`, then `seed.sql`.
3. Storage → create bucket `invoices` (set public for MVP; switch to signed URLs later).
4. Authentication → Email OTP or magic link.
5. Copy keys into:
   - frontend/.env.local → anon
   - backend/.env → service role only (server-side)

Security:
- Never expose service role to frontend.
- Keep Amrod creds on backend only.