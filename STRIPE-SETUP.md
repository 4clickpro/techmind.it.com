# TechMind AI 2.0 — Stripe integration (development branch)

## Current status
The directory's sponsor buttons currently open **email inquiries**, not checkout. No Stripe account is connected, no live Payment Links are configured, no payments are collected, and no fulfillment is automated. The frontend file `payments.js` upgrades the two sponsor inquiry links to hosted Stripe checkout only after validated Stripe Payment Link URLs are entered.

## Products to create in Stripe
1. Featured listing: recurring $149 USD/month, with clearly described placement and cancellation terms.
2. Category sponsorship: recurring $499 USD/month, with written deliverables and availability confirmation.
3. Business kit: proposed $299 USD one-time; do not sell until kit is finished and fulfillment works.
4. Enterprise deployments: use approved contracts and Stripe invoices, not instant checkout.

## Safe initial setup
1. In Stripe, use a sandbox/test mode and create test recurring products and Payment Links. Check Stripe's supported test-link flow in the dashboard.
2. Copy **only public hosted Payment Link URLs** (typically `https://buy.stripe.com/...`) into the matching values in `payments.js` on the development branch. Do **not** add secret keys, restricted keys, webhook signing secrets, customer data, or account credentials to GitHub.
3. Verify each link's product, price, currency, billing interval, business identity, tax treatment, refund/cancellation policy, and receipt emails in Stripe.
4. Browser-test mobile and desktop navigation, payment cancellation, successful sandbox payment, and subscription management.
5. Do not activate live payment links until the sponsorship inventory and actual deliverables are approved.

## Full automation: separate backend required
A static GitHub Pages site cannot securely verify Stripe webhook signatures or perform trusted fulfillment. Deploy a small HTTPS serverless endpoint and store secrets in its platform's secret manager. Verify raw-body webhook signatures and handle relevant events such as `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, and `customer.subscription.deleted` as appropriate. Confirm the payment/subscription status, map a Stripe price ID to an approved product, process events idempotently by event ID, and store an audit trail. Activate sponsored listings only after editorial review and verified payment; handle cancellations, failed payments, disputes, and refunds. Digital kit delivery must wait until the actual files exist and a verified purchase is recorded. Never fulfill based on a redirect or browser query string alone.

## Launch gates
- Agree on sponsor placement rules, disclosure, capacity and cancellation/refund terms.
- Configure and test Payment Links and customer portal in sandbox.
- Choose/deploy a minimal backend and persistent datastore for webhooks and fulfillment.
- Run successful, failed, duplicate and canceled payment tests.
- Obtain owner approval before switching to live links or changing `master`.

This plan does not require n8n or moving the existing site off GitHub Pages.
