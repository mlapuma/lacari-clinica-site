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
        path = urlparse(node.text or "").path.lstrip("/")
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

        for block in re.findall(
            r'<script\s+type="application/ld\+json"[^>]*>(.*?)</script>',
            source,
            re.IGNORECASE | re.DOTALL,
        ):
            try:
                json.loads(block)
            except json.JSONDecodeError as error:
                errors.append(f"{rel}: invalid JSON-LD ({error})")

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

        for href in re.findall(r'href="([^"]+)"', source, re.IGNORECASE):
            target = local_target(page, href)
            if target and not target.exists():
                errors.append(f"{rel}: broken internal link {href}")

    if errors:
        print("\n".join(errors))
        print(f"\n{len(errors)} problem(s) found.")
        sys.exit(1)

    print(f"Audit passed: {len(pages)} sitemap pages checked.")


if __name__ == "__main__":
    main()
