import "@testing-library/jest-dom/vitest";

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://127.0.0.1:54321";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "sb_publishable_test";
process.env.SUPABASE_SECRET_KEY ??= "sb_secret_test";
process.env.APP_URL ??= "http://localhost:3000";
process.env.TOKEN_PEPPER ??= "0123456789abcdef0123456789abcdef";
process.env.OTP_PEPPER ??= "abcdef0123456789abcdef0123456789";
process.env.MAIL_TRANSPORT ??= "smtp";
process.env.SMTP_HOST ??= "127.0.0.1";
process.env.SMTP_PORT ??= "54325";
process.env.MAIL_FROM ??= "Trust Platform <no-reply@example.test>";
