"""Generate lightweight WebP assets and add intrinsic image dimensions to HTML.

Run from the repository root with Pillow installed:
    python scripts/optimize-images.py
"""

from __future__ import annotations

import re
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = ROOT / "assets" / "img"
MAX_WIDTH = 1200
WEBP_QUALITY = 82


def convert_large_pngs() -> dict[str, str]:
    replacements: dict[str, str] = {}
    for source in sorted(IMAGE_DIR.glob("*.png")):
        if source.name == "lacari-logo.png":
            continue

        destination = source.with_suffix(".webp")
        with Image.open(source) as image:
            image = image.convert("RGB")
            if image.width > MAX_WIDTH:
                image.thumbnail((MAX_WIDTH, MAX_WIDTH), Image.Resampling.LANCZOS)
            image.save(destination, "WEBP", quality=WEBP_QUALITY, method=6, exif=b"")

        replacements[source.name] = destination.name
        before = source.stat().st_size / 1024
        after = destination.stat().st_size / 1024
        print(f"{source.name}: {before:.0f} KB -> {destination.name}: {after:.0f} KB")
    return replacements


def update_image_references(replacements: dict[str, str]) -> None:
    files = [*ROOT.rglob("*.html"), ROOT / "assets" / "css" / "style.css"]
    for path in files:
        original = path.read_text(encoding="utf-8")
        updated = original
        for old_name, new_name in replacements.items():
            updated = updated.replace(old_name, new_name)
        if updated != original:
            path.write_text(updated, encoding="utf-8", newline="")


def add_intrinsic_dimensions() -> None:
    image_pattern = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
    src_pattern = re.compile(r'\bsrc="([^"]+)"', re.IGNORECASE)

    for page in ROOT.rglob("*.html"):
        original = page.read_text(encoding="utf-8")

        def update_tag(match: re.Match[str]) -> str:
            tag = match.group(0)
            if re.search(r"\bwidth=", tag, re.IGNORECASE) and re.search(
                r"\bheight=", tag, re.IGNORECASE
            ):
                return tag

            src_match = src_pattern.search(tag)
            if not src_match or src_match.group(1).startswith(("http:", "https:", "data:")):
                return tag

            image_path = (page.parent / src_match.group(1)).resolve()
            if not image_path.is_file() or ROOT not in image_path.parents:
                return tag

            with Image.open(image_path) as image:
                width, height = image.size
            return f'{tag[:-1]} width="{width}" height="{height}">'

        updated = image_pattern.sub(update_tag, original)
        if updated != original:
            page.write_text(updated, encoding="utf-8", newline="")


def generate_favicon() -> None:
    source = IMAGE_DIR / "lacari-logo.png"
    destination = ROOT / "favicon.ico"
    with Image.open(source) as image:
        image.save(destination, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"Generated {destination.relative_to(ROOT)}")


if __name__ == "__main__":
    generated = convert_large_pngs()
    update_image_references(generated)
    add_intrinsic_dimensions()
    generate_favicon()
