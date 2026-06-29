#!/usr/bin/env node

import { randomBytes } from "node:crypto";

function secret() {
  return randomBytes(48).toString("base64url");
}

const tokenPepper = secret();
const otpPepper = secret();

console.log(`# Proofboard private beta environment template
# Do not commit real values. Paste these into the deployment provider's
# encrypted environment-variable settings.

NEXT_PUBLIC_SUPABASE_URL=https://YOUR-SUPABASE-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

APP_URL=https://YOUR-DEPLOYED-APP.example.com

TOKEN_PEPPER=${tokenPepper}
OTP_PEPPER=${otpPepper}

BETA_ALLOWED_EMAILS=founder@example.com,design-partner@example.com

MAIL_TRANSPORT=resend
RESEND_API_KEY=YOUR_RESEND_API_KEY
MAIL_FROM=Proofboard <no-reply@YOUR-VERIFIED-DOMAIN.example>
`);
