#!/usr/bin/env node
/**
 * sync-leads.mjs - copy new website-form submissions into the Notion
 * "Leads & Clients" database as stage "New".
 *
 * Runs from .github/workflows/sync-leads.yml (cron + manual). No dependencies,
 * Node 18+ (global fetch). Nothing is written to disk and no lead data is ever
 * committed. Logs contain counts and submission ids only - never emails,
 * websites or API response bodies (this repo is public, so Action logs are too).
 *
 * Source adapters (pick with LEAD_SOURCE):
 *   formbold   default. Submissions read API is available on FormBold's FREE plan.
 *   formspree  needs Formspree Professional+ (API access is not on Free/Personal).
 *   file       local testing only: LEAD_SOURCE_FILE=<json array of {id,created_at,fields}>
 * To add a provider, write one function that returns normalized submissions
 * ({ id, createdAt, fields, spam }) and register it in ADAPTERS.
 *
 * Notion mapping mirrors website/lib/notion-leads.ts (Notion-Version 2025-09-03,
 * parent { type: "data_source_id" }).
 *
 * Dedupe (no state in the repo): before creating, read the existing
 * "Website form" pages from Notion and skip a submission if its id is already in
 * a page's Notes, or if the same email + website is already present.
 */

const NOTION_VERSION = '2025-09-03';
const NOTION_API = 'https://api.notion.com/v1';
const SOURCE_NAME = 'Website form';
const STAGE_NEW = 'New';
const NEXT_ACTION = 'intake';
const ID_PREFIX = 'Submission ID: ';

const env = (name) => (process.env[name] || '').trim();
const flag = (name) => ['1', 'true', 'yes'].includes(env(name).toLowerCase());

const log = (msg) => console.log(msg);
const notice = (msg) => console.log(`::notice::${msg}`);

/* ---------- small helpers ---------- */

class ApiError extends Error {}

async function http(label, url, init = {}, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
    } catch {
      if (attempt >= attempts) throw new ApiError(`${label}: network error`);
      await sleep(1000 * attempt);
      continue;
    }
    if (res.ok) return res.json();
    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < attempts) {
      const wait = Number(res.headers.get('retry-after')) || attempt;
      await sleep(Math.min(wait, 30) * 1000);
      continue;
    }
    // Never include the response body: it can echo submitted values.
    let code = '';
    try { code = (await res.json()).code || ''; } catch { /* ignore */ }
    throw new ApiError(`${label}: HTTP ${res.status}${code ? ` (${code})` : ''}`);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseDate(value) {
  if (!value) return null;
  let text = String(value).trim();
  // Providers return timestamps without a zone (e.g. 2026-11-28T17:21:42.707632); treat as UTC.
  if (!/(Z|[+-]\d{2}:?\d{2})$/i.test(text)) text += 'Z';
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pick(fields, names) {
  const lower = Object.fromEntries(Object.entries(fields || {}).map(([k, v]) => [k.toLowerCase(), v]));
  for (const name of names) {
    const value = lower[name];
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

function firstArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const key of ['submissions', 'data', 'results', 'items']) {
      if (Array.isArray(data[key])) return data[key];
    }
    const any = Object.values(data).find(Array.isArray);
    if (any) return any;
  }
  return [];
}

function describeShape(data, items) {
  // Keys and types only - no values.
  const top = data && typeof data === 'object' && !Array.isArray(data)
    ? Object.entries(data).map(([k, v]) => `${k}:${Array.isArray(v) ? 'array' : typeof v}`).join(',')
    : Array.isArray(data) ? 'array' : typeof data;
  const item = items[0] && typeof items[0] === 'object' ? Object.keys(items[0]).join(',') : '-';
  const fields = items[0] && typeof items[0].fields === 'object' && items[0].fields
    ? Object.keys(items[0].fields).join(',') : '-';
  log(`shape: top=[${top}] item=[${item}] fields=[${fields}]`);
}

/* ---------- source adapters ---------- */

async function formbold({ strict }) {
  const token = env('FORMBOLD_API_TOKEN');
  const formId = env('FORMBOLD_FORM_ID');
  if (!token || !formId) return { missing: ['FORMBOLD_API_TOKEN', 'FORMBOLD_FORM_ID'].filter((n) => !env(n)) };
  const data = await http(
    'FormBold submissions',
    `https://api.formbold.com/api/forms/${encodeURIComponent(formId)}/submissions`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
  );
  const items = firstArray(data);
  if (flag('DEBUG_SHAPE')) describeShape(data, items);
  if (!items.length && !Array.isArray(data) && strict) log('FormBold returned no list in the response.');
  return {
    submissions: items.map((item) => ({
      id: `formbold:${item.id}`,
      createdAt: parseDate(item.created_at),
      fields: item.fields || {},
      spam: item.is_spam === true,
    })),
  };
}

async function formspree() {
  const key = env('FORMSPREE_API_KEY');
  const formId = env('FORMSPREE_FORM_ID');
  if (!key || !formId) return { missing: ['FORMSPREE_API_KEY', 'FORMSPREE_FORM_ID'].filter((n) => !env(n)) };
  const { createHash } = await import('node:crypto');
  const submissions = [];
  const limit = 100;
  for (let offset = 0; offset < 500; offset += limit) {
    const data = await http(
      'Formspree submissions',
      `https://formspree.io/api/0/forms/${encodeURIComponent(formId)}/submissions?limit=${limit}&offset=${offset}`,
      { headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' } },
    );
    const items = firstArray(data);
    if (flag('DEBUG_SHAPE') && offset === 0) describeShape(data, items);
    for (const item of items) {
      const { _date, _status, ...fields } = item; // eslint-disable-line no-unused-vars
      // Formspree's documented payload has no id: derive a stable one.
      const stable = item.id || item._id
        || createHash('sha256').update(`${_date}|${JSON.stringify(fields)}`).digest('hex').slice(0, 20);
      submissions.push({ id: `formspree:${stable}`, createdAt: parseDate(_date), fields, spam: false });
    }
    if (items.length < limit) break;
  }
  return { submissions };
}

async function file() {
  const path = env('LEAD_SOURCE_FILE');
  if (!path) return { missing: ['LEAD_SOURCE_FILE'] };
  const { readFile } = await import('node:fs/promises');
  const items = JSON.parse(await readFile(path, 'utf8'));
  return {
    submissions: items.map((item) => ({
      id: `file:${item.id}`,
      createdAt: parseDate(item.created_at),
      fields: item.fields || {},
      spam: item.is_spam === true,
    })),
  };
}

const ADAPTERS = { formbold, formspree, file };

/* ---------- lead normalization ---------- */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeWebsite(raw) {
  let value = String(raw || '').trim();
  if (!value) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.href.length <= 2000 ? url.href : null;
  } catch {
    return null;
  }
}

const websiteKey = (href) => {
  const url = new URL(href);
  return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/+$/, '')}`.toLowerCase();
};

export function toLead(submission) {
  const f = submission.fields || {};
  if (pick(f, ['_gotcha'])) return { skip: 'honeypot' };
  if (submission.spam) return { skip: 'spam' };
  const email = pick(f, ['email', 'e-mail']);
  if (!EMAIL_RE.test(email) || email.length > 254) return { skip: 'invalid email' };
  const website = normalizeWebsite(pick(f, ['website_url', 'website', 'url']));
  if (!website) return { skip: 'invalid website' };
  return {
    lead: {
      id: submission.id,
      createdAt: submission.createdAt,
      email,
      website,
      dedupeKey: `${email.toLowerCase()}|${websiteKey(website)}`,
    },
  };
}

/* ---------- Notion ---------- */

const richText = (content) => [{ type: 'text', text: { content: String(content).slice(0, 2000) } }];
const plain = (rich) => (rich || []).map((part) => part.plain_text || '').join('');

function submittedLabel(date) {
  if (!date) return 'time unknown';
  const ct = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(date);
  return `${ct} (${date.toISOString()})`;
}

export function leadToNotionProperties(lead) {
  const host = new URL(lead.website).hostname.replace(/^www\./, '');
  return {
    Name: { title: richText(host || lead.email) },
    'Handle/Email': { rich_text: richText(lead.email) },
    Website: { url: lead.website },
    Source: { select: { name: SOURCE_NAME } },
    Stage: { status: { name: STAGE_NEW } },
    'Next Action': { rich_text: richText(NEXT_ACTION) },
    Notes: {
      rich_text: richText(
        `Submitted via the website free-audit form. Submitted: ${submittedLabel(lead.createdAt)}. ${ID_PREFIX}${lead.id}`,
      ),
    },
  };
}

const notionHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Notion-Version': NOTION_VERSION,
});

async function existingKeys({ token, dataSourceId }) {
  const ids = new Set();
  const keys = new Set();
  let cursor;
  for (let page = 0; page < 50; page++) {
    const data = await http(
      'Notion query',
      `${NOTION_API}/data_sources/${dataSourceId}/query`,
      {
        method: 'POST',
        headers: notionHeaders(token),
        body: JSON.stringify({
          filter: { property: 'Source', select: { equals: SOURCE_NAME } },
          page_size: 100,
          ...(cursor ? { start_cursor: cursor } : {}),
        }),
      },
    );
    for (const row of data.results || []) {
      const props = row.properties || {};
      const notes = plain(props.Notes?.rich_text);
      for (const match of notes.matchAll(/Submission ID: (\S+)/g)) ids.add(match[1].replace(/[.,;]+$/, ''));
      const email = plain(props['Handle/Email']?.rich_text).toLowerCase();
      const site = props.Website?.url;
      if (email && site) {
        try { keys.add(`${email}|${websiteKey(site)}`); } catch { /* ignore bad url */ }
      }
    }
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }
  return { ids, keys };
}

async function createPage({ token, dataSourceId }, lead) {
  await http('Notion create page', `${NOTION_API}/pages`, {
    method: 'POST',
    headers: notionHeaders(token),
    body: JSON.stringify({
      parent: { type: 'data_source_id', data_source_id: dataSourceId },
      properties: leadToNotionProperties(lead),
    }),
  }, 2); // fewer retries on create: avoid duplicate pages if a response was lost
}

/* ---------- main ---------- */

export async function main() {
  const strict = flag('STRICT');
  const dryRun = flag('DRY_RUN');
  const sourceName = env('LEAD_SOURCE') || 'formbold';
  const adapter = ADAPTERS[sourceName];
  if (!adapter) throw new Error(`Unknown LEAD_SOURCE "${sourceName}". Use: ${Object.keys(ADAPTERS).join(', ')}.`);

  const notion = { token: env('NOTION_TOKEN'), dataSourceId: env('NOTION_DATA_SOURCE_ID') };
  const missing = ['NOTION_TOKEN', 'NOTION_DATA_SOURCE_ID'].filter((n) => !env(n));
  const source = await adapter({ strict });
  missing.push(...(source.missing || []));
  if (missing.length) {
    const message = `Lead sync is not configured yet (missing: ${missing.join(', ')}). See docs/audit-form-setup.md.`;
    if (strict) throw new Error(message);
    notice(message);
    return;
  }

  const lookbackDays = Number(env('LOOKBACK_DAYS')) || 7;
  const maxCreate = Number(env('MAX_CREATE')) || 25;
  const cutoff = Date.now() - lookbackDays * 86400000;

  const recent = source.submissions
    .filter((s) => !s.createdAt || s.createdAt.getTime() >= cutoff)
    .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  log(`Fetched ${source.submissions.length} submission(s) from "${sourceName}"; ${recent.length} within the last ${lookbackDays} day(s).`);
  if (!recent.length) return;

  const { ids, keys } = await existingKeys(notion);
  const counts = { created: 0, duplicate: 0, skipped: 0, failed: 0, pending: 0 };

  for (const submission of recent) {
    const { lead, skip } = toLead(submission);
    if (skip) {
      counts.skipped++;
      log(`skip ${submission.id}: ${skip}`);
      continue;
    }
    if (ids.has(lead.id) || keys.has(lead.dedupeKey)) {
      counts.duplicate++;
      continue;
    }
    if (counts.created >= maxCreate) {
      counts.pending++;
      continue;
    }
    if (dryRun) {
      counts.created++;
      log(`dry-run: would create ${lead.id}`);
      continue;
    }
    try {
      await createPage(notion, lead);
      ids.add(lead.id);
      keys.add(lead.dedupeKey); // also dedupes two new submissions with the same email + site in one run
      counts.created++;
      log(`created ${lead.id}`);
    } catch (error) {
      counts.failed++;
      log(`::error::${lead.id}: ${error.message}`);
    }
  }

  log(`Done${dryRun ? ' (dry run)' : ''}: ${JSON.stringify(counts)}`);
  if (counts.failed) process.exitCode = 1;
}

import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.log(`::error::${error.message}`);
    process.exit(1);
  });
}
