# TechMind agent packages and demo
## Status
Static packages and local illustrative inquiry demo are implemented. The local demo makes no API calls and sends no email/CRM actions. The inquiry form opens the visitor's email client; it is not a submitted lead form.

An optional OpenAI Responses API backend is supplied in backend/demo-server.mjs. It is NOT active until separately deployed and configured. GitHub Pages cannot execute this backend. Do not paste secrets into any frontend file or GitHub.

## Deployment
1. Confirm which repository serves techmind.it.com. Both techmind.it.com and techmind-site currently contain CNAME claims; do not change DNS based on these files alone. These changes are proposed for 4clickpro/techmind.it.com.
2. Serve the root static assets or copy them into the actual hosting build's public output. This repository also contains framework/Hugo files: the correct publication output must be confirmed before merge.
3. Verify the links from the final deployed origin. The AIagent and Vibecodings changes link to https://techmind.it.com/packages.html and demo.html.
4. Use Node 24+ for the optional backend. Set OPENAI_API_KEY, OPENAI_MODEL, DEMO_ORIGIN=https://techmind.it.com, DEMO_STATE_DIR to a private persistent writable directory and optionally DEMO_DAILY_REQUEST_LIMIT (default 100). Set model to a tested available Responses-compatible model. No paid API calls were tested in this change.
5. Start node backend/demo-server.mjs behind a TLS reverse proxy routing /api/demo to loopback port 8787. Restrict filesystem permissions and run unprivileged.
6. Leave backend secrets and usage.sqlite outside any web-served directory. Keep one backend instance for this SQLite-based budget. Back up state; do not use an ephemeral disk. It reserves every accepted call before contacting OpenAI, including failed calls.
7. Apply edge bot protection and rate limiting. The backend checks origin, but origin headers are spoofable outside browsers, so they are NOT authentication. It caps concurrency, body size, input length, output tokens, per-source calls and persistent daily calls. Behind a proxy all users share the proxy address limit unless you implement verified source identity. It ignores forwarded headers deliberately.
8. After deployment and review, set demo-config.js endpoint to /api/demo. The UI then discloses sending sample text to the configured model provider. Validate privacy notices and actual retention terms before enabling it.
9. Test denial, rate limits, persistence after restart, timeouts and the real configured model. Add operator alerts and cost monitoring. Request caps bound call volume, not an exact dollar spend.
10. Keep this demo without executable tools. Production agent permissions, customer data processing and security assessment are a separate project.

## PayPal
Existing AIagent PayPal SDK and hosted button code is preserved. No payment was initiated, amounts changed, or paid-service entitlement implemented. Verify each button's product, amount and merchant before connecting it to a custom package. Use server-verified payment events if automated fulfillment is added; never fulfill solely on a browser success callback.

## Inquiry
The proposed sales inquiry uses 4clickpro@gmail.com, already present in the other TechMind repository. Confirm this is the intended business inbox before launch.

## Verification
JavaScript syntax, local internal-link/file consistency, sample demo and validation paths are checked. Browser visual QA and live hosting behavior require the actual deployment environment. No live API key, payment or deployment was exercised.
