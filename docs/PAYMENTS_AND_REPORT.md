# Payment logging, products & premium report

## Payment logging (who, when, how many Stars)

- Every **successful_payment** from Telegram is:
  1. **Logged to console** as JSON (for Vercel logs / external logging).
  2. **Inserted into Supabase** `payments` table when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.

**Table** (run `docs/PAYMENTS_TABLE.sql` in Supabase):

- `payments`: `telegram_user_id`, `product`, `amount_stars`, `telegram_payment_charge_id`, `payload`, `result_url`, `report_text`, `created_at`
- `saju_cache`: `telegram_user_id`, `saju_result`, `updated_at` (so server can generate talisman/report after payment)

Use `payments` + `telegram_payment_charge_id` to reconcile with Telegram payouts.

---

## Products & prices

| Product   | Stars | Description                          |
|----------|-------|--------------------------------------|
| Talisman | 100   | AI talisman image (DALL-E 3)         |
| Report   | 500   | A4 premium Four Pillars report (GPT-4o) |

- **createInvoiceLink** is used (via `/api/create-invoice` or Supabase `create-invoice`).
- **No DALL-E or GPT-4o is called before payment.** Generation runs only in `api/fulfill-payment` after **successful_payment** is received and logged.

---

## Flow (security)

1. User pays in Telegram → Telegram sends **successful_payment** to webhook.
2. Webhook logs payment (DB + console), then calls **fulfill-payment** (async).
3. **fulfill-payment** loads Saju from `saju_cache`, calls **generateTalismanImage** or **generatePremiumReport**, updates `payments` with `result_url` / `report_text`, and notifies the user (e.g. “Open app to view”).

---

## Environment (Vercel)

- `TELEGRAM_BOT_TOKEN` – bot token.
- `MINI_APP_URL` – app URL (e.g. `https://kismet-beta.vercel.app`).
- `OPENAI_API_KEY` – for DALL-E 3 and GPT-4o.
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` – payment logging, `saju_cache`, and report storage (run `docs/PAYMENTS_TABLE.sql` first).

---

## English & report content

- Default language and report content are **English**.
- Report uses **Four Pillars of Destiny**, **Cosmic Type** (e.g. Wood Sage, Fire Phoenix), and sections: Personality, Wealth, Love, Career, Health (A4-length, GPT-4o).

---

## UI

- **Talisman**: 100 Stars; loading text “Gathering cosmic energy...”; share button; Telegram header color and `expand()`.
- **Report**: Result page has “Get Premium Report (500 Stars)”; report result page has premium layout and “Share with friends”.
- **Telegram**: `setHeaderColor('#0A0A0F')` and `expand()` in `initTelegram()`.
