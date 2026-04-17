"""Import Faire brand catalog into products.json.

Downloads product images from Faire CDN and appends entries to the
local products.json. Entries are marked status="pending-review" and
price=0 because Faire gates pricing behind retailer login.
"""
import json, os, re, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "images" / "products" / "faire"
IMG_DIR.mkdir(parents=True, exist_ok=True)
PRODUCTS_JSON = ROOT / "data" / "products.json"

FAIRE = [
    ("Vase in Patina", "p_8xxvea3zd3",
     "https://cdn.faire.com/fastly/3d58e805f2d7c823e3e72bf061dcf1ca6c89fe14519e06de29909f09eaebdf88.jpeg"),
    ("Round Planter Pot with Saucer in Cast Iron", "p_zhp84pyk9w",
     "https://cdn.faire.com/fastly/b1e273f36270dfb4507445a2e08b377d0c9a5b06570536d8c111e162e51c8ea8.jpeg"),
    ("Geo Waves in Midnight Stone", "p_9npnbcrvkm",
     "https://cdn.faire.com/fastly/838325a1592310031f9877787206d794d795a786d1f43d453c11e6e13f598b80.jpeg"),
    ("Small Round Planter in Bananrama", "p_3dnghjq24j",
     "https://cdn.faire.com/fastly/691dee7639dafbd9b2d51edcf1e272cf2e4e57bd4026f186c4857534cf610800.jpeg"),
    ("Small Planter Pot in Cast Iron", "p_gpuu3v9qnw",
     "https://cdn.faire.com/fastly/3786a8c1ba2902df7774a1ff76b613838c445e5c6d4a6522ca635024ed2f6dd8.jpeg"),
    ("Many Face Planter in Patina", "p_juzuc9833w",
     "https://cdn.faire.com/fastly/1980610768e824ef108cdd34870f5a60f1cba5133b27162df2fdd269c1955e4f.jpeg"),
    ("Hurricane Planter in Patina", "p_rv6gbznw8q",
     "https://cdn.faire.com/fastly/1a1e6a072bf66b572c02bc9b27b47df2f47251ff98e64738869dedab85bbcada.jpeg"),
    ("Peachtree in Cast Iron", "p_s3jv8phqc4",
     "https://cdn.faire.com/fastly/fdef291fc15f712b49bcc0f7400ff83d19617f890b2004396fcb4cf77189401d.jpeg"),
    ("Peachtree in Midnight Stone", "p_9ru72bz3px",
     "https://cdn.faire.com/fastly/bb509266601e475a5b0bf1d5917300f119f4bfbcd65207cf5637af36307575c7.jpeg"),
    ("Peachtree Planter in Midnight Stone Trifecta", "p_mnstrifecta01",
     "https://cdn.faire.com/fastly/3d4887ad21d6535b26ef7b99769a906b48cda08b541aa447d1db1b9a9ce8a71b.jpeg"),
    ("Hurricane Planter in Orange Trifecta", "p_4w6zp377cc",
     "https://cdn.faire.com/fastly/02198d55b9aa37942b25766f3c4ca742c7741b5455c7deffff8e3b7666623e3d.jpeg"),
    ("Geo Wave in Patina Peacock", "p_peacockgeo01",
     "https://cdn.faire.com/fastly/18b44d75451829ec372d1ff58fda093d525cb1608fa1d00acadeee41b89c8cbe.jpeg"),
]

def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s


def main():
    products = json.loads(PRODUCTS_JSON.read_text(encoding="utf-8"))
    existing_slugs = {p["slug"] for p in products}
    next_num = max((p.get("productNumber", 0) for p in products), default=0) + 1

    added = 0
    for name, faire_id, cdn_url in FAIRE:
        slug = slugify(name)
        if slug in existing_slugs:
            print(f"skip (exists): {slug}")
            continue

        # Download image
        img_url = f"{cdn_url}?bg-color=FFFFFF&dpr=2&fit=crop&format=jpg&height=960&width=720"
        img_name = f"{slug}_hero.jpg"
        img_path = IMG_DIR / img_name
        if not img_path.exists():
            print(f"download: {img_name}")
            req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as r, open(img_path, "wb") as f:
                f.write(r.read())

        products.append({
            "id": f"faire-{faire_id}",
            "slug": slug,
            "name": name,
            "productNumber": next_num,
            "price": 0,
            "description": (
                f"Imported from the Faire wholesale catalog for reference. "
                f"Pricing and specs pending review."
            ),
            "details": [
                "Imported from Faire catalog",
                "Pricing pending — confirm wholesale + retail rates",
                "Source: faire.com/brand/b_dm35y1pt"
            ],
            "images": [f"/images/products/faire/{img_name}"],
            "category": "faire-import",
            "tags": ["faire-import", "pending-review"],
            "status": "pending-review",
            "stripePriceId": "",
            "shippingWeight": "",
            "quantity": 0,
            "specs": {},
            "quickSpec": "Pending review",
            "bestUse": "Indoor display",
            "source": {
                "platform": "faire",
                "brandId": "b_dm35y1pt",
                "productId": faire_id,
                "originalUrl": (
                    f"https://www.faire.com/brand/b_dm35y1pt"
                    f"?brand=b_dm35y1pt&product={faire_id}"
                )
            }
        })
        next_num += 1
        added += 1

    PRODUCTS_JSON.write_text(json.dumps(products, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"done. added {added} products. total={len(products)}")


if __name__ == "__main__":
    main()
