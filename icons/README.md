# 练食 · 应用图标

**设计说明**：一只微俯视的碗，练的哑铃就搁在碗里——「练」与「食」合成一个轮廓，一眼能看出这个 App 是记训练、也记吃饭的。配色取自网页 `web/styles.css`：松绿 `#245b48` / `#10382e`、纸白 `#fbf7ee`、暖橙 `#f0a36d`。缩到 48px、32px 仍然清楚。

生成日期：2026 年 10 月 14 日

---

## 文件清单

```
icons/
├─ README.md                    本文件
├─ preview.png                  全部尺寸一览（含圆形与自适应图标效果）
├─ master/                      母版，改图或做其它平台用
│   ├─ icon-1024.png            圆角方形（网页、iOS、商店图）
│   ├─ icon-1024-round.png      圆形
│   ├─ icon-background-1024.png 自适应图标背景（满幅，不透明）
│   └─ icon-foreground-1024.png 自适应图标前景（透明底，内容居中）
├─ web/                         网页用
│   ├─ favicon.ico              16 / 32 / 48 三合一
│   ├─ favicon-16.png favicon-32.png
│   ├─ apple-touch-icon.png     180（iOS 添加到主屏）
│   ├─ icon-192.png icon-512.png
│   └─ icon-{16,32,48,64,96,128,152,180,192,256,512}.png
├─ android/                     安卓工程用（结构与 res/ 一致）
│   ├─ mipmap-mdpi/             ic_launcher 48、round 48、foreground 108
│   ├─ mipmap-hdpi/             72 / 72 / 162
│   ├─ mipmap-xhdpi/            96 / 96 / 216
│   ├─ mipmap-xxhdpi/           144 / 144 / 324
│   ├─ mipmap-xxxhdpi/          192 / 192 / 432
│   ├─ mipmap-anydpi-v26/       ic_launcher.xml、ic_launcher_round.xml
│   ├─ drawable/                ic_launcher_background.xml（松绿渐变）
│   └─ values/                  ic_launcher_background.xml（纯色备用）
└─ tools/                       生成脚本（想改比例或配色可重跑）
    ├─ export.py                导出全部尺寸
    ├─ make_icon4.py            碗与哑铃的绘制工具
    └─ make_icon5.py            本方案的绘制代码
```

---

## 怎么装进项目

### 一、安卓（换掉现在的默认图标）

把 `android/` 里的内容按同名目录覆盖到工程：

| 本目录 | 覆盖到 |
| --- | --- |
| `android/mipmap-*/` | `android/app/src/main/res/mipmap-*/` |
| `android/mipmap-anydpi-v26/ic_launcher.xml` | `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` |
| `android/mipmap-anydpi-v26/ic_launcher_round.xml` | `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml` |
| `android/drawable/ic_launcher_background.xml` | `android/app/src/main/res/drawable/ic_launcher_background.xml` |
| `android/values/ic_launcher_background.xml` | `android/app/src/main/res/values/ic_launcher_background.xml` |

PowerShell 一条命令（在项目根目录执行）：

```powershell
Copy-Item -Recurse -Force .\icons\android\* .\android\app\src\main\res\
```

然后重新打包：

```powershell
npm run android:apk
```

装到手机后，桌面图标就是新的碗和哑铃；`ic_launcher_round.xml` 已改成引用渐变背景，圆形启动器下也不会再是白底。

### 二、网页

把 `web/` 整个放到 `web/` 目录下（例如 `web/icons/`），再在 `web/index.html` 的 `<head>` 里加上：

```html
<link rel="icon" href="/web/icons/favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="/web/icons/favicon-32.png" sizes="32x32">
<link rel="icon" type="image/png" href="/web/icons/favicon-16.png" sizes="16x16">
<link rel="apple-touch-icon" href="/web/icons/apple-touch-icon.png">
<meta name="theme-color" content="#245b48">
```

浏览器标签页和「添加到主屏」就都会用新图标了。

---

## 备注

- 自适应图标的前景内容控制在画布中间约 65%，落在安卓的 66dp 安全区内，圆形、方形、水滴形遮罩都不会裁到碗和哑铃。
- 网页版没有单独的 manifest，`icon-192.png` / `icon-512.png` 先放着，以后做 PWA 直接可用。
- 想换配色或调整碗的比例，改 `tools/make_icon5.py` 里 `build_e()` 的参数后重跑 `tools/export.py` 即可（需要 Pillow）。
- 图标是本地生成的位图，没有外部素材，也没有用到需要授权的字体。
