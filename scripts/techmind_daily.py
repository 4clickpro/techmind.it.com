#!/usr/bin/env python3
"""Read-only TechMind daily site health report. No credentials or writes."""
import datetime
import json
import urllib.error
import urllib.request

URLS = [
    "https://techmind.it.com/",
    "https://techmind.it.com/directory.html",
    "https://techmind.it.com/sitemap.xml",
    "https://techmind.it.com/robots.txt",
]
def inspect(url):
    request = urllib.request.Request(url, headers={"User-Agent": "TechMindHealthCheck/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            body = response.read(500000).decode("utf-8", errors="replace")
            status = response.status
            findings = []
            if url.endswith("/directory.html"):
                if "paypal.com/ncp/payment/" not in body.lower():
                    findings.append("PayPal checkout links not found")
                if 'rel="canonical"' not in body.lower():
                    findings.append("Canonical link not found")
            if url.endswith("/sitemap.xml") and "directory.html" not in body:
                findings.append("Directory missing from sitemap")
            return {"url": url, "status": status, "findings": findings}
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        return {"url": url, "status": "ERROR", "findings": [str(exc)]}

if __name__ == "__main__":
    report = {"checked_at_utc": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "checks": [inspect(url) for url in URLS]}
    with open("techmind-health-report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
    print(json.dumps(report, indent=2))
    if any(item["status"] != 200 or item["findings"] for item in report["checks"]):
        raise SystemExit(1)
