# -*- coding: utf-8 -*-
"""
“练食”图标导出：把定稿方案（微俯视的碗 + 碗里的哑铃）导出为全套图标文件。

输出：
  master/   1024 母版（圆角方形 / 圆形 / 自适应前景 / 自适应背景）
  web/      favicon.ico、各尺寸 PNG、apple-touch-icon
  android/  各密度 mipmap（ic_launcher / ic_launcher_round / ic_launcher_foreground）
            以及 mipmap-anydpi-v26 与 drawable 的自适应图标 XML
"""
from __future__ import annotations

import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import make_icon4 as m4
import make_icon5 as m5

OUT = os.path.join(HERE, "out")
NOTO = r"C:\Windows\Fonts\NotoSansSC-VF.ttf"
PAPER = (241, 245, 239)
INK = (30, 53, 46)

# ------------------------------------------------------------------ 素材
CONTENT_TARGET = 668
content = m4.fit_content(m5.build_e("green", tilt=0.0, cy=410), CONTENT_TARGET)
SHADOW_COLOR_ALPHA = 0.20


def flat(shape: str) -> Image.Image:
    """超采样画布上的完整图标（外形 + 底 + 投影 + 内容）。"""
    layer = m4.backdrop(shape, 230, "green")
    layer = Image.alpha_composite(layer, m4.soft_shadow(content, blur=34, offset=10,
                                                         alpha=SHADOW_COLOR_ALPHA))
    return Image.alpha_composite(layer, content)


def background_full() -> Image.Image:
    full = Image.new("L", (m4.SS, m4.SS), 255)
    img = m4.grad_fill(full, m4.PINE_LIGHT, m4.PINE_DEEP, angle=104)
    return m4.radial_glow(img, 340, 250, 800, (255, 255, 255), 0.12)


def foreground() -> Image.Image:
    sh = m4.soft_shadow(content, blur=30, offset=8, alpha=0.18)
    return Image.alpha_composite(sh, content)


def save(img: Image.Image, *parts, size=None):
    path = os.path.join(OUT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    out = img if size is None else img.resize((size, size), Image.LANCZOS)
    out.save(path)
    return path


def main():
    squircle = flat("squircle")
    circle = flat("circle")
    bg = background_full()
    fg = foreground()

    # ---------------------------------------------------------- master
    save(squircle, "master", "icon-1024.png", size=1024)
    save(circle, "master", "icon-1024-round.png", size=1024)
    save(bg, "master", "icon-background-1024.png", size=1024)
    save(fg, "master", "icon-foreground-1024.png", size=1024)

    # ---------------------------------------------------------- web
    web = ("web",)
    for s in (16, 32, 48, 64, 96, 128, 152, 180, 192, 256, 512):
        save(squircle, *web, f"icon-{s}.png", size=s)
    save(squircle, *web, "apple-touch-icon.png", size=180)
    save(squircle, *web, "favicon-16.png", size=16)
    save(squircle, *web, "favicon-32.png", size=32)
    squircle.resize((256, 256), Image.LANCZOS).save(
        os.path.join(OUT, "web", "favicon.ico"),
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    # ---------------------------------------------------------- android
    dens = {"mdpi": (48, 108), "hdpi": (72, 162), "xhdpi": (96, 216),
            "xxhdpi": (144, 324), "xxxhdpi": (192, 432)}
    for name, (legacy, fg_size) in dens.items():
        d = ("android", f"mipmap-{name}")
        save(squircle, *d, "ic_launcher.png", size=legacy)
        save(circle, *d, "ic_launcher_round.png", size=legacy)
        save(fg, *d, "ic_launcher_foreground.png", size=fg_size)

    # ---------------------------------------------------------- 预览图
    preview(squircle, circle, bg, fg)
    print("done ->", OUT)


def preview(squircle, circle, bg, fg):
    scales = [512, 384, 256, 192, 144, 96, 72, 48, 32, 16]
    pad, top = 30, 96
    W = pad + sum(s + 26 for s in scales) + pad
    H = top + 512 + 210
    canvas = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(canvas)
    f_t = ImageFont.truetype(NOTO, 30)
    f_s = ImageFont.truetype(NOTO, 20)
    try:
        f_t.set_variation_by_axes([700])
    except Exception:
        pass
    d.text((pad, 40), "练食 · 图标（微俯视的碗 + 碗里的哑铃）", font=f_t, fill=INK)

    x = pad
    for s in scales:
        img = squircle.resize((s, s), Image.LANCZOS)
        canvas.paste(img, (x, top), img)
        d.text((x, top + s + 8), f"{s}", font=f_s, fill=(110, 126, 116))
        x += s + 26

    row = top + 512 + 52
    # 圆形 / 自适应模拟 / 前景 / 背景
    for i, (label, img) in enumerate((
        ("圆形（ic_launcher_round）", circle.resize((112, 112), Image.LANCZOS)),
        ("自适应图标（前景 + 背景）", Image.alpha_composite(
            bg.resize((112, 112), Image.LANCZOS), fg.resize((112, 112), Image.LANCZOS))),
        ("自适应前景", fg.resize((112, 112), Image.LANCZOS)),
        ("自适应背景", bg.resize((112, 112), Image.LANCZOS)),
    )):
        xx = pad + i * 260
        canvas.paste(img, (xx, row), img)
        d.text((xx, row + 120), label, font=f_s, fill=(110, 126, 116))
    canvas.save(os.path.join(OUT, "preview.png"))


if __name__ == "__main__":
    main()
