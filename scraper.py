def scrape_devpost():
    print(f"Launching headless browser to scrape {DEVPOST_URL}...")
    hackathons = []

    with sync_playwright() as p:
        # Launch with realistic browser arguments to prevent bot detection
        browser = p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1440, "height": 900}
        )
        page = context.new_page()
        
        try:
            page.goto(DEVPOST_URL, timeout=60000, wait_until="networkidle")
            
            # Wait for challenge cards or main grid to appear
            page.wait_for_selector("a[href*='devpost.com'], article, div[class*='challenge']", timeout=15000)
        except Exception as e:
            print(f"Note during page load wait: {e}")

        # Scroll to trigger lazy loading
        for i in range(3):
            print(f"Scrolling page ({i+1}/3)...")
            page.evaluate("window.scrollTo(0, document.body.scrollHeight);")
            page.wait_for_timeout(3000)

        html_content = page.content()
        browser.close()

    soup = BeautifulSoup(html_content, "html.parser")
    
    # Target anchor links pointing directly to Devpost hackathon subdomains/pages
    cards = []
    for a_tag in soup.find_all("a", href=True):
        href = a_tag["href"]
        # Match hackathon detail URLs (e.g., https://*.devpost.com or /?challenge_type=...)
        if ("devpost.com" in href or href.startswith("/")) and not any(x in href for x in ["/software", "/updates", "/login", "/signup"]):
            # Find the parent card container if possible, otherwise use the anchor block
            container = a_tag.find_parent(["article", "div"], class_=re.compile("challenge|tile|listing|card|row", re.I))
            cards.append(container if container else a_tag)
    
    # Fallback to general cards if needed
    if len(cards) < 5:
        cards = soup.find_all(["article", "div"], class_=re.compile("challenge|tile|listing|card", re.I))

    print(f"Extracted {len(cards)} raw listing elements. Parsing and tagging...")

    seen_urls = set()
    for card in cards:
        parsed = parse_hackathon_card(card)
        if parsed and parsed["url"] and parsed["url"] not in seen_urls:
            if "devpost.com" in parsed["url"] and len(parsed["title"]) > 3:
                seen_urls.add(parsed["url"])
                hackathons.append(parsed)

    return hackathons