# Builds assets/kb.json for the on-site chat assistant from real site data:
# feed/cygnix-listings.json (+ feed/apify-actors.json cache of the public Apify store pages),
# the packages list and FAQs in build.py / the templates. Exec'd at the end of build.py so it
# shares its variables (actors, skills, packs, PAY_NOTE, PRICING, SITE, home_src, price_src, faqs_of).
# Refresh the Apify cache with: python3 build_kb.py --fetch-apify
import json, re, html, pathlib, sys, urllib.request
_ROOT = pathlib.Path(__file__).parent if "__file__" in globals() else pathlib.Path(".")
CONTACT = "info@cygnixlabs.com"
APIFY_CACHE = _ROOT / "feed/apify-actors.json"

def _fetch_apify(slugs):
    out = {}
    for s in slugs:
        d = json.load(urllib.request.urlopen(f"https://api.apify.com/v2/acts/cygnix_labs~{s}", timeout=20))["data"]
        rs = d.get("readmeSummary") or ""
        uc = rs.split("## Use cases", 1)[1] if "## Use cases" in rs else ""
        out[s] = {"title": d["title"], "description": d["description"], "seoDescription": d.get("seoDescription"),
                  "use_cases": [l.strip("- ").strip() for l in uc.splitlines() if l.strip().startswith("-")][:6]}
    APIFY_CACHE.write_text(json.dumps(out, indent=1, ensure_ascii=False))
    return out

def _strip(s): return html.unescape(re.sub("<[^>]+>", "", s)).strip()

# Who each actor is for: taken from its own Apify description / use cases (kept short, no new claims).
AUD = {
 "redirect-checker": ("site owners, developers and SEO agencies, especially before or after a site move", ["store", "business", "agency"]),
 "indexing-fix-planner": ("site owners and SEO agencies with pages Google won't index", ["business", "store", "agency"]),
 "site-seo-aeo-audit": ("any business website, store or agency client site that needs a full health check", ["business", "store", "agency"]),
 "aeo-readiness-checker": ("businesses and agencies that want to be cited by ChatGPT, Perplexity, Claude and AI Overviews", ["business", "agency"]),
 "spam-backlink-triage": ("site owners and SEO agencies worried about spam or toxic backlinks", ["business", "agency"]),
 "internal-link-audit": ("site owners and SEO agencies fixing orphan pages and weak internal links", ["business", "store", "agency"]),
 "seo-change-impact-checker": ("SEO teams and agencies proving whether a change worked", ["agency"]),
 "hashtag-research-strategy": ("creators, brands and social media managers on Instagram and TikTok", ["creator"]),
 "keyword-clusterer-brief": ("content teams, writers and SEO agencies planning content", ["agency", "business"]),
 "social-best-time-to-post": ("creators, brands and social media managers", ["creator"]),
 "brand-facts-checker": ("businesses and agencies that want consistent brand facts for AI answers", ["business", "agency"]),
 "youtube-channel-analyzer": ("YouTube creators and marketers", ["creator"]),
 "keyword-cannibalization-finder": ("site owners and SEO agencies with pages competing for the same keyword", ["business", "agency"]),
 "outreach-contact-finder": ("agencies and sales teams building outreach or lead lists", ["agency"]),
 "serp-intent-mapper": ("SEO and PPC teams planning which page type to build", ["agency"]),
 "content-decay-audit": ("site owners and agencies whose Google traffic is dropping", ["business", "store", "agency"]),
 "website-tech-stack-detector": ("agencies and sales teams qualifying leads by the tools a site uses", ["agency", "store"]),
}
# Extra search words (plain-language synonyms people type) per actor.
KW = {
 "redirect-checker": "redirect redirects 301 302 chain loop 404 broken link soft migration moved new domain site move http status",
 "indexing-fix-planner": "index indexed indexing not indexed crawled discovered google not showing missing search console gsc noindex canonical deindexed",
 "site-seo-aeo-audit": "audit seo check whole site health score meta tags broken links schema technical crawl report",
 "aeo-readiness-checker": "ai chatgpt perplexity claude gemini overviews llm aeo geo llms.txt cited mention visibility bots gptbot",
 "spam-backlink-triage": "backlink backlinks toxic spam disavow negative seo links referring domains",
 "internal-link-audit": "internal links orphan pages linking click depth anchor",
 "seo-change-impact-checker": "change impact test before after did it work experiment title rewrite",
 "hashtag-research-strategy": "hashtag hashtags instagram tiktok tags reels",
 "keyword-clusterer-brief": "keyword keywords cluster clustering group topic map content brief briefs plan",
 "social-best-time-to-post": "best time post posting schedule when instagram tiktok linkedin youtube engagement",
 "brand-facts-checker": "brand facts entity organization schema about page consistency knowledge",
 "youtube-channel-analyzer": "youtube channel video videos subscribers views creator competitor",
 "keyword-cannibalization-finder": "cannibalization cannibalisation competing pages same keyword duplicate merge",
 "outreach-contact-finder": "email emails contact contacts scraper leads lead phone whatsapp prospect outreach list",
 "serp-intent-mapper": "intent search intent serp informational commercial transactional page type",
 "content-decay-audit": "traffic drop dropped decline decay lost clicks rankings fell down",
 "website-tech-stack-detector": "tech stack technology builtwith wappalyzer shopify wordpress pixel cms analytics",
}

def build_kb():
    feed_actors = actors
    if "--fetch-apify" in sys.argv or not APIFY_CACHE.exists():
        try: ap = _fetch_apify([a["slug"] for a in feed_actors])
        except Exception as ex: print("apify fetch failed:", ex); ap = {}
    else:
        ap = json.loads(APIFY_CACHE.read_text())
    e = html.escape
    kb = []
    A = "https://apify.com/cygnix_labs/"
    def tl(slug):
        it = next((x for x in feed_actors if x["slug"] == slug), None)
        short = {"indexing-fix-planner": "Indexing Fix Planner", "content-decay-audit": "Content Decay Audit", "redirect-checker": "Redirect Checker",
                 "site-seo-aeo-audit": "Website SEO + AEO Audit", "outreach-contact-finder": "Contact Details Scraper", "website-tech-stack-detector": "Tech Stack Detector",
                 "brand-facts-checker": "Brand Facts Checker", "hashtag-research-strategy": "Hashtag Research", "keyword-clusterer-brief": "Keyword Clusterer + Briefs",
                 "spam-backlink-triage": "Spam Backlink Triage", "keyword-cannibalization-finder": "Cannibalization Checker"}
        return [short.get(slug) or it["title"].split(":")[0].strip(), it["url"]] if it else None
    for i in feed_actors:
        s = i["slug"]; d = ap.get(s, {}); who, tags = AUD.get(s, ("site owners and agencies", ["business"]))
        name = i["title"]
        desc = d.get("description") or i.get("short_description", "")
        desc = re.sub(r"\s*(First [^.]*free[^.]*\.|\$[0-9.]+ ?(per|/)[^.]*\.)\s*", " ", desc).strip()
        uc = d.get("use_cases", [])[:2]
        a = (f"<b>{e(name)}</b> (Apify actor). {e(desc)}<br><b>Who it's for:</b> {e(who)}."
             + (f"<br><b>Use it to:</b> {e(uc[0].rstrip('.'))}." if uc else "")
             + f"<br><b>Price:</b> pay per use, {e(i.get('price',''))} on Apify.")
        kb.append({"id": "actor:" + s, "kind": "actor", "title": name, "a": a, "link": i["url"], "cta": "Run it on Apify",
                   "kw": KW.get(s, "") + " " + i.get("category", "") + " " + " ".join(uc), "aud": tags, "pkg": "Free site check"})
    for i in skills:
        bundle = i["type"] == "bundle"
        a = (f"<b>{e(i['title'])}</b> ({'Agensi bundle' if bundle else 'Agensi skill'}). "
             + ("A bundle of 7 Google Search Console growth skills in one purchase. " if bundle and "7" in i["title"] else "")
             + f"Agensi skills plug into your AI agent. Price: <b>{e(i.get('price',''))}</b> on Agensi.")
        kb.append({"id": "skill:" + i["slug"], "kind": "bundle" if bundle else "skill", "title": i["title"], "a": a, "link": i["url"],
                   "cta": "Get it on Agensi", "kw": "agensi skill skills ai agent " + ("bundle pack " if bundle else "") + i.get("category", ""), "aud": ["agency", "business"]})
    for label, n, p, d, unit, anchor in packs:
        price = f"${p}/month" if unit else f"${p} one-time"
        aud = ["agency"] if ("White-label" in n or n == "Agency") else ["business", "store"]
        kb.append({"id": "pkg:" + anchor + ":" + re.sub(r"\W+", "-", n.lower()), "kind": "package", "title": n,
                   "a": f"<b>{e(n)}</b>: <b>{price}</b>. {e(d)} {e(PAY_NOTE)}", "link": f"pricing.html#{anchor}", "cta": "See it on the pricing page",
                   "kw": "package plan price cost " + ("monthly subscription " if unit else "one-time one off ") + ("white label agency resell client " if "agency" in aud else ""),
                   "aud": aud, "pkg": label})
    for src, page in ((home_src, "index.html#faq"), (price_src, "pricing.html#faq")):
        for q, a in faqs_of(src):
            if any(x["kind"] == "faq" and x["title"] == _strip(q) for x in kb): continue
            kb.append({"id": "faq:" + re.sub(r"\W+", "-", _strip(q).lower())[:50], "kind": "faq", "title": _strip(q), "a": e(_strip(a)), "link": page, "cta": "Read the FAQ", "kw": "", "aud": []})

    def T(id, title, kw, a, tools=(), aud=(), pkg=None, link=None, cta=None):
        t = [x for x in (tl(s) for s in tools) if x]
        kb.append({"id": "topic:" + id, "kind": "topic", "title": title, "kw": kw, "a": a, "tools": t, "aud": list(aud), "pkg": pkg, "link": link, "cta": cta})
    T("notindexed", "My pages are not indexed", "not indexed index indexing google not showing appear find missing crawled discovered search console website invisible",
      "That usually comes from a 404, a noindex tag, a wrong canonical, thin content or an orphan page. The <b>Indexing Fix Planner</b> checks every not-indexed URL and gives the cause and the fix for each one.",
      ["indexing-fix-planner", "internal-link-audit"], ["business", "store", "agency"], "Free site check")
    T("drop", "My rankings or traffic dropped", "drop dropped lost decline fell down traffic rankings ranking position clicks decay update",
      "Let's find which pages are losing clicks and why. <b>Content Decay Audit</b> ranks the pages that are slipping, and <b>SEO Change Impact Checker</b> tells you if a recent change caused it or if it is just noise.",
      ["content-decay-audit", "seo-change-impact-checker"], ["business", "store", "agency"], "Free site check")
    T("backlinks", "Toxic or spam backlinks", "backlink backlinks toxic spam disavow negative links",
      "Most spam links can be ignored. <b>Spam Backlink Triage</b> gives one answer (NO / MONITOR / ACT) and a verdict per domain, so you only disavow when it really matters.",
      ["spam-backlink-triage"], ["business", "agency"])
    T("redirects", "Broken redirects or a site move", "redirect redirects 301 302 migration migrate moved move new domain 404 broken links",
      "<b>Redirect Checker</b> traces every hop and flags chains, loops, 404s and soft 404s, and it checks your old-to-new redirect map after a migration. If you'd rather we fix it, the <b>Fix Sprint ($299)</b> covers the top issues with a recheck.",
      ["redirect-checker"], ["store", "business", "agency"], "Fix Sprint — $299")
    T("ai", "ChatGPT and AI answers don't mention me", "ai chatgpt gpt perplexity gemini claude llm aeo geo overviews cite cited mention recommend answers visibility",
      "To get cited by ChatGPT, Perplexity and Google AI Overviews, AI tools need to read your pages and trust your brand facts. <b>AEO Checker</b> scores each page 0–100, and <b>Brand Facts Checker</b> finds facts your own site contradicts.",
      ["aeo-readiness-checker", "brand-facts-checker"], ["business", "agency"], "Free site check")
    T("aeo", "What is AEO?", "what is aeo geo answer engine optimization meaning explain",
      "AEO (answer engine optimization) means making your pages easy for ChatGPT, Perplexity, Claude and Google AI Overviews to read, trust and cite. Our AEO checker scores each page from 0 to 100 and lists what to change, such as llms.txt, schema and clear brand facts.",
      ["aeo-readiness-checker"], [], "Free site check")
    T("llms", "What is llms.txt?", "llms.txt llms txt file ai crawler robots gptbot",
      "llms.txt is a plain-text file at the root of your site that gives AI tools a clean summary of your pages. Our <b>AEO & AI Visibility Audit</b> validates it and checks robots.txt for AI bots. You can see ours at <a href=\"llms.txt\">/llms.txt</a>.",
      ["aeo-readiness-checker"])
    T("youtube", "Grow my YouTube channel", "youtube channel video videos subscribers views grow",
      "<b>YouTube Channel Analyzer</b> shows your best upload day and hour, your outlier videos and the title patterns that win, for your channel or a competitor's.",
      ["youtube-channel-analyzer"], ["creator"])
    T("social", "Best time to post / hashtags", "instagram tiktok hashtag hashtags best time post posting social media reels engagement",
      "<b>Best Time to Post</b> builds a weekday × hour heatmap from real posts, and <b>Hashtag Research</b> gives you ready-to-paste tag sets.",
      ["social-best-time-to-post", "hashtag-research-strategy"], ["creator"])
    T("keywords", "Keyword research or cannibalization", "keyword keywords research cannibalization intent cluster serp content brief blog topics",
      "<b>Keyword Clusterer</b> groups your keywords into topics with content briefs, <b>SERP Intent Mapper</b> tells you which page type to build, and <b>Cannibalization Checker</b> finds pages competing for the same keyword.",
      ["keyword-clusterer-brief", "serp-intent-mapper", "keyword-cannibalization-finder"], ["agency", "business"])
    T("leads", "Find leads and contact details", "leads lead generation emails contacts scraper prospects prospecting outreach sales tech stack shopify",
      "<b>Contact Details Scraper</b> pulls emails, phones and social links from a list of websites, and <b>Tech Stack Detector</b> shows which CMS, pixels and tools each site uses, so you can qualify leads.",
      ["outreach-contact-finder", "website-tech-stack-detector"], ["agency"])
    T("agency", "I'm an agency (many client sites)", "agency agencies client clients white label whitelabel resell reseller partner my brand logo",
      "Agencies usually start with a <b>white-label AI visibility audit</b>: <b>$99</b> per client site, or <b>4 for $299</b> ($74.75 each), with your logo and no Cygnix branding. Ask for a free sample first. For ongoing work, the <b>Agency plan ($99/mo)</b> covers 5 client sites. You can also run our Apify actors across your client list yourself.",
      ["site-seo-aeo-audit", "outreach-contact-finder"], ["agency"], "Free sample audit (agencies)", "pricing.html#agencies", "See agency pricing")
    T("sample", "Free sample audit", "free sample trial demo example report see before buying",
      "Yes. Request a free sample audit for one site (yours or a client's). We run the real audit and email you the report, so you can judge the format before you buy.",
      [], ["agency"], "Free sample audit (agencies)", "pricing.html#agencies", "Request a free sample")
    T("local", "Clinic, dental, salon or spa", "clinic clinics dental dentist doctor salon spa beauty local business near me cleaning service restaurant small business",
      "For local and service businesses we help you show up when people nearby search for your service, and when they ask an AI tool: indexing, local pages and AI visibility, then a monthly check so problems don't come back. A good start is the <b>free site check</b>; the <b>Monitor plan ($29/mo)</b> or <b>Growth plan ($59/mo)</b> keep it healthy.",
      ["site-seo-aeo-audit", "aeo-readiness-checker"], ["business"], "Free site check", "pricing.html#plans", "See monthly plans")
    T("store", "Online store / e-commerce", "store shop online ecommerce e-commerce retail shopify woocommerce products product category pages",
      "For online stores we get product and category pages indexed, keep redirects clean and catch drops early. Before or after a site move, a <b>Fix Sprint ($299)</b> fixes the top issues and rechecks them.",
      ["indexing-fix-planner", "redirect-checker", "content-decay-audit"], ["store"], "Free site check", "pricing.html#oneoff", "See audits and Fix Sprint")
    T("grow", "I want more customers from my website", "more customers clients leads sales visitors enquiries bookings grow business growth marketing found",
      "More customers from search starts with being found: your key pages indexed on Google, and clear enough for ChatGPT and AI Overviews to cite. We check that first and show you what is holding the site back. The <b>free site check</b> is the easiest start, or book a free 15-minute consultation to talk it through.",
      ["site-seo-aeo-audit", "aeo-readiness-checker"], ["business", "store"], "Free site check")
    T("audit", "Not sure, check my whole site", "audit check whole site everything not sure help seo website review analyse analyze health",
      "Start with a full check. <b>Website SEO + AEO Audit</b> crawls your site and scores every page 0–100, covering meta tags, broken links, schema, llms.txt and AI readiness. Or we run it for you with the <b>free site check</b>.",
      ["site-seo-aeo-audit"], ["business", "store", "agency"], "Free site check")
    T("pricing", "Packages and pricing", "price prices pricing cost costs how much fee fees plans packages charge budget cheap expensive",
      "Our packages (USD): <b>White-label audit $99</b> or <b>4 for $299</b> for agencies · monthly <b>Monitor $29</b>, <b>Growth $59</b>, <b>Agency $99</b> (5 sites) · one-time <b>Quick Audit $79</b>, <b>Full Audit $199</b>, <b>Fix Sprint $299</b>. Our Apify actors are pay per use, and Agensi skills have their own prices.",
      [], [], None, "pricing.html", "See full pricing")
    T("payment", "How do I pay?", "pay payment paypal card invoice bank checkout buy purchase",
      e(PAY_NOTE), [], [], None, "pricing.html#pay", "How payment works")
    T("freecheck", "Free site check", "free check site check free audit no cost",
      "Send your website and the problem you see. We check it with our tools and reply by email with what is holding it back and how to fix it. There's no obligation.",
      ["site-seo-aeo-audit"], ["business", "store"], "Free site check", "#contact", "Request a free site check")
    T("consult", "Book a free 15-min consultation", "consultation consult call meeting talk speak book appointment zoom phone discuss",
      "You can book a <b>free 15-minute consultation</b>. Leave your details in the form and the Cygnix team emails you to set a time.",
      [], [], "consultation", "?package=consultation#contact", "Book a free 15-min consultation")
    T("guarantee", "Do you guarantee rankings?", "guarantee guaranteed first page number one promise results",
      "No one can honestly guarantee rankings. We guarantee clear evidence: a report from a real tool run, a prioritised fix list, and a recheck after the fixes.")
    T("passwords", "Do you need my passwords?", "password passwords login access admin wordpress credentials safe security",
      "Not for the free check or the audits, which use your public pages and any Search Console export you choose to send. A Fix Sprint needs editor access to your site, which you can remove afterwards.")
    T("diy", "Can I run the tools myself?", "myself diy run tools self serve apify account api use actors",
      "Yes. Our actors are public on Apify, where you pay per use, and our skills are on Agensi for AI agents. Every tool card on the home page links to the real listing.",
      [], [], None, "https://apify.com/cygnix_labs", "All our Apify actors")
    T("actors", "List your tools", "list all tools actors apify catalogue catalog products offer",
      "Our Apify actors: " + ", ".join(f'<a href="{e(i["url"])}" target="_blank" rel="noopener">{e(i["title"].split(":")[0])}</a>' for i in feed_actors) + ".",
      [], [], None, "index.html#tools", "Browse the tools")
    T("skills", "Agensi skills for AI agents", "agensi skill skills ai agent claude cursor codex prompt bundle",
      f"We publish {len([s for s in skills if s['type']!='bundle'])} skills and a bundle on Agensi. Skills plug into your AI agent; the <b>Google Search Console SEO Bundle (7 growth skills)</b> is $29.",
      [], ["agency", "business"], None, "https://agensi.io/creators/cygnix-labs", "See all Agensi skills")
    T("contact", "Contact the team", "contact email phone reach human person team support address office whatsapp",
      f"Email <a href=\"mailto:{CONTACT}\">{CONTACT}</a>, or use the form on this page. The team replies by email, usually within 1–2 business days. You can also send this conversation to the team with the button below.",
      [], [], "Just a question", "#contact", "Open the contact form")
    T("about", "Who is Cygnix Labs?", "who are you about company cygnix labs team based where kuwait",
      "Cygnix Labs builds SEO and AEO (AI search) tools and fixes websites that are not showing on Google or in AI answers. Every job follows three steps: the problem, a proof report from a real tool run, and the fix. We're based in Hawalli, Kuwait, and work with clients worldwide.")
    T("time", "How long does it take?", "how long time turnaround fast quick when deliver delivery days",
      "We confirm the scope and turnaround by email when you book. For a question or a free check, the team replies by email, usually within 1–2 business days.")
    T("process", "How does it work?", "how does it work process steps what happens next",
      "1) Send your site and the problem. 2) We run the matching tools on your live pages. 3) You get a report and fix list in plain English. 4) You fix it, or we do, then we recheck. 5) Optional monthly monitoring.",
      [], [], "Free site check", "index.html#process", "See the process")
    return kb

_kb = build_kb()
(_ROOT / "assets/kb.json").write_text(json.dumps({"updated": now, "contact": CONTACT, "items": _kb}, ensure_ascii=False, separators=(",", ":")))
print(f"kb: {len(_kb)} entries")
