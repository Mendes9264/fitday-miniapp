# -*- coding: utf-8 -*-
"""
“练食”(FitDay) 图标 · 第四轮：把碗画对

碗的关键：碗口比碗身宽一点 + 碗身先鼓后收 + 圈足。
A 碗上哑铃   B 练在食中（哑铃搁进碗里）   C/D 为对应反色版
"""
from __future__ import annotations

import math
import os

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

BASE = 1024
SS = 4096
K = SS / BASE
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "preview4")

PINE_DEEP = (16, 56, 46)
PINE_LIGHT = (54, 126, 100)
PAPER = (241, 245, 239)
CREAM_HI = (255, 253, 246)
CREAM_LO = (226, 219, 202)
WARM_HI = (247, 186, 140)
WARM_LO = (214, 114, 54)


def sc(v):
    return v * K


def new_mask():
    return Image.new("L", (SS, SS), 0)


def rr(m, box, r, val=255):
    ImageDraw.Draw(m).rounded_rectangle([sc(box[0]), sc(box[1]), sc(box[2]), sc(box[3])], radius=sc(r), fill=val)
    return m


def rrc(m, cx, cy, w, h, r, val=255):
    return rr(m, (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), r, val)


def poly(m, pts, val=255):
    ImageDraw.Draw(m).polygon([(sc(x), sc(y)) for x, y in pts], fill=val)
    return m


def grad_fill(mask, c_top, c_bot, angle=90.0):
    bbox = mask.getbbox()
    out = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
    if bbox is None:
        return out
    w, h = max(1, bbox[2] - bbox[0]), max(1, bbox[3] - bbox[1])
    n = 256
    y, x = np.mgrid[0:n, 0:n].astype(np.float32)
    a = math.radians(angle)
    t = x * math.cos(a) + y * math.sin(a)
    t = (t - t.min()) / (t.max() - t.min())
    wg = t[..., None]
    rgb = np.array(c_top, np.float32) * (1 - wg) + np.array(c_bot, np.float32) * wg
    g = Image.fromarray(rgb.astype(np.uint8), "RGB").resize((w, h), Image.BICUBIC).convert("RGBA")
    out.paste(g, (bbox[0], bbox[1]), mask.crop(bbox))
    return out


def radial_glow(img, cx, cy, r, color, alpha=0.18, power=1.7):
    n = 256
    y, x = np.mgrid[0:n, 0:n].astype(np.float32)
    d = np.sqrt((x - cx / BASE * n) ** 2 + (y - cy / BASE * n) ** 2) / max(r / BASE * n, 1e-6)
    a = (np.clip(1.0 - d, 0, 1) ** power * alpha * 255).astype(np.uint8)
    layer = Image.new("RGBA", (SS, SS), color + (0,))
    layer.putalpha(Image.fromarray(a, "L").resize((SS, SS), Image.BICUBIC))
    return Image.alpha_composite(img, layer)


def backdrop(shape="squircle", radius=230, mode="green"):
    m = new_mask()
    if shape == "circle":
        ImageDraw.Draw(m).ellipse([0, 0, SS - 1, SS - 1], fill=255)
    else:
        ImageDraw.Draw(m).rounded_rectangle([0, 0, SS - 1, SS - 1], radius=sc(radius), fill=255)
    if mode == "cream":
        img = grad_fill(m, (255, 254, 249), (228, 235, 227), angle=100)
        return radial_glow(img, 340, 240, 880, (255, 255, 255), 0.6)
    img = grad_fill(m, PINE_LIGHT, PINE_DEEP, angle=104)
    return radial_glow(img, 340, 250, 800, (255, 255, 255), 0.12)


def soft_shadow(layer, blur=40, offset=12, alpha=0.18):
    a = layer if layer.mode == "L" else layer.getchannel("A")
    sh = Image.new("L", (SS, SS), 0)
    sh.paste(a.point(lambda v: int(v * alpha)), (0, int(sc(offset))))
    sh = sh.filter(ImageFilter.GaussianBlur(sc(blur)))
    out = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
    out.putalpha(sh)
    return out


def fit_content(layer, target=630.0):
    bbox = layer.getbbox()
    if bbox is None:
        return layer
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    f = sc(target) / max(w, h)
    new = layer.resize((max(1, round(SS * f)), max(1, round(SS * f))), Image.LANCZOS)
    nb = new.getbbox()
    out = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
    out.paste(new, (round(SS / 2 - (nb[0] + nb[2]) / 2), round(SS / 2 - (nb[1] + nb[3]) / 2)), new)
    return out


# ---------------------------------------------------------------- 碗
def bowl_mask(cx=512, rim_top=470, rx=304, rim_h=68, base_y=784, body_rx=278, base_rx=150,
              bottom_ry=46, foot=(212, 50)):
    m = new_mask()
    body_top = rim_top + rim_h - 8
    n = 72
    prof = []
    for i in range(n + 1):
        t = i / n
        y = body_top + (base_y - body_top) * t
        hw = base_rx + (body_rx - base_rx) * ((1 - t ** 2.4) ** 0.6)
        prof.append((y, hw))
    pts = [(cx - hw, y) for y, hw in prof]
    for i in range(41):
        th = math.pi - math.pi * i / 40
        pts.append((cx + base_rx * math.cos(th), base_y + bottom_ry * math.sin(th)))
    pts += [(cx + hw, y) for y, hw in reversed(prof)]
    poly(m, pts)
    if foot:
        rr(m, (cx - foot[0] / 2, base_y + 6, cx + foot[0] / 2, base_y + 6 + foot[1]), 24)
    rr(m, (cx - rx, rim_top, cx + rx, rim_top + rim_h), rim_h / 2)
    return m


def dumbbell_mask(cx=512, cy=373, bar_half=118, bar_t=54, plate_w=134, plate_h=166, plate_r=38):
    m = new_mask()
    rrc(m, cx, cy, bar_half * 2 + 18, bar_t, bar_t / 2)
    for s in (-1, 1):
        rrc(m, cx + s * (bar_half + plate_w / 2 + 4), cy, plate_w, plate_h, plate_r)
    return m


BOWL = dict(rim_top=470, rx=304, rim_h=68, base_y=784, body_rx=278, base_rx=150, bottom_ry=46)


def _paint(bowl_layer, dum_layer, bowl_cols, dum_cols, dum_behind=False):
    out = Image.new("RGBA", (SS, SS), (0, 0, 0, 0))
    if dum_behind:
        out = Image.alpha_composite(out, soft_shadow(dum_layer, blur=30, offset=10, alpha=0.20))
        out = Image.alpha_composite(out, grad_fill(dum_layer, *dum_cols))
    out = Image.alpha_composite(out, soft_shadow(bowl_layer))
    out = Image.alpha_composite(out, grad_fill(bowl_layer, *bowl_cols))
    if not dum_behind:
        out = Image.alpha_composite(out, soft_shadow(dum_layer, blur=30, offset=10, alpha=0.22))
        out = Image.alpha_composite(out, grad_fill(dum_layer, *dum_cols))
    return out


CREAM_COLS = (CREAM_HI, CREAM_LO)
WARM_COLS = (WARM_HI, WARM_LO)


def build_a(mode="green"):
    """碗 + 哑铃：哑铃悬在碗口上方。"""
    bowl = bowl_mask(**BOWL)
    dum = dumbbell_mask(cy=373)
    bc, dc = (CREAM_COLS, WARM_COLS) if mode == "green" else (WARM_COLS, CREAM_COLS)
    return _paint(bowl, dum, bc, dc)


def build_b(mode="green"):
    """练在食中：哑铃搁进碗里，碗口遮住碗内的部分。"""
    bowl = bowl_mask(**BOWL)
    dum = dumbbell_mask(cy=424)
    bc, dc = (CREAM_COLS, WARM_COLS) if mode == "green" else (WARM_COLS, CREAM_COLS)
    return _paint(bowl, dum, bc, dc, dum_behind=True)


BUILD = {"A": build_a, "B": build_b, "C": build_b, "D": build_a}
MODES = {"A": "green", "B": "green", "C": "cream", "D": "cream"}
LABEL = {"A": "碗上哑铃", "B": "练在食中", "C": "练在食中·浅底", "D": "碗上哑铃·浅底"}


def compose(key, shape="squircle", mode=None):
    mode = mode or MODES[key]
    content = fit_content(BUILD[key](mode), 632)
    layer = backdrop(shape, 230, mode)
    layer = Image.alpha_composite(layer, soft_shadow(content, blur=34, offset=10,
                                                      alpha=0.20 if mode == "green" else 0.12))
    layer = Image.alpha_composite(layer, content)
    return layer.resize((BASE, BASE), Image.LANCZOS)


def sheet():
    cw, pad, top = 320, 28, 36
    keys = list(BUILD)
    W = pad + len(keys) * (cw + pad)
    H = top + 620 + 140
    canvas = Image.new("RGB", (W, H), PAPER)
    for i, k in enumerate(keys):
        x = pad + i * (cw + pad)
        big = compose(k, "squircle").resize((300, 300), Image.LANCZOS)
        canvas.paste(big, (x, top), big)
        circ = compose(k, "circle").resize((300, 300), Image.LANCZOS)
        canvas.paste(circ, (x, top + 312), circ)
        row = top + 632
        for j, sz in enumerate((96, 64, 44)):
            t = compose(k, "circle").resize((sz, sz), Image.LANCZOS)
            canvas.paste(t, (x + 12 + j * 100, row), t)
    os.makedirs(OUT, exist_ok=True)
    canvas.save(os.path.join(OUT, "concepts4.png"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for k in BUILD:
        compose(k).save(os.path.join(OUT, f"{k}.png"))
    sheet()
    print("done ->", OUT)
