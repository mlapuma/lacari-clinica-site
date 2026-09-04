"""Keep essential search and social metadata consistent on sitemap pages."""

from __future__ import annotations

import html
import re
from pathlib import Path
from urllib.parse import urljoin, urlparse
from xml.etree import ElementTree


ROOT = Path(__file__).resolve().parents[1]
SITE_URL = "https://clinicalacari.com.br/"
DEFAULT_IMAGE = f"{SITE_URL}assets/img/clinica/dra-tamara-lacari-recepcao.webp"


def extract(pattern: str, source: str) -> str:
    match = re.search(pattern, source, re.IGNORECASE | re.DOTALL)
    return html.unescape(match.group(1).strip()) if match else ""


def page_path(url: str) -> Path:
    path = urlparse(url).path.lstrip("/")
    if not path or path.endswith("/"):
        path += "index.html"
    return ROOT / path


def social_image(source: str, canonical: str) -> str:
    candidates = re.findall(r'<img\b[^>]*\bsrc="([^"]+)"', source, re.IGNORECASE)
    preferred = next((item for item in candidates if "lacari-logo" not in item), "")
    if not preferred:
        return DEFAULT_IMAGE
    return urljoin(canonical, preferred)


def meta_block(title: str, description: str, canonical: str, image: str, is_article: bool) -> str:
    title = html.escape(title, quote=True)
    description = html.escape(description, quote=True)
    canonical = html.escape(canonical, quote=True)
    image = html.escape(image, quote=True)
    og_type = "article" if is_article else "website"
    return (
        '\n    <meta property="og:locale" content="pt_BR">'
        '\n    <meta property="og:site_name" content="LaCari Odontologia">'
        f'\n    <meta property="og:title" content="{title}">'
        f'\n    <meta property="og:description" content="{description}">'
        f'\n    <meta property="og:type" content="{og_type}">'
        f'\n    <meta property="og:url" content="{canonical}">'
        f'\n    <meta property="og:image" content="{image}">'
        '\n    <meta name="twitter:card" content="summary_large_image">'
        f'\n    <meta name="twitter:title" content="{title}">'
        f'\n    <meta name="twitter:description" content="{description}">'
        f'\n    <meta name="twitter:image" content="{image}">'
    )


def update_page(path: Path) -> None:
    source = path.read_text(encoding="utf-8")
    title = extract(r"<title>(.*?)</title>", source)
    description = extract(r'<meta\s+name="description"\s+content="([^"]*)"', source)
    canonical = extract(r'<link\s+rel="canonical"\s+href="([^"]+)"', source)
    if not all((title, description, canonical)):
        raise ValueError(f"Essential metadata missing from {path.relative_to(ROOT)}")

    updated = source
    if not re.search(r'<meta\s+name="robots"', updated, re.IGNORECASE):
        canonical_tag = re.search(r'<link\s+rel="canonical"[^>]*>', updated, re.IGNORECASE)
        if canonical_tag:
            robots = '\n    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">'
            updated = updated[: canonical_tag.end()] + robots + updated[canonical_tag.end() :]

    if not re.search(r'<link\s+rel="icon"', updated, re.IGNORECASE):
        canonical_tag = re.search(r'<link\s+rel="canonical"[^>]*>', updated, re.IGNORECASE)
        if canonical_tag:
            favicon = '\n    <link rel="icon" href="/favicon.ico" sizes="any">'
            updated = updated[: canonical_tag.end()] + favicon + updated[canonical_tag.end() :]

    image = extract(r'<meta\s+property="og:image"\s+content="([^"]+)"', updated)
    if not image:
        image = social_image(updated, canonical)

    if not re.search(r'<meta\s+property="og:title"', updated, re.IGNORECASE):
        canonical_tag = re.search(r'<link\s+rel="canonical"[^>]*>', updated, re.IGNORECASE)
        if canonical_tag:
            block = meta_block(title, description, canonical, image, "/blog/" in canonical)
            updated = updated[: canonical_tag.end()] + block + updated[canonical_tag.end() :]
    elif not re.search(r'<meta\s+name="twitter:card"', updated, re.IGNORECASE):
        og_image_tag = re.search(r'<meta\s+property="og:image"[^>]*>', updated, re.IGNORECASE)
        if og_image_tag:
            twitter = (
                '\n    <meta name="twitter:card" content="summary_large_image">'
                f'\n    <meta name="twitter:title" content="{html.escape(title, quote=True)}">'
                f'\n    <meta name="twitter:description" content="{html.escape(description, quote=True)}">'
                f'\n    <meta name="twitter:image" content="{html.escape(image, quote=True)}">'
            )
            updated = updated[: og_image_tag.end()] + twitter + updated[og_image_tag.end() :]

    if updated != source:
        path.write_text(updated, encoding="utf-8", newline="")
        print(path.relative_to(ROOT))


def main() -> None:
    sitemap = ElementTree.parse(ROOT / "sitemap.xml")
    namespace = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    for location in sitemap.findall("s:url/s:loc", namespace):
        update_page(page_path(location.text or ""))


if __name__ == "__main__":
    main()
