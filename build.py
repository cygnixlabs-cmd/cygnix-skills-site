#!/usr/bin/env python3
"""Build index.html, pricing.html, llms.txt, sitemap.xml and robots.txt from template.html + pricing-template.html + feed/cygnix-listings.json.
Usage: python3 build.py            (uses local feed copy)
       python3 build.py --fetch    (pulls the latest feed from GitHub first)"""
import json, html, re, sys, datetime, urllib.request, pathlib
ROOT = pathlib.Path(__file__).parent
SITE = "https://skills.cygnixlabs.com"
FEED_URL = "https://raw.githubusercontent.com/cygnixlabs-cmd/cygnix-seo-skills/main/feed/cygnix-listings.json"
EXCLUDE = {"cygnix-instagram-export-cleaner", "cygnix-storefront-release-proof"}
EMAIL = "info@cygnixlabs.com"   # the only public contact address
PHONE = "+965 5178 5758"
TEL = "+96551785758"

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
exec((ROOT / "problems_data.py").read_text())  # PROBLEMS, TOOLS, APIFY: problem landing pages

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
       "telephone": TEL, "address": {"@type": "PostalAddress", "streetAddress": "Floor 1, Office 48, Al Rehab Complex, Tunisia Street", "addressLocality": "Hawalli", "addressCountry": "KW"},
       "contactPoint": {"@type": "ContactPoint", "contactType": "sales", "email": EMAIL, "telephone": TEL, "availableLanguage": ["English"]}}
AREAS_SERVED = [{"@type": "Country", "name": c} for c in ["Kuwait", "Saudi Arabia", "United Arab Emirates", "Qatar", "Bahrain", "Oman", "United Kingdom", "United States", "Canada", "Australia"]]
org["description"] = "Cygnix Labs is a done-for-you SEO and AEO (AI search) team. We fix websites that customers can't find on Google, Google Maps or in AI answers such as ChatGPT: free audit, a ranked Fix Queue, and every fix QA-checked."
pro = {"@type": "ProfessionalService", "@id": SITE + "/#business", "name": "Cygnix Labs", "url": SITE + "/", "image": SITE + "/assets/img/og.jpg", "logo": SITE + "/apple-touch-icon.png",
       "description": "Done-for-you SEO and AEO (answer engine optimization) service by a specialist team: free first audit, a Fix Queue of up to 15 priorities (P0-P3), client approval, specialist fixes, an independent QA check of every fix, and plain-English reports.",
       "email": EMAIL, "telephone": TEL, "address": org["address"], "areaServed": AREAS_SERVED, "parentOrganization": {"@id": SITE + "/#org"},
       "knowsAbout": ["Search engine optimization", "Answer engine optimization", "Generative engine optimization", "Local SEO", "Google Business Profile", "Technical SEO", "Schema markup"],
       "knowsLanguage": ["en"],
       "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Done-for-you SEO + AEO service", "itemListElement": [
           {"@type": "Offer", "name": "Free first audit", "price": "0", "priceCurrency": "USD", "url": SITE + "/#contact", "itemOffered": {"@type": "Service", "name": "Free SEO + AEO audit with a Fix Queue of up to 15 priorities"}}] + [
           {"@type": "Offer", "name": n, "url": SITE + "/#service", "itemOffered": {"@type": "Service", "name": n + " (done-for-you SEO + AEO)", "description": d}} for n, d in [
           ("Foundation", "One site, one location: business facts, indexing, broken links and redirects, monthly Fix Queue work, AI-answer check, monthly report."),
           ("Growth", "Several locations or a small store: more monthly fixes, page improvements, monthly AI-answer checks, weekly updates."),
           ("Authority", "Multi-location or large catalogues: largest fix allowance, competitor AI-answer tracking, authority work, monthly review call.")]]}}
website = {"@type": "WebSite", "@id": SITE + "/#site", "url": SITE + "/", "name": "Cygnix Labs", "publisher": {"@id": SITE + "/#org"}}
# ---- packages: single source for pricing JSON-LD, llms.txt and the contact form options ----
# Payment copy lives here so it is easy to swap when a payment method (PayPal, Wise, bank) is chosen.
BOOK = "Book this package"
PAY_SHORT = "an invoice"
PAY_LEAD = "Book a package and we invoice you by email."
PAY_NOTE = ("There is no card checkout on this site. Book a package, we confirm the scope by email, "
            "and we send an invoice. The payment options are listed on the invoice.")
PRICING = SITE + "/pricing.html"
# (form label, name, price, description, unit: MON | None, anchor)
packs = [("White-label audit — $99", "White-label AI visibility audit", "99", "SEO + AEO (AI visibility) audit of one client site, delivered under the agency's brand with a prioritised fix list.", None, "agencies"),
         ("White-label 4-pack — $299", "White-label AI visibility audit, pack of 4", "299", "Four white-label SEO + AEO audits for four client sites ($74.75 each), one invoice.", None, "agencies"),
         ("Monitor — $29/mo", "Monitor", "29", "Monthly SEO + AEO audit, indexing and redirect checks, report by email.", "MON", "plans"),
         ("Growth — $59/mo", "Growth", "59", "Monitor plus a monthly prioritised fix plan, content decay and cannibalization checks, 2 briefs a month.", "MON", "plans"),
         ("Agency — $99/mo (5 white-label sites)", "Agency", "99", "5 client sites with white-label reports and all Monitor + Growth checks.", "MON", "plans"),
         ("Quick Audit — $79", "Quick Audit", "79", "Key pages of one site: indexing, meta, schema, AI readiness and a fix list.", None, "oneoff"),
         ("Full Audit — $199", "Full Audit", "199", "Whole-site SEO + AEO audit with redirects, internal links, backlinks and content decay.", None, "oneoff"),
         ("Fix Sprint — $299", "Fix Sprint", "299", "We fix the top issues from your audit, recheck and resubmit the pages to Google.", None, "oneoff")]
FORM_OPTIONS = ["Free 15-min consultation", "Free audit", "Free sample audit (agencies)"] + [p[0] for p in packs] + ["Talk to us (chat)", "Just a question"]
def offer(label, n, p, d, unit, anchor):
    o = {"@type": "Offer", "name": n, "description": d, "price": p, "priceCurrency": "USD", "url": f"{PRICING}#{anchor}",
         "availability": "https://schema.org/InStock", "seller": {"@id": SITE + "/#org"}}
    if unit: o["priceSpecification"] = {"@type": "UnitPriceSpecification", "price": p, "priceCurrency": "USD", "unitCode": unit, "referenceQuantity": {"@type": "QuantitativeValue", "value": 1, "unitCode": unit}}
    if "4-pack" in label: o["eligibleQuantity"] = {"@type": "QuantitativeValue", "value": 4, "unitText": "audits"}
    return o
service = {"@type": "Service", "@id": SITE + "/#service", "name": "SEO and AEO audits, monitoring and fixes", "provider": {"@id": SITE + "/#org"},
           "serviceType": "Search engine optimization and answer engine optimization", "areaServed": AREAS_SERVED, "url": PRICING,
           "hasOfferCatalog": {"@type": "OfferCatalog", "name": "Cygnix Labs packages", "url": PRICING, "itemListElement": [offer(*x) for x in packs]}}
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
def faqs_of(src):
    return re.findall(r"<details[^>]*><summary>(.*?)</summary><p>(.*?)</p></details>", src, re.S)
def faq_ld(src, page):
    return {"@type": "FAQPage", "@id": page + "#faq", "mainEntity": [
        {"@type": "Question", "name": html.unescape(q), "acceptedAnswer": {"@type": "Answer", "text": html.unescape(re.sub("<[^>]+>", "", a))}} for q, a in faqs_of(src)]}
def ld(graph):
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
now = datetime.date.today().isoformat()
opts = "".join(f"<option>{e(o)}</option>" for o in FORM_OPTIONS)
def fill(src):
    return (src.replace("{{EMAIL}}", EMAIL).replace("{{PHONE}}", PHONE).replace("{{TEL}}", TEL).replace("{{PAY_NOTE}}", e(PAY_NOTE)).replace("{{PAY_SHORT}}", e(PAY_SHORT)).replace("{{PAY_LEAD}}", e(PAY_LEAD)).replace("{{BOOK}}", e(BOOK))
               .replace("{{PACKAGE_OPTIONS}}", opts).replace("{{SITE}}", SITE).replace("{{TOOL_CARDS}}", "".join(card(i) for i in actors))
               .replace("{{UPDATED}}", f'{feed.get("updated", now)} · {len(items)} live tools and skills').replace("{{YEAR}}", str(datetime.date.today().year))
               .replace("{{PROBLEM_CARDS}}", "".join(f'<a class="find glass" href="{p["slug"]}.html"><span class="fi" aria-hidden="true">{p["icon"]}</span><h3>{e(p["short"])}</h3><p>{e(p["desc"])}</p><small>Read the guide →</small></a>' for p in PROBLEMS))
               .replace("{{V}}", datetime.datetime.now().strftime("%Y%m%d%H%M")))
home_src = fill((ROOT / "template.html").read_text())
price_src = fill((ROOT / "pricing-template.html").read_text())
faqs = faqs_of(home_src)
crumbs = {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
          {"@type": "ListItem", "position": 2, "name": "Pricing", "item": PRICING}]}
price_page = {"@type": "WebPage", "@id": PRICING + "#page", "url": PRICING, "name": "Pricing and packages | Cygnix Labs", "isPartOf": {"@id": SITE + "/#site"},
              "about": {"@id": SITE + "/#service"}, "breadcrumb": crumbs}
(ROOT / "index.html").write_text(home_src.replace("{{JSONLD}}", ld([org, pro, website, itemlist, faq_ld(home_src, SITE + "/")])))
(ROOT / "pricing.html").write_text(price_src.replace("{{JSONLD}}", ld([org, website, price_page, service, faq_ld(price_src, PRICING)])))
# GitHub Pages serves /pricing/ only if pricing/index.html exists; without it /pricing/ 404s.
(ROOT / "pricing").mkdir(exist_ok=True)
(ROOT / "pricing" / "index.html").write_text("""<!doctype html>
<html lang=\"en\">
<head>
<meta charset=\"utf-8\">
<title>Pricing and packages | Cygnix Labs</title>
<link rel=\"canonical\" href=\"https://skills.cygnixlabs.com/pricing.html\">
<meta http-equiv=\"refresh\" content=\"0;url=/pricing.html\">
<meta name=\"robots\" content=\"noindex,follow\">
</head>
<body>
<p>Pricing moved to <a href=\"/pricing.html\">/pricing.html</a>.</p>
</body>
</html>
""")

L = ["# Cygnix Labs", "", "> Cygnix Labs is a done-for-you SEO and AEO (answer engine optimization) team based in Kuwait. We fix websites that customers can't find on Google, Google Maps or in AI answers such as ChatGPT, Gemini, Perplexity and Google AI Overviews. SEO and AI-search specialists do the work and a separate QA reviewer checks every fix on the live site. We serve Kuwait, Saudi Arabia and the Gulf, the UK, the US, Canada and Australia, including white-label work for agencies.", "",
     "## How the service works", "", "1. Free first audit: real tool runs on the client's live pages, no passwords.", "2. Fix Queue: up to 15 priorities, ranked P0 (urgent) to P3, each with evidence and the fix.", "3. Client approval for anything customers read (copy, prices, hours); medical/legal claims need owner or clinician approval.", "4. Specialist fixes, with access granted by invite and least privilege.", "5. Independent QA check of every fix on the live site; nothing is reported as fixed before QA.", "6. Plain-English weekly or monthly reports. No ranking or AI-answer guarantees.", "",
     "Service levels (scope only): Foundation (one site, one location), Growth (several locations or a small store, more monthly fixes, monthly AI-answer checks), Authority (multi-location or large catalogues, competitor AI-answer tracking, authority work). Who we help: agencies (white-label), clinics and dental, salons and spas, cleaning and home services, online stores, restaurants, and Kuwait and Saudi businesses.", "",
     f"Free audit: {EMAIL} or {SITE}/#contact · Phone: {PHONE} · Problems we solve: {SITE}/problems.html · Pricing: {PRICING} · Book a free 15-min consultation: {SITE}/?package=consultation#contact", "",
     "## Packages and pricing", "", f"Full pricing: {PRICING}. {PAY_NOTE}", ""] + [f"- {n}: ${p}{'/month' if u else ' one-time'}. {d}" for _, n, p, d, u, _a in packs] + [
     "", "## Problems we solve (plain-language guides)", "", f"- [Problems we solve (hub)]({SITE}/problems.html): every problem below, explained from zero for business owners. Free first audit: {EMAIL}."] + [
     f"- [{p['short']}]({SITE}/{p['slug']}.html): {p['desc']}" for p in PROBLEMS] + [
     "", "## Apify actors (run in the cloud, pay per use)", "", "- [Business Search & AI Visibility Audit](https://apify.com/cygnix_labs/business-search-ai-visibility-audit): local SEO + AI search audit per business site: NAP and opening-hours consistency (site, schema, Google Business Profile, directories), AI crawler access and indexing, P0-P3 findings with fixes. Price: $0.04 per site."] + [f"- [{i['title']}]({i['url']}): {i.get('short_description','')} Price: {i.get('price','')}." for i in actors] + [
     "", "## Agensi skills for AI agents", ""] + [f"- [{i['title']}]({i['url']}): {i.get('short_description','')} Price: {i.get('price','')}." for i in skills] + [
     "", "## Optional", "", "- [Pricing and packages](" + PRICING + ")", "- [Problems we solve](" + SITE + "/problems.html)", "- [Listings feed (JSON)](" + SITE + "/feed/cygnix-listings.json)", ""]
(ROOT / "llms.txt").write_text("\n".join(L))
(ROOT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    f'<url><loc>{SITE}/</loc><lastmod>{now}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>\n'
    f'<url><loc>{PRICING}</loc><lastmod>{now}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n'
    f'<url><loc>{SITE}/pricing/</loc><lastmod>{now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n'
    f'<url><loc>{SITE}/problems.html</loc><lastmod>{now}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>\n'
    + "".join(f'<url><loc>{SITE}/{p["slug"]}.html</loc><lastmod>{now}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>\n' for p in PROBLEMS) +
    f'<url><loc>{SITE}/llms.txt</loc><lastmod>{now}</lastmod></url>\n</urlset>\n')
(ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\n\n# AI crawlers welcome\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ChatGPT-User\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")
print(f"built: {len(actors)} actors, {len(skills)} skills, {len(faqs)} faqs")
exec((ROOT / "build_problems.py").read_text())  # problems.html hub + one page per problem
exec((ROOT / "build_kb.py").read_text())  # chat assistant knowledge base -> assets/kb.json
