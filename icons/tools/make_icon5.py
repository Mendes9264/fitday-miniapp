# -*- coding: utf-8 -*-
"""
“练食”(FitDay) 图标 · 第五轮：带透视的碗

E 练在食中：微俯视的碗，哑铃搁在碗里（碗口前沿挡住底部）
F 斜靠碗口：同上，但哑铃斜搭在碗口上，更有动势
"""
from __future__ import annotations

import math
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from make_icon4 import (BASE, SS, K, sc, new_mask, rr, rrc, poly, grad_fill, radial_glow,
                        backdrop, soft_shadow, fit_content, CREAM_HI, CREAM_LO, WARM_HI, WARM_LO,
                        PAPER, PINE_DEEP, PINE_LIGHT)

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "preview5")
CREAM_MID = (243, 238, 226)
CREAM_MID_LO = (226, 219, 201)


def bezier(p0, p1, p2, p3, n=90):
    pts = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        x = mt ** 3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t ** 3 * p3[0]
        y = mt ** 3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t ** 3 * p3[1]
        pts.append((x, y))
    return pts


def bowl_25d_mask(cx=512, rim_cy=462, rx=312, ry=98, bottom_y=790, k1=192, k2=182,
                  bottom_shadow=True):
    """微俯视的碗身：两侧用三次贝塞尔平滑收到底，接缝处没有折角。"""
    m = new_mask()
    left = bezier((cx - rx, rim_cy), (cx - rx, rim_cy + k1), (cx - k2, bottom_y), (cx, bottom_y))
    right = bezier((cx, bottom_y), (cx + k2, bottom_y), (cx + rx, rim_cy + k1), (cx + rx, rim_cy))
    poly(m, left + right[1:])
    # 后半碗口（上半个椭圆），与碗身合成完整外轮廓
    back = new_mask()
    ImageDraw.Draw(back).pieslice([sc(cx - rx), sc(rim_cy - ry), sc(cx + rx), sc(rim_cy + ry)],
                                  start=180, end=360, fill=255)
    m = ImageChops.lighter(m, back)
    return m


def ellipse_mask(cx, cy, rx, ry):
    m = new_mask()
    ImageDraw.Draw(m).ellipse([sc(cx - rx), sc(cy - ry), sc(cx + rx), sc(cy + ry)], fill=255)
    return m


def lower_half(mask, y):
    cut = new_mask()
    ImageDraw.Draw(cut).rectangle([0, sc(y), SS, SS], fill=255)
    return ImageChops.multiply(mask, cut)


def dumbbell_mask(cx=512, cy=410, bar_half=92, bar_t=46, plate_w=112, plate_h=144, plate_r=32):
    m = new_mask()
    rrc(m, cx, cy, bar_half * 2 + 18, bar_t, bar_t / 2)
    for s in (-1, 1):
        rrc(m, cx + s * (bar_half + plate_w / 2 + 4), cy, plate_w, plate_h, plate_r)
    return m


def grad_sheet(ref_bbox, c_top, c_bot, angle=90.0):
    """按参考外接框生成整幅渐变，供同一材质的多块蒙版共用，避免接缝。"""
    import numpy as np
    out = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
    w, h = max(1, ref_bbox[2] - ref_bbox[0]), max(1, ref_bbox[3] - ref_bbox[1])
    n = 256
    y, x = np.mgrid[0:n, 0:n].astype(np.float32)
    a = math.radians(angle)
    t = x * math.cos(a) + y * math.sin(a)
    t = (t - t.min()) / (t.max() - t.min())
    wg = t[..., None]
    rgb = np.array(c_top, np.float32) * (1 - wg) + np.array(c_bot, np.float32) * wg
    g = Image.fromarray(rgb.astype(np.uint8), "RGB").resize((w, h), Image.BICUBIC).convert("RGBA")
    out.paste(g, (ref_bbox[0], ref_bbox[1]))
    return out


def paste_through(base, sheet, mask):
    layer = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
    layer.paste(sheet, (0, 0), mask)
    return Image.alpha_composite(base, layer)


def build_e(mode="green", tilt=0.0, cy=410, rim_cy=462, rx=312, ry=98):
    wall = 46
    inner_rx, inner_ry = rx - wall, ry - 30
    bowl = bowl_25d_mask(rim_cy=rim_cy, rx=rx, ry=ry)
    inner = ellipse_mask(512, rim_cy, inner_rx, inner_ry)
    dum = dumbbell_mask(cy=cy)
    if tilt:
        dum = dum.rotate(-tilt, resample=Image.BICUBIC, center=(SS // 2, sc(cy)))
    cream = (CREAM_HI, CREAM_LO) if mode == "green" else ((255, 254, 250), (228, 233, 226))
    surf = (CREAM_MID, CREAM_MID_LO) if mode == "green" else ((250, 246, 237), (232, 227, 214))
    warm = (WARM_HI, WARM_LO)

    out = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
    out = Image.alpha_composite(out, soft_shadow(bowl, blur=40, offset=12, alpha=0.20))
    cream_sheet = grad_sheet(bowl.getbbox(), *cream)
    out = paste_through(out, cream_sheet, bowl)
    out = Image.alpha_composite(out, grad_fill(inner, *surf))
    # 碗内壁上方阴影
    back = ImageChops.subtract(inner, ImageChops.offset(inner, 0, int(sc(20)))).filter(
        ImageFilter.GaussianBlur(sc(22)))
    shadow_layer = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
    shadow_layer.putalpha(back.point(lambda v: int(v * 0.09)))
    out = Image.alpha_composite(out, shadow_layer)
    # 哑铃投在碗里的影子
    cast = ellipse_mask(512, cy + 104, 250, 40).filter(ImageFilter.GaussianBlur(sc(26)))
    cast = ImageChops.multiply(cast, inner)
    cl = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
    cl.putalpha(cast.point(lambda v: int(v * 0.13)))
    out = Image.alpha_composite(out, cl)
    # 哑铃
    out = Image.alpha_composite(out, grad_fill(dum, *warm))
    # 碗口前沿：碗身减去碗口，再取下半部分，盖住碗里的部分
    front = ImageChops.subtract(bowl, inner)
    front = lower_half(front, rim_cy - 4)
    out = paste_through(out, cream_sheet, front)
    return out


BUILD = {
    "E": lambda mode="green": build_e(mode, tilt=0.0, cy=410),
    "F": lambda mode="green": build_e(mode, tilt=-11.0, cy=396),
    "G": lambda mode="green": build_e(mode, tilt=0.0, cy=384, rim_cy=452, rx=336, ry=112),
}


def compose(key, shape="squircle", mode="green"):
    content = fit_content(BUILD[key](mode), 636)
    layer = backdrop(shape, 230, mode)
    layer = Image.alpha_composite(layer, soft_shadow(content, blur=34, offset=10,
                                                     alpha=0.20 if mode == "green" else 0.12))
    layer = Image.alpha_composite(layer, content)
    return layer.resize((BASE, BASE), Image.LANCZOS)


def sheet():
    cw, pad, top = 330, 28, 36
    keys = list(BUILD)
    W = pad + len(keys) * (cw + pad)
    H = top + 310 + 310 + 130
    canvas = Image.new("RGB", (W, H), PAPER)
    for i, k in enumerate(keys):
        x = pad + i * (cw + pad)
        for j, (mode, shape) in enumerate((("green", "squircle"), ("cream", "squircle"))):
            t = compose(k, shape, mode).resize((300, 300), Image.LANCZOS)
            canvas.paste(t, (x, top + j * 310), t)
        row = top + 626
        for j, (mode, sz) in enumerate((("green", 92), ("cream", 92), ("green", 48), ("cream", 48))):
            t = compose(k, "circle", mode).resize((sz, sz), Image.LANCZOS)
            canvas.paste(t, (x + 10 + j * 78, row), t)
    os.makedirs(OUT, exist_ok=True)
    canvas.save(os.path.join(OUT, "concepts5.png"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for k in BUILD:
        compose(k).save(os.path.join(OUT, f"{k}.png"))
    sheet()
    print("done ->", OUT)
