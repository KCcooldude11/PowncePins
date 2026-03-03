from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


OUTPUT_DIR = Path(__file__).resolve().parents[1] / "assets" / "pins"
SIZE = 640


PIN_DEFS = [
    ("solar-jackal", "SJ", "#ffcf5c", "#f28b1d"),
    ("neon-bat", "NB", "#8fd1ff", "#5e63ff"),
    ("signal-tiger", "ST", "#ffd16a", "#ff6b2d"),
    ("arcade-lanyard", "AL", "#b8f6ff", "#3d7cff"),
    ("moon-ram-variant", "MR", "#ffe7ff", "#8a69ff"),
    ("pride-heart-fox", "PF", "#ffcde7", "#ff4b93"),
    ("meteor-pup", "MP", "#ffd5b1", "#ff6a3c"),
    ("sticker-pack-night", "SN", "#dcffe7", "#20a85d"),
    ("event-echo", "EE", "#ffe6bd", "#ff7e31"),
    ("custom-slot-50", "C5", "#d8f4ff", "#3ea1e0"),
    ("patreon-remainder", "PR", "#efe0ff", "#8358d6"),
    ("pixel-keychain", "PK", "#ffe4a3", "#c17f15"),
    ("lunar-lynx", "LL", "#d5e2ff", "#5674e0"),
    ("pop-rocket", "RR", "#ffc8c8", "#e65151"),
    ("comic-crown", "CC", "#fff1a3", "#e0a500"),
    ("bubble-blast", "BB", "#ffd7f4", "#d43fa7"),
]


def build_pin(filename: str, initials: str, bg_color: str, accent_color: str) -> None:
    image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    margin = 28
    card_rect = [margin, margin, SIZE - margin, SIZE - margin]

    draw.rounded_rectangle(
        [margin + 9, margin + 9, SIZE - margin + 9, SIZE - margin + 9],
        radius=86,
        fill="#000000",
    )
    draw.rounded_rectangle(card_rect, radius=86, fill=bg_color, outline="#000000", width=10)

    center = SIZE // 2
    ring_r = 185
    draw.ellipse(
        [center - ring_r, center - ring_r, center + ring_r, center + ring_r],
        fill="#ffffff",
        outline="#000000",
        width=9,
    )

    inner_r = 148
    draw.ellipse(
        [center - inner_r, center - inner_r, center + inner_r, center + inner_r],
        fill=accent_color,
        outline="#000000",
        width=8,
    )

    star_points = [
        (center, center - 92),
        (center + 26, center - 27),
        (center + 95, center - 21),
        (center + 43, center + 24),
        (center + 58, center + 92),
        (center, center + 52),
        (center - 58, center + 92),
        (center - 43, center + 24),
        (center - 95, center - 21),
        (center - 26, center - 27),
    ]
    draw.polygon(star_points, fill="#ffe45e", outline="#000000")

    banner_top = center + 128
    draw.rounded_rectangle(
        [center - 166, banner_top, center + 166, banner_top + 86],
        radius=30,
        fill="#ffffff",
        outline="#000000",
        width=8,
    )

    try:
        title_font = ImageFont.truetype("arialbd.ttf", 128)
        label_font = ImageFont.truetype("arialbd.ttf", 72)
    except OSError:
        title_font = ImageFont.load_default()
        label_font = ImageFont.load_default()

    label_bbox = draw.textbbox((0, 0), initials, font=title_font)
    label_w = label_bbox[2] - label_bbox[0]
    label_h = label_bbox[3] - label_bbox[1]
    draw.text(
        (center - label_w / 2, center - label_h / 2 - 16),
        initials,
        font=title_font,
        fill="#ffffff",
        stroke_width=8,
        stroke_fill="#000000",
    )

    small_text = "PIN"
    small_bbox = draw.textbbox((0, 0), small_text, font=label_font)
    small_w = small_bbox[2] - small_bbox[0]
    small_h = small_bbox[3] - small_bbox[1]
    draw.text(
        (center - small_w / 2, banner_top + 43 - small_h / 2),
        small_text,
        font=label_font,
        fill="#ff2b6b",
        stroke_width=4,
        stroke_fill="#000000",
    )

    image.save(OUTPUT_DIR / f"{filename}.png", "PNG")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for definition in PIN_DEFS:
        build_pin(*definition)
    print(f"Generated {len(PIN_DEFS)} pin PNGs in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()