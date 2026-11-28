# Free AI Visibility Audit form: setup

How it works:

1. Visitors fill in the form on `/aeo-agency/` (email + website URL).
2. A form provider stores the submission. Default provider: **FormBold (free plan)**.
3. A GitHub Action (`.github/workflows/sync-leads.yml`, every 15 minutes) reads new submissions through the provider's API and creates a page in Notion **Leads & Clients** with Stage **New**. No Vercel, no server.

Nothing here is live until the branch is merged to `master`, the `FORM_ID` placeholder is replaced, and the secrets below exist.

## Why FormBold and not Formspree

Formspree's **Free plan has no API access** (Professional, about $20/month billed yearly, is the lowest tier with it), so a Formspree free form cannot feed the sync. FormBold's **Free plan includes the submissions REST API** (250 submissions/month). The script is adapter-based: to use Formspree instead, see "Using Formspree" at the bottom.

## Steps for Paul

### 1. Create the form (FormBold, free)

1. Sign up at https://formbold.com (free plan, no card) and create a form, for example "AEO audit".
2. In **Form Setup**, copy the endpoint. It looks like `https://formbold.com/s/AbC12`. The last part is the **form ID**.
3. In the form's **Settings**: turn on **HTTP API** (Email Configuration card) and turn on **Honeypot Protection** (Spam & Security).
4. In **API & MCP > API Tokens**, create a token (name it "GitHub lead sync") and copy it once.

### 2. Point the page at your form

In `aeo-agency/index.html`, replace the single `FORM_ID` in the form's `action` (`https://formbold.com/s/FORM_ID`) with your form ID. Search the file for `FORM_ID`; nothing else needs editing. While the placeholder is still there, the page shows "not connected yet" instead of sending, so no lead can be lost.

### 3. Create the Notion connection

1. In Notion: Settings > Connections > Develop or manage integrations > New integration (internal). Name it "AEO Agency Website". Capabilities: **Read content** and **Insert content**.
2. Open the **Leads & Clients** database > ... menu > **Connections** > add "AEO Agency Website".
3. Copy the integration secret.

### 4. Add the GitHub secrets

Repo **Settings > Secrets and variables > Actions > New repository secret**:

| Name | Value |
|---|---|
| `NOTION_TOKEN` | the Notion integration secret |
| `FORMBOLD_API_TOKEN` | the FormBold API token |
| `FORMBOLD_FORM_ID` | the form ID from step 1 (e.g. `AbC12`) |

Never paste these into chat, issues or files in the repo. The Notion data source ID is already set in the workflow.

### 5. Test with a test lead

1. After merging, open the live `/aeo-agency/` page and submit `test@example.com` with `https://example.com`.
2. Repo **Actions > Sync website leads to Notion > Run workflow**. First run with **dry run** ticked: the log should say `Fetched 1 submission(s)` and `dry-run: would create formbold:...`.
3. Run it again with dry run unticked. A page named `example.com` should appear in Leads & Clients with Source "Website form", Stage "New", Next Action "intake", and Notes containing the submitted time and `Submission ID: formbold:...`.
4. Run it a third time. The log should show `duplicate: 1` and Notion should still have one page.
5. Delete the test page in Notion.

The first real run is also the check on FormBold's response format. If it logs `Fetched 0` although the FormBold dashboard shows submissions, add a repo variable `DEBUG_SHAPE` = `1` (Settings > Secrets and variables > Actions > Variables), run once, and read the `shape:` line (field names and types only, no values).

## Good to know

- Logs never contain emails, websites or API response bodies (the repo is public, so logs are public).
- Submissions are matched by submission ID first, then by email + website. The script looks back 7 days (`LOOKBACK_DAYS` variable). If you delete a lead in Notion within that window, it can be re-created. Raise or lower `LOOKBACK_DAYS` to suit.
- Spam: honeypot hits are filtered by FormBold and again by the script. Invalid emails or URLs are skipped and logged by ID only.
- Scheduled workflows only run from `master`, and GitHub pauses them after 60 days without repo activity. Re-enable under Actions if that happens.
- Until secrets exist, scheduled runs print a notice and exit successfully. Manual runs fail with a list of what is missing.
- FormBold Free: 250 submissions/month and a 30-day archive. No custom thank-you page, so a visitor with JavaScript off sees FormBold's default thank-you page.
- Privacy: the form shows no privacy or consent text. Add whatever notice you want before going live.

## Using Formspree instead (paid)

Formspree needs the **Professional** plan or higher for API access. Then:

1. Create the Formspree form and set the page's form `action` to `https://formspree.io/f/<your form id>`.
2. In the form's Settings enable **HTTP API** and copy a read-only API key.
3. Add secrets `FORMSPREE_API_KEY` and `FORMSPREE_FORM_ID`, and a repo **variable** `LEAD_SOURCE` = `formspree`.

Adding another provider means writing one function in `scripts/sync-leads.mjs` that returns `{ id, createdAt, fields, spam }` and registering it in `ADAPTERS`.
