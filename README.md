# Personal Loan Assistant

The Hero FinCorp instant personal loan journey (from login to disbursal) as a guided chat. It follows the stages and screens in the Figma file "Untitled" (AaIKvRjdoPLjaGwlgQPdW9) and uses the same branding as the two-wheeler loan chat: Filson Pro, the dark green palette, the bot avatar and the chat shell.

This is a front-end prototype. Every customer, bank, KYC and credit response is mocked, so no data leaves the browser.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5180/.

| Command             | What it does                                 |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Starts the dev server on port 5180           |
| `npm run build`     | Runs the typecheck, then the production build in `dist/` |
| `npm run preview`   | Serves the built `dist/` on port 5180        |
| `npm test`          | Unit tests (pricing, validation, routing, AI understanding) |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | TypeScript, no emit                          |

## Deploy on Vercel

The project is a static Vite site; `vercel.json` sets the build (`npm run build`, output `dist`). All five links work from the same deployment: `/`, `/?journey=express`, `/?journey=ai`, `/?view=ai-ideas` and `/?view=home`. The AI journey needs no API keys or environment variables.

**From GitHub (recommended):** push this folder to a repository, then in Vercel choose **Add New → Project**, import the repository and press **Deploy**. Every push redeploys.

**From your computer:** in this folder run `npx vercel` and follow the prompts (log in, accept the detected settings). Add `--prod` to publish to the production URL.

## Links

| Link | What it is |
| ---- | ---------- |
| http://localhost:5180/ | **Standard journey**: the Figma journey screen by screen, 6 stages and 26 screens |
| http://localhost:5180/?journey=express | **Express journey**: the same loan, branding and components in 4 stages and 12 screens |
| http://localhost:5180/?journey=ai | **AI journey**: a clickable prototype of the AI automation ideas, 4 stages and 12 steps |
| http://localhost:5180/?view=ai-ideas | **AI ideas**: the ideas page to share, with the AI flow, ideas by Figma stage, roadmap, guardrails and KPIs |
| http://localhost:5180/?view=home | **Home + AI assistant**: the Hero FinCorp app home screen with the AI assistant on it; tapping it opens the chat |

### Home screen with the AI assistant

`/?view=home` starts where the customer does: on the Hero FinCorp app's home screen (`public/home/home-screen.png`, the screenshot shared on 28 Oct 2026, unchanged), whose banner already says "Mayank, you are approved for a loan of ₹3,00,000".

- **The assistant:** the designer's waving robot (`public/home/robot.webp`, from the log-in design, unchanged) in a round button with an **AI** tag. It sits in the gap above the bottom nav, on the cards' right edge, so it covers nothing. A greeting points at it: "Hi Mayank 👋 I’m your AI assistant · Get your ₹3,00,000 loan in minutes" (× hides it).
- **Opening the chat:** the assistant, the greeting, **Apply Now** and the **Personal Loan** tile all open the chat, which slides up under the status bar. The back arrow in its header returns to the home screen, and opening it again carries on where the customer left off.
- **A light first screen:** the AI chat opens with one line, "Hi Mayank 👋 I’m your Hero FinCorp AI assistant. How can I help you today?", the message box and two suggestions; no progress bar or loan card yet. Typing **personal loan** (or tapping it) brings up the loan card, rates and fees, and "How much do you need, and what for?". A message that already says what they need ("2 lakh for my wedding") goes straight to what was understood, and other questions are answered in place. `/?journey=ai` keeps its own welcome.
- **Prototype options:** there is no bar across the top. The floating black button at the top right opens a menu: which journey the assistant opens (AI, express or standard; `&agent=ai|express|standard`), the outcome (`&scenario=…`), **AI notes** (off here until ticked), **Restart** and **AI ideas**. A tap outside or Escape closes it.
- **On a phone:** the home screen fills the width and scrolls, and the assistant stays at the bottom right of the screen.

### What the express journey changes

| Standard | Express |
| -------- | ------- |
| Phone, T&C checkbox, then a separate CERSAI consent on the PAN screen | One phone screen; consent is a single line above **Get OTP** |
| OTP, then **Verify** | OTP verifies itself on the last digit; "Wrong number? Change it" |
| Permissions screen (location, camera, notifications) up front | Removed; the phone asks for camera and location when video KYC starts |
| Loan amount chosen before the credit check | Chosen on the offer, within the approved limit |
| PAN confirm, other details (parents' names, employment, industry, company), CKYC addresses: 3 screens | One profile card: CKYC details to confirm, plus employment, company, monthly take-home pay and purpose |
| Offer, then a separate Protection Plus screen | One offer card: amount, tenure, live EMI, fee, amount received, and an optional Protection Plus tick |
| Bank: company confirm, account type, search, account number typed twice | Pick the bank and approve on Account Aggregator; the account is found for you |
| Separate upgrade screen after the bank check | Limit rises automatically; "Change amount" on the review card if you want more |
| KYC intro, Aadhaar, Aadhaar OTP, details confirm, selfie | Aadhaar and OTP on one card; details shown and saved automatically |
| Selfie and, later, video KYC | One video KYC call, which also takes the photo |
| Work details, purpose, about-you (office address, emails, income, marital, education, language) | Removed; income and purpose are on the profile card, email comes from CKYC |
| Repayment setup with UPI ID typing, then mandate, then sanction, then e-sign intro, document and OTP | Review & sign on one card, then AutoPay in one approval (no UPI ID to type) |

The header also shows the time left ("About 4 min left"), and the welcome card lists what to keep handy (PAN, Aadhaar-linked mobile, net banking). The express link supports the same `scenario` values; "Welcome back" starts are only on the standard link.

## The AI journey

`/?journey=ai` shows the ideas on the AI ideas page working, on the same branding and components. The AI is simulated with rules and mock data (`src/ai/`), so it runs offline, needs no keys and sends nothing anywhere.

| Step | What the AI does |
| ---- | ---------------- |
| Say what you need | Reads the first message in English or Hinglish ("Mujhe 3 lakh chahiye 2 saal ke liye, ghar repair") for amount, purpose, tenure and urgency, and plays it back |
| OTPs (login, Aadhaar, e-sign) | Reads the code from the SMS after one **Allow**, the way Android's SMS consent prompt works |
| PAN | Scans the card (OCR), fetches CKYC and checks the names match |
| Bank and analysis | One Account Aggregator consent; reads salary, employer and existing EMIs, plus the bureau and fraud checks, before the offer |
| Offer | Plans sized to the salary (Comfortable, Manageable, Stretch), with a recommended one and a reason for the cover suggestion |
| Aadhaar and video KYC | Cross-checks PAN and Aadhaar details, then readiness, liveness and face-match checks on the call |
| Review & sign | "Explain in simple words" turns the Key Fact Statement into plain English or Hindi |
| AutoPay and after | Lines the EMI date up with salary day; after disbursal, reminders, answers and top-ups |
| Declined | Turns the credit reasons into a plan to get approved next time |

The message box is live in this journey only: type a question at any step ("What will my EMI be?", "Why do you need my Aadhaar?", "Is my data safe?") and the assistant answers in place, citing its source, then takes you back to the step. Changing your mind ("actually I need 3 lakh") before the analysis updates the request.

The **AI notes** tick box in the top bar shows or hides a short note under each step on which idea it demonstrates. The `scenario` values above work here too.

| Step | Demo input |
| ---- | ---------- |
| First message | Tap an example, type your own, or "Skip — just show me what I can get" |
| OTPs | **Allow** fills the code; **Deny** or "I’ll type it myself" switches to typing, where `0000` / `000000` shows the error |
| PAN | **Scan PAN card**, or **Type PAN instead** (any valid PAN, e.g. `ABCDE1234F`) |
| Aadhaar | 12 digits starting 2–9, e.g. `4567 1234 6782` |

## Scenarios and starting points

The dark bar at the top picks the outcome and where the customer starts. Both are kept in the URL, so you can link to a specific case:

```
http://localhost:5180/?scenario=conditional&start=esign
```

| `scenario`              | Outcome                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| `disbursed` (default)   | Approved, money transferred, then the sanction letter, e-sign copy and rating |
| `conditional`           | "Loan Approved Conditionally", with the document, tele-verification and disbursal steps |
| `bankRetry`             | The first bank verification fails, so the customer can retry or change bank |
| `rejected`              | The credit check declines the application                                |

| `start`                       | First message                                                      |
| ----------------------------- | ------------------------------------------------------------------ |
| `new` (default)               | Welcome card and phone login                                       |
| `kyc`                         | "Welcome back" resume card, continuing at bank verification and KYC |
| `work` / `repayment` / `esign` | Resume card, continuing at that stage                             |

## Demo inputs

| Step                 | Works                                    | Shows the error        |
| -------------------- | ---------------------------------------- | ---------------------- |
| Phone                | Any 10-digit mobile starting with 6–9    | Fewer digits, or terms not accepted |
| Login OTP            | Any 4 digits                             | `0000`                 |
| PAN                  | Any valid PAN, e.g. `ABCDE1234F`         | A malformed PAN        |
| Bank account         | Any 9–18 digits, entered twice           | The two entries differ |
| Aadhaar              | 12 digits starting 2–9, e.g. `4567 1234 6782` | A malformed number |
| Aadhaar and e-sign OTP | Any 6 digits                           | `000000`               |
| UPI ID               | Any `name@bank`                          | Missing the `@bank` part |

The customer is always "Mayank Sharma" (the Figma's sample customer).

## Journey

The header shows the current stage and the share of the application that is complete: Personal Details 10%, Loan Offer 20%, KYC 40%, Work Details 60%, Re-Payment 80%, E-sign 90%, then 100%.

1. **Getting started:** welcome card with rates and fees, phone and OTP, app permissions, and choosing an amount and tenure with a live EMI.
2. **Personal details:** PAN with a CERSAI consent, confirming the name, family and employment details, and CKYC addresses with an optional mailing address.
3. **Loan offer:** credit check, then the offer with Edit Offer and the "eligible for up to ₹5,00,000" upgrade, and Protection Plus insurance.
4. **KYC:** bank account through Account Aggregator, with the retry state and the optional upgrade, then Aadhaar, the DigiLocker OTP and a selfie liveness check.
5. **Work details:** company and office address, work email verification, income, loan purpose, and the about-you details.
6. **Re-payment:** disbursal and EMI schedule, e-mandate or UPI autopay, then video KYC or its alternatives (reverse penny drop, address visit).
7. **E-sign:** loan summary with the APR, the Legality agreement and OTP signing, then the final disbursed or conditional screen.

## Pricing

All the loan maths lives in `src/journey/pricing.ts` and is tested in `pricing.test.ts`. The Figma's numbers are reproduced exactly; for example, ₹3,00,000 over 36 months at 19.25% gives an EMI of ₹11,035.

- **EMI:** reducing balance at 19.25% a year.
- **Fees:** a 2.5% processing fee plus 18% GST, deducted at disbursal.
- **Protection Plus:** ₹200 a month, added on top of the EMI.
- **APR:** computed from the net amount disbursed.
- **First EMI:** due on the 8th, skipping a month when that is less than 15 days away.

## Structure

```
src/
  App.tsx              prototype bar (scenario, start, restart) and the chat
  chat/Chat.tsx        header with stage progress, bot and user bubbles, typing indicator
  journey/
    Journey.tsx        chat engine: runs a flow (standard or express) one step at a time, with replies, typing delay, auto-scroll
    types.ts           Answers, StepDef, scenarios and start points
    stages.ts          the six stages and their progress
    mock.ts            customer, banks, addresses, resume answers
    pricing.ts         EMI, fees, APR, EMI dates
    format.ts          rupees, dates, masks
    validate.ts        phone, PAN, Aadhaar, account, UPI, email checks
  steps/               one file per stage; each step is a component plus its routing
  express/             the express journey (?journey=express): its stages, steps and app shell
  ai/                  the AI journey (?journey=ai) and the AI ideas page (?view=ai-ideas)
    nlu.ts             reads amount, purpose, tenure and urgency from a message (English and Hinglish)
    assistant.tsx      answers typed questions at any step, with sources
    insights.ts        mock statement and bureau insights; affordability plans
    ideas.ts           the ideas, roadmap phases and AI flow shown on the ideas page
  home/HomeApp.tsx     the home screen with the AI assistant (?view=home), opening any of the journeys
  ui/                  shared controls (cards, fields, chips, OTP, slider, address picker, icons)
  styles/app.css       Hero FinCorp tokens and all styles
  styles/ai.css        styles for the AI journey and the ideas page
  styles/home.css      styles for the home screen, the assistant button and the chat sheet
public/
  brand/logo.svg       Hero FinCorp logo
  figma/               artwork exported from the Figma file, unchanged
  home/                the app home screen screenshot and the designer's robot, unchanged
```

To add or reorder a step, edit its file in `src/steps/`. Each step declares its stage, progress, component, `next()` route and the typing label shown before the next step. `routing.test.ts` walks the whole journey to catch broken routes.

## Figma assets used

| File | Where it is used |
| ---- | ---------------- |
| `spinner.svg` | Short waits (CKYC address, bank statement, DigiLocker, selfie match, mandate, video KYC, signing) |
| `loader-coin.gif` | Credit check |
| `check-icon.svg` | Completed stages in the resume and e-sign lists |
| `insurance-shield.png` | Protection Plus card |
| `benefit-emi-cover.svg`, `benefit-loan-cover.svg`, `benefit-teleconsult.svg` | Protection Plus benefits |
| `kyc-step-consent.gif`, `kyc-step-aadhaar.gif` | KYC intro steps |
| `verified-badge.svg` | Loan disbursed screen |

The small line icons (phone, camera, bank and so on) are simple inline SVGs in `src/ui/icons.tsx`, not exports from the file.
