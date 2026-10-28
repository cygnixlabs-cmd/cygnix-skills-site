#!/usr/bin/env python3
"""Build index.html, llms.txt, sitemap.xml and robots.txt from template.html + feed/cygnix-listings.json.
Usage: python3 build.py            (uses local feed copy)
       python3 build.py --fetch    (pulls the latest feed from GitHub first)"""
import json, html, re, sys, datetime, urllib.request, pathlib
ROOT = pathlib.Path(__file__).parent
SITE = "https://skills.cygnixlabs.com"
FEED_URL = "https://raw.githubusercontent.com/cygnixlabs-cmd/cygnix-seo-skills/main/feed/cygnix-listings.json"
EXCLUDE = {"cygnix-instagram-export-cleaner", "cygnix-storefront-release-proof"}
EMAIL = "cygnixlabs@gmail.com"   # switch to info@cygnixlabs.com when that inbox is live

if "--fetch" in sys.argv:
    try:
        data = urllib.request.urlopen(FEED_URL, timeout=20).read()
        json.loads(data); (ROOT / "feed/cygnix-listings.json").write_bytes(data); print("feed refreshed")
    except Exception as e:
        print("feed fetch failed, using local copy:", e)

feed = json.loads((ROOT / "feed/cygnix-listings.json").read_text())
items = [i for i in feed["items"] if i.get("url") and i.get("slug") not in EXCLUDE and "library.cygnixlabs" not in i["url"]]
actors = [i for i in items if i["platform"] == "Apify"]
skills = [i for i in items if i["platform"] != "Apify"]
e = html.escape

def card(i):
    ap = i["platform"] == "Apify"
    kind = "Apify actor" if ap else ("Agensi bundle" if i["type"] == "bundle" else "Agensi skill")
    return (f'<a class="tool glass" href="{e(i["url"])}" target="_blank" rel="noopener" data-platform="{e(i["platform"])}">'
            f'<div class="meta"><span class="badge {"apify" if ap else "agensi"}">{kind}</span><span class="badge">{e(i.get("category",""))}</span></div>'
            f'<h3>{e(i["title"])}</h3><p>{e(i.get("short_description",""))}</p>'
            f'<div class="ft"><span class="price">{e(i.get("price",""))}</span><span class="go">{"Run on Apify" if ap else "Get on Agensi"} →</span></div></a>')

def num(p):
    m = re.search(r"\$([0-9.]+)", p or ""); return m.group(1) if m else None

org = {"@type": "Organization", "@id": SITE + "/#org", "name": "Cygnix Labs", "url": SITE + "/",
       "logo": SITE + "/apple-touch-icon.png", "image": SITE + "/assets/img/og.jpg", "email": EMAIL,
       "description": "Cygnix Labs builds SEO and AEO (AI search) tools and fixes websites that are not showing on Google or in AI answers.",
       "sameAs": ["https://x.com/Cygnixlabs", "https://www.linkedin.com/company/cygnix-labs", "https://www.instagram.com/cygnix.labs/",
                  "https://apify.com/cygnix_labs", "https://agensi.io/creators/cygnix-labs", "https://cygnixlabs.gumroad.com/",
                  "https://github.com/cygnixlabs-cmd"],
       "contactPoint": {"@type": "ContactPoint", "contactType": "sales", "email": EMAIL, "availableLanguage": ["English"]}}
website = {"@type": "WebSite", "@id": SITE + "/#site", "url": SITE + "/", "name": "Cygnix Labs", "publisher": {"@id": SITE + "/#org"}}
packs = [("Monitor", "29", "Monthly SEO + AEO audit, indexing and redirect checks, report by email.", True),
         ("Growth", "59", "Monitor plus a monthly prioritised fix plan, content decay and cannibalization checks, 2 briefs a month.", True),
         ("Agency", "99", "5 client sites with white-label reports and all Monitor + Growth checks.", True),
         ("Quick Audit", "79", "Key pages of one site: indexing, meta, schema, AI readiness and a fix list.", False),
         ("Full Audit", "199", "Whole-site SEO + AEO audit with redirects, internal links, backlinks and content decay.", False),
         ("Fix Sprint", "299", "We fix the top issues from your audit, recheck and resubmit the pages to Google.", False)]
service = {"@type": "Service", "@id": SITE + "/#service", "name": "SEO and AEO audits, monitoring and fixes", "provider": {"@id": SITE + "/#org"},
           "serviceType": "Search engine optimization and answer engine optimization", "areaServed": "Worldwide",
           "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Cygnix Labs packages", "itemListElement": [
               {"@type": "Offer", "name": n, "description": d, "price": p, "priceCurrency": "USD", "url": SITE + "/#packages",
                **({"priceSpecification": {"@type": "UnitPriceSpecification", "price": p, "priceCurrency": "USD", "unitCode": "MON"}} if mo else {})}
               for n, p, d, mo in packs]}}
apps = []
for i in actors:
    o = {"@type": "Offer", "url": i["url"], "priceCurrency": "USD", "description": "Pay per use: " + i.get("price", "")}
    if num(i.get("price")): o["price"] = num(i["price"])
    apps.append({"@type": "SoftwareApplication", "name": i["title"], "url": i["url"], "applicationCategory": "BusinessApplication",
                 "operatingSystem": "Web (Apify cloud)", "description": i.get("short_description", ""), "publisher": {"@id": SITE + "/#org"}, "offers": o})
prods = []
for i in skills:
    o = {"@type": "Offer", "url": i["url"], "priceCurrency": "USD", "availability": "https://schema.org/InStock"}
    if num(i.get("price")): o["price"] = num(i["price"])
    prods.append({"@type": "Product", "name": i["title"], "url": i["url"], "description": i.get("short_description", ""),
                  "category": i.get("category", ""), "brand": {"@type": "Brand", "name": "Cygnix Labs"}, "offers": o})
itemlist = {"@type": "ItemList", "@id": SITE + "/#tools", "name": "Cygnix Labs SEO and AEO tools",
            "itemListElement": [{"@type": "ListItem", "position": n + 1, "item": x} for n, x in enumerate(apps + prods)]}
faq_src = (ROOT / "template.html").read_text()
faqs = re.findall(r"<details[^>]*><summary>(.*?)</summary><p>(.*?)</p></details>", faq_src, re.S)
faq = {"@type": "FAQPage", "@id": SITE + "/#faq", "mainEntity": [
    {"@type": "Question", "name": html.unescape(q), "acceptedAnswer": {"@type": "Answer", "text": html.unescape(re.sub("<[^>]+>", "", a))}} for q, a in faqs]}
jsonld = json.dumps({"@context": "https://schema.org", "@graph": [org, website, service, itemlist, faq]}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")

now = datetime.date.today().isoformat()
out = (faq_src.replace("{{SITE}}", SITE).replace("{{JSONLD}}", jsonld).replace("{{TOOL_CARDS}}", "".join(card(i) for i in actors))
       .replace("{{UPDATED}}", f'{feed.get("updated", now)} · {len(items)} live tools and skills').replace("{{YEAR}}", str(datetime.date.today().year))
       .replace("{{V}}", now.replace("-", "")))
(ROOT / "index.html").write_text(out)

L = ["# Cygnix Labs", "", "> Cygnix Labs builds SEO and AEO (answer engine optimization) tools and fixes websites that are not showing on Google or in AI answers such as ChatGPT, Perplexity and Google AI Overviews. Every job follows three steps: the problem, a proof report from a real tool run, and the fix.", "",
     f"Contact: {EMAIL} · Site: {SITE}/ · Free site check: {SITE}/#contact", "",
     "## Packages", ""] + [f"- {n}: ${p}{'/month' if mo else ' one-time'}. {d}" for n, p, d, mo in packs] + [
     "", "## Apify actors (run in the cloud, pay per use)", ""] + [f"- [{i['title']}]({i['url']}): {i.get('short_description','')} Price: {i.get('price','')}." for i in actors] + [
     "", "## Agensi skills for AI agents", ""] + [f"- [{i['title']}]({i['url']}): {i.get('short_description','')} Price: {i.get('price','')}." for i in skills] + [
     "", "## Optional", "", "- [Listings feed (JSON)](" + SITE + "/feed/cygnix-listings.json)", "- [Gumroad packs](https://cygnixlabs.gumroad.com/)", ""]
(ROOT / "llms.txt").write_text("\n".join(L))
(ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f'<url><loc>{SITE}/</loc><lastmod>{now}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n'
    f'<url><loc>{SITE}/llms.txt</loc><lastmod>{now}</lastmod></url>\n</urlset>\n')
(ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\n# AI crawlers welcome\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
print(f"built: {len(actors)} actors, {len(skills)} skills, {len(faqs)} faqs")
