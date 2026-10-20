"""Fail fast on common SEO and static-site regressions."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import urlparse
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]


def sitemap_pages() -> list[Path]:
    tree = ElementTree.parse(ROOT / "sitemap.xml")
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    pages: list[Path] = []
    for node in tree.findall("s:url/s:loc", namespace):
        url = urlparse(node.text or "")
        if url.scheme != "https" or url.netloc != "clinicalacari.com.br":
            raise ValueError(f"Invalid sitemap URL origin: {node.text}")
        if url.query or url.fragment:
            raise ValueError(f"Sitemap URL must not contain query or fragment: {node.text}")
        path = url.path.lstrip("/")
        if not path or path.endswith("/"):
            path += "index.html"
        pages.append(ROOT / path)
    return pages


def local_target(page: Path, reference: str) -> Path | None:
    clean = reference.split("#", 1)[0].split("?", 1)[0]
    if not clean or clean.startswith(("http:", "https:", "mailto:", "tel:", "data:")):
        return None
    target = ROOT / clean.lstrip("/") if clean.startswith("/") else page.parent / clean
    target = target.resolve()
    if target.is_dir():
        target /= "index.html"
    return target


def main() -> None:
    errors: list[str] = []
    pages = sitemap_pages()

    # Duplicate entries can waste crawling and hide sitemap maintenance mistakes.
    seen_pages: set[Path] = set()
    for page in pages:
        if page in seen_pages:
            errors.append(f"Duplicate sitemap page: {page.relative_to(ROOT)}")
        seen_pages.add(page)

    for page in pages:
        if not page.is_file():
            errors.append(f"Missing sitemap page: {page.relative_to(ROOT)}")
            continue

        source = page.read_text(encoding="utf-8")
        rel = page.relative_to(ROOT)
        checks = {
            "title": r"<title>.+?</title>",
            "description": r'<meta\s+name="description"',
            "robots": r'<meta\s+name="robots"',
            "canonical": r'<link\s+rel="canonical"',
            "favicon": r'<link\s+rel="icon"',
            "Open Graph title": r'<meta\s+property="og:title"',
            "Twitter card": r'<meta\s+name="twitter:card"',
        }
        for label, pattern in checks.items():
            if len(re.findall(pattern, source, re.IGNORECASE | re.DOTALL)) != 1:
                errors.append(f"{rel}: expected exactly one {label}")

        if len(re.findall(r"<h1\b", source, re.IGNORECASE)) != 1:
            errors.append(f"{rel}: expected exactly one h1")

        canonical = re.search(r'rel="canonical"\s+href="([^"]+)"', source)
        canonical_path = "" if rel.as_posix() == "index.html" else rel.as_posix()
        if canonical_path.endswith("/index.html"):
            canonical_path = canonical_path[:-10]
        if not canonical or canonical.group(1) != "https://clinicalacari.com.br/" + canonical_path:
            errors.append(f"{rel}: canonical does not match sitemap page")

        for block in re.findall(
            r'<script\s+type="application/ld\+json"[^>]*>(.*?)</script>',
            source,
            re.IGNORECASE | re.DOTALL,
        ):
            try:
                json.loads(block)
            except json.JSONDecodeError as error:
                errors.append(f"{rel}: invalid JSON-LD ({error})")

        # Guard the largest visual against accidental lazy loading.
        if rel.as_posix() == "index.html":
            hero = re.search(r'<img\b(?=[^>]*\bclass="[^"]*\bhero-bg\b)[^>]*>', source, re.IGNORECASE | re.DOTALL)
            if not hero:
                errors.append("index.html: hero image not found")
            else:
                hero_tag = hero.group(0)
                if not re.search(r'\bloading="eager"', hero_tag, re.IGNORECASE):
                    errors.append("index.html: hero image must use loading=eager")
                if not re.search(r'\bfetchpriority="high"', hero_tag, re.IGNORECASE):
                    errors.append("index.html: hero image must use fetchpriority=high")

        for tag in re.findall(r"<img\b[^>]*>", source, re.IGNORECASE):
            src_match = re.search(r'\bsrc="([^"]+)"', tag, re.IGNORECASE)
            if not src_match:
                errors.append(f"{rel}: image without src")
                continue
            target = local_target(page, src_match.group(1))
            if target and not target.is_file():
                errors.append(f"{rel}: missing image {src_match.group(1)}")
            if target and not (re.search(r"\bwidth=", tag) and re.search(r"\bheight=", tag)):
                errors.append(f"{rel}: image lacks width/height: {src_match.group(1)}")

            srcset = re.search(r'\bsrcset="([^"]+)"', tag)
            if srcset:
                if not re.search(r'\bsizes="[^"]+"', tag):
                    errors.append(f"{rel}: responsive image without sizes")
                for candidate in srcset.group(1).split(","):
                    reference = candidate.strip().split()[0]
                    responsive_target = local_target(page, reference)
                    if responsive_target and not responsive_target.is_file():
                        errors.append(f"{rel}: missing responsive image {reference}")

        # Missing local scripts can silently break menus, forms and conversion tracking.
        for script in re.findall(r"<script\\b[^>]*>", source, re.IGNORECASE):
            src = re.search(r'\\bsrc="([^"]+)"', script, re.IGNORECASE)
            if not src:
                continue
            target = local_target(page, src.group(1))
            if target and not target.is_file():
                errors.append(f"{rel}: missing script {src.group(1)}")

        # Missing local stylesheets may leave the mobile site unusable.
        for link in re.findall(r"<link\\b[^>]*>", source, re.IGNORECASE):
            if not re.search(r'\\brel="stylesheet"', link, re.IGNORECASE):
                continue
            href = re.search(r'\\bhref="([^"]+)"', link, re.IGNORECASE)
            if not href:
                continue
            target = local_target(page, href.group(1))
            if target and not target.is_file():
                errors.append(f"{rel}: missing stylesheet {href.group(1)}")

        for href in re.findall(r'href="([^"]+)"', source, re.IGNORECASE):
            target = local_target(page, href)
            if target and not target.exists():
                errors.append(f"{rel}: broken internal link {href}")

    # Ensure contact conversion instrumentation stays wired during refactors.
    tracking = (ROOT / "assets/js/tracking.js").read_text(encoding="utf-8")
    form_script = (ROOT / "assets/js/main.js").read_text(encoding="utf-8")
    for event in ("whatsapp_click", "phone_click", "form_submit"):
        if f"'{event}'" not in tracking:
            errors.append(f"tracking.js: missing {event} conversion event")
    if "lacari:form_submit" not in tracking or "lacari:form_submit" not in form_script:
        errors.append("WhatsApp form event is not connected to conversion tracking")
    if "https://wa.me/" not in form_script:
        errors.append("WhatsApp form destination is missing")

    if errors:
        print("\n".join(errors))
        print(f"\n{len(errors)} problem(s) found.")
        sys.exit(1)

    print(f"Audit passed: {len(pages)} sitemap pages checked.")


if __name__ == "__main__":
    main()
