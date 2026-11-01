# Builds problems.html (hub) and one page per problem from problems_data.py, reusing the pricing page chrome.
# exec'd from build.py (shares SITE, EMAIL, PHONE, TEL, e, ld, org, website, faq_ld, fill, ROOT, now).
import urllib.parse as _up
_ptpl = (ROOT / "pricing-template.html").read_text()
_body_start = _ptpl.index("<body>")
_head_tail = _ptpl[_ptpl.index('<link rel="icon"'):_ptpl.index('<script type="application/ld+json">')]
_contact_form = _ptpl[_ptpl.index('<form class="f glass rv" id="contact-form"'):_ptpl.index("</form>") + len("</form>")]
_footer = _ptpl[_ptpl.index("<footer>"):]
_logo = _ptpl[_ptpl.index('<a class="logo" href="./"'):_ptpl.index("</a>", _ptpl.index('<a class="logo" href="./"')) + 4]
PURL = lambda s: f"{SITE}/{s}.html"
HUB = SITE + "/problems.html"
AREAS = ["Kuwait", "Saudi Arabia", "United Arab Emirates", "Qatar", "Bahrain", "Oman", "United Kingdom", "United States", "Canada", "Australia"]
FREE = "Free site check"

def _mailto(subject):
    return "mailto:" + EMAIL + "?subject=" + _up.quote(subject)

def _head(title, desc, url, ogt, ogd, jsonld):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index,follow,max-image-preview:large">
<meta name="theme-color" content="#0B1220">
<meta name="author" content="Cygnix Labs">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Cygnix Labs">
<meta property="og:title" content="{e(ogt)}">
<meta property="og:description" content="{e(ogd)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/img/og.jpg">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Cygnix Labs eagle next to the headline: Get found on Google and in AI answers">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@Cygnixlabs">
<meta name="twitter:title" content="{e(ogt)}">
<meta name="twitter:description" content="{e(ogd)}">
<meta name="twitter:image" content="{SITE}/assets/img/og.jpg">
{_head_tail}<script type="application/ld+json">{jsonld}</script>
</head>
'''

def _header(active):
    cur = ' aria-current="page"'
    a = lambda href, label: '<a href="' + href + '"' + (cur if active == href else '') + '>' + label + '</a>'
    return (_ptpl[_body_start:_ptpl.index('<header class="nav">')] +
            f'<header class="nav"><div class="wrap">\n {_logo}\n <nav aria-label="Main">{a("./", "Home")}{a("problems.html", "Problems we solve")}{a("./#process", "Process")}{a("./#tools", "Tools")}{a("pricing.html", "Pricing")}<a href="#contact">Contact</a></nav>\n'
            f' <a class="mlink" href="problems.html">Problems</a>\n <a class="btn btn-p btn-sm" href="#contact" data-package="{FREE}">Free audit</a>\n</div></header>\n')

def _contact(topic):
    return f'''<section id="contact"><div class="wrap">
 <p class="eyebrow">Free first audit</p>
 <h2>Get a free audit of your site</h2>
 <p class="sub">Send your website and the problem you see. We run the real tools on your live pages and email you the findings and a Fix Queue of up to 15 items. No passwords, no obligation.</p>
 <div class="contact">
  <div class="side glass rv">
   <h3>What happens next</h3>
   <ol><li>You send your site (form, or email {EMAIL}).</li><li>We run the audit on your public pages and email the results.</li><li>You fix it yourself with our list, or ask us to do it.</li></ol>
   <p>Email: <a href="{_mailto("Free audit: " + topic)}">{EMAIL}</a><br>Phone: <a href="tel:{TEL}">{PHONE}</a></p>
   <p><a href="?package=consultation#contact" data-package="Free 15-min consultation" data-msg="I would like a free 15-min consultation about: {e(topic)}"><b>Book a free 15-min consultation →</b></a></p>
  </div>
  {_contact_form}
 </div>
</div></section>
</main>
'''

def _footer_html():
    return _footer.replace('<li><a href="pricing.html">Pricing</a></li>', '<li><a href="problems.html">Problems we solve</a></li><li><a href="pricing.html">Pricing</a></li>')

def _process():
    return '''<div class="proc">
  <div class="proc-line" aria-hidden="true"><span></span></div>
  <div class="pstep glass"><span class="pn">1</span><h3>Free audit</h3><p>Real tool runs on your live pages. No passwords needed.</p></div>
  <div class="pstep glass"><span class="pn">2</span><h3>Fix Queue</h3><p>Up to 15 fixes, ranked P0 (urgent) to P3 (nice to have), each with evidence.</p></div>
  <div class="pstep glass"><span class="pn">3</span><h3>Your approval</h3><p>Anything your customers will read is approved by you before it goes live.</p></div>
  <div class="pstep glass"><span class="pn">4</span><h3>Specialist fixes</h3><p>Our SEO and AI-search specialists make the changes, or hand your developer the exact list.</p></div>
  <div class="pstep glass"><span class="pn">5</span><h3>QA-checked</h3><p>A separate QA reviewer checks every fix on your live site before we call it done.</p></div>
 </div>'''

def _faq_html(faqs):
    return "".join(f'<details{" open" if n == 0 else ""}><summary>{e(q)}</summary><p>{e(a)}</p></details>' for n, (q, a) in enumerate(faqs))

def _crumbs(name, url):
    items = [("Home", SITE + "/"), ("Problems we solve", HUB)] + ([(name, url)] if url != HUB else [])
    return {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": n + 1, "name": a, "item": b} for n, (a, b) in enumerate(items)]}

def _free_offer(url):
    return {"@type": "Offer", "name": "Free first audit", "price": "0", "priceCurrency": "USD", "url": url + "#contact", "availability": "https://schema.org/InStock", "seller": {"@id": SITE + "/#org"}}

def _strip(h):
    return re.sub("<[^>]+>", "", h)

BY = {p["slug"]: p for p in PROBLEMS}
for p in PROBLEMS:
    url = PURL(p["slug"]); name = _strip(p["h1"])
    tool_cards = "".join(f'<a class="tool glass" href="{APIFY}{t}" target="_blank" rel="noopener"><div class="meta"><span class="badge apify">Apify actor</span></div><h3>{e(TOOLS[t])}</h3><p>Run it yourself on your own URLs and data. Pay per use on Apify.</p><div class="ft"><span class="go">Run on Apify →</span></div></a>' for t in p["tools"])
    related = "".join(f'<a class="find glass" href="{r}.html"><span class="fi" aria-hidden="true">{BY[r]["icon"]}</span><h3>{e(BY[r]["short"])}</h3><p>{e(BY[r]["desc"])}</p><small>Read the guide →</small></a>' for r in p["related"])
    faq_src = _faq_html(p["faqs"])
    page = {"@type": "WebPage", "@id": url + "#page", "url": url, "name": p["title"], "description": p["desc"], "inLanguage": "en", "isPartOf": {"@id": SITE + "/#site"},
            "about": {"@id": url + "#service"}, "breadcrumb": _crumbs(p["short"], url), "dateModified": now, "publisher": {"@id": SITE + "/#org"}}
    svc = {"@type": "Service", "@id": url + "#service", "name": "Fix: " + p["short"], "description": p["desc"], "provider": {"@id": SITE + "/#org"},
           "serviceType": "SEO and AEO (AI search) audit and fixes", "areaServed": [{"@type": "Country", "name": c} for c in AREAS], "url": url, "offers": _free_offer(url)}
    faqld = {"@type": "FAQPage", "@id": url + "#faq", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p["faqs"]]}
    signs = "".join(f"<li>{e(s)}</li>" for s in p["signs"])
    cost = "".join(f'<article class="find glass"><span class="fi" aria-hidden="true">0{n+1}</span><p>{e(c)}</p></article>' for n, c in enumerate(p["cost"]))
    dos = "".join(f"<li>{e(d)}</li>" for d in p["do"])
    plain = "".join(f"<p>{e(x)}</p>" for x in p["plain"])
    topic = p["short"]
    html_out = (_head(p["title"], p["desc"], url, _strip(p["h1"]) + " | Cygnix Labs", p["desc"], ld([org, website, page, svc, faqld])) + _header("problems.html") + f'''
<main id="main">
<section class="phero" id="top" aria-label="{e(name)}"><div class="wrap">
 <div>
  <p class="crumbs"><a href="./">Home</a> › <a href="problems.html">Problems we solve</a> › {e(topic)}</p>
  <span class="pill"><span class="dot"></span>Explained from zero</span>
  <h1>{p["h1"]}</h1>
  <p class="lead">{e(p["lead"])}</p>
  <div class="ctas"><a class="btn btn-p" href="#contact" data-package="{FREE}" data-msg="Free audit request ({e(topic)}). My website: ">Get a free audit</a><a class="btn btn-g" href="#signs">Do I have this problem?</a></div>
 </div>
 <div class="mock pcheck glass" aria-label="Quick self-check"><div class="mh"><span>60-SECOND SELF-CHECK</span><span class="tag">YOU CAN DO THIS NOW</span></div>
  {"".join(f'<div class="chk"><i>?</i>{e(s)}</div>' for s in p["signs"][:3])}
 </div>
</div></section>

<section id="plain"><div class="wrap">
 <p class="eyebrow">In plain words</p>
 <h2>What is going on</h2>
 <div class="prose glass rv">{plain}</div>
</div></section>

<section id="signs"><div class="wrap">
 <p class="eyebrow">How to tell</p>
 <h2>Signs you have this problem</h2>
 <ul class="checklist glass rv">{signs}</ul>
 <p class="note">Ticked two or more? <a href="#contact" data-package="{FREE}" data-msg="Free audit request ({e(topic)}). My website: ">Ask for a free audit</a> and we check it properly on your live pages.</p>
</div></section>

<section id="cost"><div class="wrap">
 <p class="eyebrow">Why it matters</p>
 <h2>Why it costs you money</h2>
 <div class="finds">{cost}</div>
 <div class="gulf glass rv"><h3>In Kuwait and Saudi Arabia</h3><p>{e(p["gulf"])}</p></div>
</div></section>

<section id="process"><div class="wrap">
 <p class="eyebrow">What we do</p>
 <h2>Audit, Fix Queue, QA-checked fixes</h2>
 <p class="sub">The same team process for every client. Nothing is reported as fixed until our QA reviewer has checked it on your live site.</p>
 {_process()}
 <div class="prose glass rv"><h3>For this problem specifically</h3><ul>{dos}</ul><p class="small">No one can honestly guarantee rankings or AI placement. We guarantee clear evidence, before and after.</p></div>
</div></section>

<section id="tools"><div class="wrap">
 <p class="eyebrow">Check it yourself</p>
 <h2>The tools we use for this</h2>
 <p class="sub">These are our own live tools. Prefer we run them for you? The first audit is free.</p>
 <div class="grid">{tool_cards}</div>
</div></section>

<section id="faq"><div class="wrap">
 <p class="eyebrow">FAQ</p>
 <h2>Questions about this problem</h2>
 <div class="faq">{faq_src}</div>
</div></section>

<section id="related"><div class="wrap">
 <p class="eyebrow">Related problems</p>
 <h2>Often found together</h2>
 <div class="finds">{related}</div>
 <div class="flow"><a class="btn btn-g" href="problems.html">All problems we solve</a><a class="btn btn-g" href="pricing.html">Packages and pricing</a></div>
</div></section>
''' + _contact(topic) + "\n" + _footer_html())
    (ROOT / f'{p["slug"]}.html').write_text(fill(html_out))

# ---- hub ----
hub_cards = "".join(f'<a class="find glass" href="{p["slug"]}.html"><span class="fi" aria-hidden="true">{p["icon"]}</span><h3>{e(p["short"])}</h3><p>{e(p["desc"])}</p><small>Read the guide →</small></a>' for p in PROBLEMS)
hub_faqs = [("I don't know which problem I have. What should I do?", "Ask for the free audit. We run our tools on your live pages and tell you which of these problems you have, in priority order."),
            ("Do you work with businesses in Kuwait and Saudi Arabia?", "Yes. We are based in Kuwait and work with businesses in the Gulf, the UK, the US, Canada and Australia. We check Arabic and English versions of your site."),
            ("Do you need my passwords?", "No, never. When we need access you invite us with a limited role, and you can remove it at any time."),
            ("Can you guarantee results?", "No one can honestly guarantee rankings or AI answers. We guarantee evidence: a real report, a ranked Fix Queue, and fixes checked by a separate QA reviewer.")]
hub_page = {"@type": "CollectionPage", "@id": HUB + "#page", "url": HUB, "name": "Problems we solve | Cygnix Labs", "inLanguage": "en", "isPartOf": {"@id": SITE + "/#site"},
            "breadcrumb": _crumbs("Problems we solve", HUB), "dateModified": now,
            "mainEntity": {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": n + 1, "url": PURL(p["slug"]), "name": p["short"]} for n, p in enumerate(PROBLEMS)]}}
hub_svc = {"@type": "Service", "@id": HUB + "#service", "name": "SEO and AEO problem fixing", "provider": {"@id": SITE + "/#org"}, "serviceType": "SEO and AEO (AI search) audit and fixes",
           "areaServed": [{"@type": "Country", "name": c} for c in AREAS], "url": HUB, "offers": _free_offer(HUB)}
hub_faq = {"@type": "FAQPage", "@id": HUB + "#faq", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in hub_faqs]}
hub_desc = "Not on Google, missing from ChatGPT answers, traffic drop, broken redirects, clinic or salon not on Google Maps: the website problems we fix, each explained from zero."
hub = (_head("Problems we solve: website, Google and AI search problems explained | Cygnix Labs", hub_desc, HUB, "Problems we solve | Cygnix Labs", hub_desc, ld([org, website, hub_page, hub_svc, hub_faq])) + _header("problems.html") + f'''
<main id="main">
<section class="phero" id="top" aria-label="Problems we solve"><div class="wrap">
 <div>
  <p class="crumbs"><a href="./">Home</a> › Problems we solve</p>
  <span class="pill"><span class="dot"></span>Explained from zero</span>
  <h1>Problems we solve, <span class="c">in plain words</span></h1>
  <p class="lead">You don't need to know SEO. Pick the problem that sounds like yours: what it is, how to tell, why it costs money, and how we fix it.</p>
  <div class="ctas"><a class="btn btn-p" href="#contact" data-package="{FREE}" data-msg="Free audit request. My website: ">Get a free audit</a><a class="btn btn-g" href="#list">See the problems</a></div>
 </div>
 <div class="mock pcheck glass" aria-label="Who we help"><div class="mh"><span>WHO WE HELP</span><span class="tag">GULF · UK · US · CA · AU</span></div>
  <div class="chk"><i>✓</i>Clinics, dental and medical practices</div><div class="chk"><i>✓</i>Salons, spas and beauty</div><div class="chk"><i>✓</i>Online stores</div><div class="chk"><i>✓</i>Cleaning and home services</div><div class="chk"><i>✓</i>SEO and marketing agencies (white-label)</div>
 </div>
</div></section>
<section id="list"><div class="wrap">
 <p class="eyebrow">Pick your problem</p>
 <h2>The problems we find and fix most</h2>
 <p class="sub">Each guide is written for business owners. No jargon without an explanation.</p>
 <div class="finds">{hub_cards}</div>
</div></section>
<section id="process"><div class="wrap">
 <p class="eyebrow">How we work</p>
 <h2>Audit, Fix Queue, QA-checked fixes</h2>
 <p class="sub">A specialist team: SEO and AI-search specialists do the work, a separate QA reviewer checks it, and one service manager keeps you informed.</p>
 {_process()}
</div></section>
<section id="faq"><div class="wrap">
 <p class="eyebrow">FAQ</p>
 <h2>Before you ask</h2>
 <div class="faq">{_faq_html(hub_faqs)}</div>
</div></section>
''' + _contact("not sure which problem") + "\n" + _footer_html())
(ROOT / "problems.html").write_text(fill(hub))
print(f"built problems: hub + {len(PROBLEMS)} pages")
