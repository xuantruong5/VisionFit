"""
VisionFit README visuals — hand-built animated SVGs.

Same design tokens as the author's profile README (HungNguyen3205).
Run:  python docs/readme/build.py      → writes every *.svg next to this file.
Edit the CONTENT section, re-run, commit the SVGs.
"""
from __future__ import annotations

import math
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parent

# ── design tokens ────────────────────────────────────────────────────────────
BG, CARD, INNER = "#191d23", "#1f242b", "#262c34"
TXT, SUB, MUTED = "#f1eff1", "#c5bac4", "#a3a8b4"
PINK, CYAN, MINT, MINT_BG, MINT_PANEL = "#e0a8d6", "#7fc4d4", "#a8eee3", "#10201f", "#16302e"
LINE = "rgba(197,186,196,.16)"
L_TXT, L_ACC, L_STROKE = "#191d23", "#8a4f82", "#7b919c"

SANS = "'Segoe UI', -apple-system, 'Helvetica Neue', Arial, sans-serif"
MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', monospace"
SERIF = "Cambria, 'Noto Serif', 'Times New Roman', serif"

BASE_CSS = """
@media (prefers-reduced-motion: reduce){*{animation:none!important}.up{opacity:1!important}.bar,.grow{transform:none!important}}
.up{opacity:0;animation:up .9s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.pulse{animation:pulse 2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
.flow{stroke-dasharray:6 8;animation:flow 1.4s linear infinite}
@keyframes flow{to{stroke-dashoffset:-28}}
.bar{transform-box:fill-box;transform-origin:left;transform:scaleX(0);animation:bar 1.2s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes bar{to{transform:scaleX(1)}}
.grow{transform-box:fill-box;transform-origin:bottom;transform:scaleY(0);animation:grow 1.1s cubic-bezier(.2,.7,.2,1) forwards}
@keyframes grow{to{transform:scaleY(1)}}
.float{animation:float 6s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.orb{animation:orb 12s ease-in-out infinite alternate}
@keyframes orb{to{transform:translate(-60px,40px)}}
.scan{animation:scan 3.2s ease-in-out infinite alternate}
@keyframes scan{from{transform:translateY(0)}to{transform:translateY(330px)}}
.caret{animation:pulse 1s steps(1) infinite}
"""


def svg(w: int, h: int, label: str, body: str, css: str = "") -> str:
    a = escape(label, {'"': "&quot;"})
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
        f'role="img" aria-label="{a}"><title>{escape(label)}</title><style>{BASE_CSS}{css}</style>{body}</svg>'
    )


def t(x, y, s, size=16, fill=TXT, font=SANS, weight=None, anchor=None, ls=None, italic=False, extra=""):
    attrs = [f'x="{x}"', f'y="{y}"', f'font-family="{font}"', f'font-size="{size}"', f'fill="{fill}"']
    if weight:
        attrs.append(f'font-weight="{weight}"')
    if anchor:
        attrs.append(f'text-anchor="{anchor}"')
    if ls is not None:
        attrs.append(f'letter-spacing="{ls}"')
    if italic:
        attrs.append('font-style="italic"')
    if extra:
        attrs.append(extra)
    return f'<text {" ".join(attrs)}>{s if "<tspan" in s else escape(s)}</text>'


def chip(x, y, label, fill="rgba(197,186,196,.08)", color=TXT, size=13, h=30, mono=False):
    w = int(len(label) * size * (0.62 if mono else 0.66)) + 26
    r = h / 2
    font = MONO if mono else SANS
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{LINE}"/>'
        + t(x + w / 2, y + h / 2 + size * 0.36, label, size, color, font, 600, "middle")
    ), w


def chips(x, y, labels, **kw):
    out, cx = [], x
    for lb in labels:
        s, w = chip(cx, y, lb, **kw)
        out.append(s)
        cx += w + 8
    return "".join(out)


def write(name: str, content: str):
    (OUT / name).write_text(content, encoding="utf-8")
    print(f"  + {name:<28} {len(content.encode()) / 1024:6.1f} KB")


# ── animated skeleton (squat cycle) ──────────────────────────────────────────
# side view, local coords, ground at y=0. Two key poses, SMIL interpolates.
STAND = dict(head=(6, -214), sh=(0, -178), el=(30, -170), wr=(64, -172),
             hip=(-2, -100), kn=(4, -50), an=(0, 0), toe=(26, 0))
SQUAT = dict(head=(30, -150), sh=(16, -122), el=(52, -120), wr=(90, -122),
             hip=(-42, -66), kn=(40, -44), an=(0, 0), toe=(26, 0))
BONES = [("sh", "el"), ("el", "wr"), ("sh", "hip"), ("hip", "kn"), ("kn", "an"), ("an", "toe")]


def skeleton(ox, oy, scale=1.0, color=MINT, dur=2.4):
    def p(pose, k):
        x, y = pose[k]
        return ox + x * scale, oy + y * scale

    anim = f'dur="{dur}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1"'
    out = []
    for a, b in BONES:
        (x1, y1), (x2, y2) = p(STAND, a), p(STAND, b)
        (u1, v1), (u2, v2) = p(SQUAT, a), p(SQUAT, b)
        out.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="{5 * scale}" stroke-linecap="round">'
            f'<animate attributeName="x1" values="{x1};{u1};{x1}" {anim}/><animate attributeName="y1" values="{y1};{v1};{y1}" {anim}/>'
            f'<animate attributeName="x2" values="{x2};{u2};{x2}" {anim}/><animate attributeName="y2" values="{y2};{v2};{y2}" {anim}/></line>'
        )
    for k in STAND:
        (x, y), (u, v) = p(STAND, k), p(SQUAT, k)
        r = 17 * scale if k == "head" else 6 * scale
        fill = "none" if k == "head" else MINT_BG
        sw = 4 * scale if k == "head" else 2.5 * scale
        out.append(
            f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{color}" stroke-width="{sw}">'
            f'<animate attributeName="cx" values="{x};{u};{x}" {anim}/><animate attributeName="cy" values="{y};{v};{y}" {anim}/></circle>'
        )
    return "".join(out)


def cycling_text(x, y, values, dur_each, size, fill, font=SANS, weight=800, anchor=None):
    """Show values[i] during the i-th slot — a discrete counter without JS."""
    n, total, out = len(values), len(values) * dur_each, []
    for i, v in enumerate(values):
        a, b = i / n, (i + 1) / n
        kt = "0;" + (f"{a:.4f};" if i else "") + f"{b:.4f};1"
        vals = ("0;" if i else "") + "1;0;0"
        out.append(
            t(x, y, v, size, fill, font, weight, anchor, extra='opacity="0"').replace(
                "</text>",
                f'<animate attributeName="opacity" values="{vals}" keyTimes="{kt}" dur="{total}s" calcMode="discrete" repeatCount="indefinite"/></text>',
            )
        )
    return "".join(out)


# ── 1. hero ─────────────────────────────────────────────────────────────────
def hero():
    W, H = 1200, 600
    b = [
        f'<defs><radialGradient id="o1"><stop offset="0" stop-color="{PINK}" stop-opacity=".32"/><stop offset="1" stop-color="{PINK}" stop-opacity="0"/></radialGradient>'
        f'<radialGradient id="o2"><stop offset="0" stop-color="{CYAN}" stop-opacity=".26"/><stop offset="1" stop-color="{CYAN}" stop-opacity="0"/></radialGradient>'
        f'<linearGradient id="nm" x1="0" x2="1"><stop offset="0" stop-color="{TXT}"/><stop offset="1" stop-color="{SUB}"/></linearGradient>'
        f'<linearGradient id="sc" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="{MINT}" stop-opacity="0"/><stop offset="1" stop-color="{MINT}" stop-opacity=".35"/></linearGradient>'
        f'<clipPath id="cl"><rect width="{W}" height="{H}" rx="28"/></clipPath><clipPath id="cam"><rect x="700" y="110" width="452" height="400" rx="18"/></clipPath>'
        '<pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(197,186,196,.05)"/></pattern></defs>',
        f'<g clip-path="url(#cl)"><rect width="{W}" height="{H}" fill="{BG}"/><rect width="{W}" height="{H}" fill="url(#grid)"/>',
        '<g class="orb"><circle cx="880" cy="230" r="330" fill="url(#o1)"/></g><circle cx="1080" cy="480" r="240" fill="url(#o2)"/>',
        # top bar
        t(48, 58, f'VISIONFIT<tspan fill="{PINK}" font-size="13" dy="-8">®</tspan>', 20, TXT, SANS, 800, ls=1),
        f'<circle cx="440" cy="51" r="4" fill="{CYAN}" class="pulse"/>',
        t(454, 56, "CAMERA: TRACKING", 13, MUTED, MONO, ls=2),
        t(1152, 56, "NCKH / 2026 · DUY TAN UNIVERSITY", 13, MUTED, MONO, anchor="end", ls=2),
        f'<line x1="48" y1="84" x2="1152" y2="84" stroke="{LINE}"/>',
        # left copy
        '<g class="up" style="animation-delay:.1s">' + t(48, 146, "COMPUTER VISION · AI COACH · SMART GYM", 14, PINK, MONO, ls=3) + "</g>",
        '<g class="up" style="animation-delay:.25s">' + t(44, 240, "VisionFit", 104, "url(#nm)", SANS, 800, ls=-4) + "</g>",
        '<g class="up" style="animation-delay:.4s">' + t(44, 318, f'Camera thấy<tspan fill="{PINK}">.</tspan> AI hiểu<tspan fill="{PINK}">.</tspan>', 46, TXT, SANS, 800, ls=-1.5) + "</g>",
        '<g class="up" style="animation-delay:.55s">'
        + t(48, 372, "Phân tích kỹ thuật tập luyện qua một camera duy nhất —", 22, SUB, SERIF, italic=True)
        + t(48, 402, "và vận hành cả phòng gym trên một hệ sinh thái.", 22, SUB, SERIF, italic=True)
        + t(48, 440, f'No sensors. No cloud lock-in. Just movement, understood<tspan class="caret" fill="{PINK}"> ▍</tspan>', 16, MUTED)
        + "</g>",
        '<g class="up" style="animation-delay:.75s">' + chips(48, 470, ["POSE 33", "ACTIONNET", "REP COUNTER", "VIF ASSISTANT"]) + "</g>",
        # camera panel
        '<g class="up" style="animation-delay:.3s">',
        f'<rect x="700" y="110" width="452" height="400" rx="18" fill="{MINT_BG}" stroke="{LINE}"/>',
        '<g clip-path="url(#cam)">',
        '<pattern id="g2" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="rgba(168,238,227,.06)"/></pattern>',
        '<rect x="700" y="110" width="452" height="400" fill="url(#g2)"/>',
        f'<line x1="740" y1="430" x2="1112" y2="430" stroke="{MINT}" stroke-opacity=".25" stroke-dasharray="3 6"/>',
        skeleton(900, 430, 1.05),
        f'<g class="scan"><rect x="700" y="80" width="452" height="60" fill="url(#sc)"/><line x1="700" y1="140" x2="1152" y2="140" stroke="{MINT}" stroke-opacity=".6"/></g>',
        "</g>",
    ]
    # corner brackets
    for cx, cy, dx, dy in [(716, 126, 1, 1), (1136, 126, -1, 1), (716, 494, 1, -1), (1136, 494, -1, -1)]:
        b.append(f'<path d="M{cx},{cy + 22 * dy} V{cy} H{cx + 22 * dx}" fill="none" stroke="{MINT}" stroke-width="2.5"/>')
    b += [
        f'<circle cx="736" cy="148" r="5" fill="#ff6b81" class="pulse"/>',
        t(748, 153, "REC · LIVE", 12, MINT, MONO, 700, ls=2),
        t(1120, 153, "ACTIONNET → SQUAT", 12, MINT, MONO, 700, "end", ls=1),
        # HUD readouts
        f'<rect x="724" y="448" width="150" height="46" rx="10" fill="{MINT_PANEL}" stroke="{MINT}" stroke-opacity=".35"/>',
        t(738, 466, "KNEE ANGLE", 10, MINT, MONO, ls=1, extra='fill-opacity=".7"'),
        cycling_text(738, 486, ["172°", "88°"], 1.2, 18, MINT),
        f'<rect x="978" y="448" width="150" height="46" rx="10" fill="{MINT_PANEL}" stroke="{MINT}" stroke-opacity=".35"/>',
        t(992, 466, "REPS", 10, MINT, MONO, ls=1, extra='fill-opacity=".7"'),
        cycling_text(992, 486, [f"{i:02d} / 12" for i in range(1, 13)], 2.4, 18, MINT),
        "</g>",
        # marquee
        f'<line x1="0" y1="540" x2="{W}" y2="540" stroke="{LINE}"/>',
    ]
    words = ["POSENET 33 LANDMARKS", "TEMPORAL CNN", "BIOMECHANICS", "FINITE STATE MACHINE", "GEMINI FUNCTION CALLING",
             "LARAVEL 12", "REACT NATIVE", "VUE 3", "OFFLINE-CAPABLE"]
    line = "   ✦   ".join(words) + "   ✦   "
    width = round(len(line) * 13 * 0.62, 1)
    b.append(
        f'<style>.mq{{animation:mq 34s linear infinite}}@keyframes mq{{to{{transform:translateX(-{width}px)}}}}</style>'
        f'<g class="mq">{t(48, 576, escape(line + line), 13, MUTED, MONO, ls=0)}</g>'
    )
    b.append("</g>")
    write("hero.svg", svg(W, H, "VisionFit — Camera thấy. AI hiểu. Hệ sinh thái phân tích kỹ thuật tập luyện và quản lý phòng gym thông minh.", "".join(b)))


# ── 2. chapter headers (dark + light) ───────────────────────────────────────
CHAPTERS = [
    ("01", "about", "VÌ SAO CÓ VISIONFIT", "Từ một khung hình, đến một buổi tập đúng."),
    ("02", "numbers", "NHỮNG CON SỐ", "Hệ sinh thái, đo bằng thứ đã chạy được."),
    ("03", "architecture", "KIẾN TRÚC HỆ THỐNG", "Năm phân hệ, một luồng dữ liệu."),
    ("04", "modules", "CÁC PHÂN HỆ", "Mỗi mô-đun một vai, cùng một mục tiêu."),
    ("05", "pipeline", "HUẤN LUYỆN MÔ HÌNH", "Dữ liệu thật, mô hình của riêng mình."),
    ("06", "stack", "CÔNG NGHỆ", "Chọn công cụ theo bài toán."),
    ("07", "start", "BẮT ĐẦU", "Clone, cài, chạy — năm terminal là đủ."),
]


def chapter(num, title, quote, light=False):
    stroke = L_STROKE if light else SUB
    acc = L_ACC if light else PINK
    txt = L_TXT if light else TXT
    body = (
        t(0, 96, num, 96, "none", SANS, 800, ls=-2, extra=f'stroke="{stroke}" stroke-opacity=".45"')
        + '<g class="up">'
        + t(140, 54, f"CHAPTER {num} — {title}", 14, acc, MONO, ls=3)
        + t(138, 100, quote, 40, txt, SERIF, italic=True)
        + "</g>"
        + f'<rect class="bar" style="animation-delay:.3s;animation-duration:1.6s" x="0" y="133.5" width="1200" height="1" fill="{stroke}" fill-opacity=".35"/>'
        + f'<circle cx="1196" cy="134" r="4" fill="{acc}" class="pulse"/>'
    )
    return svg(1200, 150, f"{num} — {title.title()}: {quote}", body)


def chapters():
    for num, slug, title, quote in CHAPTERS:
        write(f"chapter-{slug}.svg", chapter(num, title, quote))
        write(f"chapter-{slug}-light.svg", chapter(num, title, quote, light=True))


# ── 3. about / problem → solution ───────────────────────────────────────────
def about():
    W, H = 1200, 300
    cols = [
        (CYAN, "VẤN ĐỀ", "Tập sai tư thế, không ai sửa.",
         ["Người tập tự học thiếu phản hồi kỹ thuật;", "cảm biến đeo người thì đắt và bất tiện;", "phòng gym vẫn quản lý bằng sổ và Excel."]),
        (PINK, "GIẢI PHÁP", "Một camera, một hệ sinh thái.",
         ["Ước lượng 33 khớp, nhận diện động tác,", "đếm rep và chấm góc sinh cơ học —", "nối liền Hội viên, PT và Ban quản lý."]),
        (MINT, "KẾT QUẢ", "Tập đúng hơn, vận hành nhẹ hơn.",
         ["Cảnh báo sai tư thế kể cả khi bị che khuất;", "trợ lý VIF trả lời bằng dữ liệu thật;", "lịch, gói tập, doanh thu trên một nền tảng."]),
    ]
    b, x, cw = [], 0, 388
    for i, (c, k, head, lines) in enumerate(cols):
        g = [f'<g class="up" style="animation-delay:{i * .15:.2f}s">',
             f'<rect x="{x}" y="0" width="{cw}" height="{H}" rx="22" fill="{CARD}" stroke="{LINE}"/>',
             f'<circle cx="{x + 36}" cy="42" r="6" fill="{c}" class="pulse"/>',
             t(x + 52, 47, k, 13, c, MONO, 700, ls=3),
             t(x + 28, 104, head, 23, TXT, SANS, 800, ls=-.5),
             f'<rect class="bar" style="animation-delay:{.4 + i * .15:.2f}s" x="{x + 28}" y="126" width="{cw - 56}" height="3" rx="1.5" fill="{c}"/>']
        for j, ln in enumerate(lines):
            g.append(t(x + 28, 172 + j * 30, ln, 15.5, MUTED))
        g.append("</g>")
        b.append("".join(g))
        if i < 2:
            ax = x + cw + 6
            b.append(f'<path d="M{ax},150 l10,0 m-5,-5 l5,5 l-5,5" stroke="{SUB}" stroke-opacity=".5" fill="none" stroke-width="2"/>')
        x += cw + 18
    write("about.svg", svg(W, H, "Vấn đề: tập sai tư thế không ai sửa. Giải pháp: một camera, một hệ sinh thái. Kết quả: tập đúng hơn, vận hành nhẹ hơn.", "".join(b)))


# ── 4. numbers ──────────────────────────────────────────────────────────────
def numbers():
    items = [
        ("33", CYAN, "Điểm khớp mỗi khung", ["PoseNet hồi quy heatmap,", "chuẩn hóa tâm hông & thân."]),
        ("05", PINK, "Phân hệ", ["AI core, trợ lý VIF, backend,", "app di động, web quản trị."]),
        ("09", SUB, "Công cụ AI thật", ["Gemini Function Calling gọi", "thẳng dữ liệu phòng tập."]),
        ("03", MINT, "Vai trò người dùng", ["Hội viên, Huấn luyện viên", "và Ban quản lý."]),
    ]
    b = []
    for i, (n, c, title, lines) in enumerate(items):
        x = i * 305
        b.append(
            f'<g class="up" style="animation-delay:{i * .15:.2f}s"><rect x="{x}" y="0" width="285" height="250" rx="22" fill="{CARD}" stroke="{LINE}"/>'
            + t(x + 28, 104, n, 78, TXT, SANS, 800, ls=-3)
            + f'<rect class="bar" style="animation-delay:{.4 + i * .15:.2f}s" x="{x + 28}" y="124" width="229" height="3" rx="1.5" fill="{c}"/>'
            + t(x + 28, 160, title, 18, TXT, SANS, 700)
            + t(x + 28, 190, lines[0], 14.5, MUTED)
            + t(x + 28, 212, lines[1], 14.5, MUTED)
            + "</g>"
        )
    write("numbers.svg", svg(1200, 250, "33 điểm khớp · 5 phân hệ · 9 công cụ AI · 3 vai trò người dùng", "".join(b)))


# ── 5. architecture ─────────────────────────────────────────────────────────
def node(x, y, w, h, color, kicker, title, lines, delay=0.0):
    out = [f'<g class="up" style="animation-delay:{delay:.2f}s">',
           f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="16" fill="{INNER}" stroke="{color}" stroke-opacity=".55"/>',
           f'<rect x="{x}" y="{y}" width="5" height="{h}" rx="2.5" fill="{color}"/>',
           t(x + 22, y + 28, kicker, 11, color, MONO, 700, ls=2),
           t(x + 22, y + 56, title, 19, TXT, SANS, 800)]
    for i, ln in enumerate(lines):
        out.append(t(x + 22, y + 82 + i * 21, ln, 13.5, MUTED))
    out.append("</g>")
    return "".join(out)


def arrow(d, color, label=None, lx=0, ly=0, anchor="middle"):
    s = f'<path d="{d}" fill="none" stroke="{color}" stroke-width="2" stroke-opacity=".8" class="flow"/>'
    if label:
        s += t(lx, ly, label, 11, color, MONO, 600, anchor, ls=1)
    return s


def architecture():
    W, H = 1200, 700
    b = [f'<rect width="{W}" height="{H}" rx="28" fill="{CARD}"/><rect x=".5" y=".5" width="{W - 1}" height="{H - 1}" rx="28" fill="none" stroke="{LINE}"/>',
         t(40, 50, "CLIENTS", 12, MUTED, MONO, ls=3), t(40, 278, "CORE", 12, MUTED, MONO, ls=3), t(40, 506, "INTELLIGENCE & DATA", 12, MUTED, MONO, ls=3)]
    for y in (262, 490):
        b.append(f'<line x1="40" y1="{y}" x2="1160" y2="{y}" stroke="{LINE}" stroke-dasharray="2 6"/>')
    # clients
    b.append(node(40, 70, 350, 160, CYAN, "MOBILE · REACT NATIVE", "📱 VisionFit App", ["Hội viên & Huấn luyện viên", "Lịch tập, streak, chat PT, QR", "Gửi video để AI phân tích"], .05))
    b.append(node(425, 70, 350, 160, PINK, "WEB · VUE 3 + VITE", "📊 Admin Dashboard", ["Doanh thu, hội viên, gói tập", "Quản trị PT & lớp học", "Báo cáo chất lượng AI"], .15))
    b.append(node(810, 70, 350, 160, MINT, "WEB STUDIO · HTML5 CANVAS", "💻 AI Studio", ["Soi skeleton từ webcam / video", "Gán nhãn & cắt clip dữ liệu", "Chạy cục bộ, không cần cloud"], .25))
    # core
    b.append(node(40, 298, 735, 170, PINK, "BACKEND · LARAVEL 12 · PHP 8.2", "⚙️ VisionFit API Gateway", [
        "Sanctum token đa vai trò  ·  Reverb chat & thông báo realtime",
        "Hội viên / PT / gói tập / buổi tập / thanh toán / mạng xã hội gym",
        "VIF Orchestrator: Gemini Function Calling + 9 tool nội bộ"], .35))
    b.append(node(810, 298, 350, 170, CYAN, "ASSISTANT · NODE.JS 24", "🤖 Chatbox_AI", ["Trợ lý VIF chạy độc lập", "/assistant/me · /assistant/context", "Lịch sử SQLite theo gym·role·user"], .45))
    # data
    b.append(node(40, 526, 350, 140, SUB, "DATABASE", "🗄️ MySQL", ["Migrations & seeders", "Eloquent ORM cho toàn hệ thống"], .55))
    b.append(node(425, 526, 350, 140, PINK, "LLM · GOOGLE GEMINI", "✨ Gemini API", ["Function Calling (flash-lite)", "gemini-embedding-001 · tri thức"], .65))
    b.append(node(810, 526, 350, 140, MINT, "AI CORE · PYTORCH", "🎯 visionfit-ai-pro", ["PoseNet 33 khớp · ActionNet", "Biomechanics & bộ đếm rep FSM"], .75))
    # arrows
    b += [
        arrow("M215,230 V298", CYAN, "REST · WS", 225, 270, "start"),
        arrow("M600,230 V298", PINK, "REST", 610, 270, "start"),
        arrow("M1160,150 H1180 V596 H1160", MINT, "LOCAL", 1176, 420, "end"),
        arrow("M775,383 H810", CYAN),
        arrow("M215,468 V526", SUB, "SQL", 225, 484, "start"),
        arrow("M600,468 V526", PINK, "TOOLS", 610, 484, "start"),
        arrow("M700,468 C700,500 900,490 900,526", MINT, "BRIDGE", 790, 506, "start"),
    ]
    for cx, cy, c in [(215, 298, CYAN), (600, 298, PINK), (1160, 596, MINT), (810, 383, CYAN), (215, 526, SUB), (600, 526, PINK), (900, 526, MINT)]:
        b.append(f'<circle cx="{cx}" cy="{cy}" r="4.5" fill="{CARD}" stroke="{c}" stroke-width="2"/>')
    write("architecture.svg", svg(W, H, "Kiến trúc VisionFit: App di động, Admin Dashboard và AI Studio → Laravel API Gateway và Chatbox_AI → MySQL, Gemini API và lõi visionfit-ai-pro.", "".join(b)))


# ── 6. module cards ─────────────────────────────────────────────────────────
def card_shell(H, visual, idx, color, path, title, tagline, bullets, tech, label):
    W = 1200
    b = [f'<rect width="{W}" height="{H}" rx="28" fill="{CARD}"/><rect x=".5" y=".5" width="{W - 1}" height="{H - 1}" rx="28" fill="none" stroke="{LINE}"/>',
         f'<rect x="24" y="24" width="440" height="{H - 48}" rx="18" fill="{MINT_BG if color == MINT else INNER}" stroke="{LINE}"/>',
         visual,
         '<g class="up" style="animation-delay:.1s">',
         t(504, 66, f"MODULE {idx}", 13, color, MONO, 700, ls=3),
         t(1168, 66, path, 12.5, MUTED, MONO, anchor="end"),
         t(502, 118, title, 38, TXT, SANS, 800, ls=-1),
         t(504, 152, tagline, 19, SUB, SERIF, italic=True),
         f'<rect class="bar" style="animation-delay:.4s" x="504" y="172" width="664" height="2" rx="1" fill="{color}" fill-opacity=".7"/>']
    for i, ln in enumerate(bullets):
        y = 210 + i * 32
        b.append(f'<circle cx="510" cy="{y - 5}" r="3.5" fill="{color}"/>' + t(526, y, ln, 15.5, TXT if i == 0 else SUB))
        b.append("")
    b.append(chips(504, H - 66, tech, size=12, h=28, mono=True))
    b.append("</g>")
    return svg(W, H, label, "".join(b))


def card_ai():
    # temporal strip: 32 frames → class probabilities
    v = [t(48, 64, "ACTIONNET · 32 × 33 × 4", 12, MINT, MONO, 700, ls=2)]
    for i in range(32):
        x = 48 + i * 12.4
        h = 30 + 38 * (0.5 + 0.5 * math.sin(i / 32 * math.tau * 2))
        v.append(f'<rect class="grow" style="animation-delay:{i * .03:.2f}s" x="{x:.1f}" y="{170 - h:.1f}" width="8" height="{h:.1f}" rx="2" fill="{MINT}" fill-opacity="{.35 + .5 * (i % 8 == 0):.2f}"/>')
    v.append(f'<path d="M48,190 H440" stroke="{MINT}" stroke-opacity=".2"/>')
    v.append(t(48, 212, "TEMPORAL CNN →", 11, MINT, MONO, ls=1, extra='fill-opacity=".7"'))
    for j, (lb, p) in enumerate([("squat", .92), ("lunge", .05), ("push_up", .02), ("standing", .01)]):
        y = 236 + j * 30
        v.append(t(48, y + 12, lb, 13, MINT, MONO, 600))
        v.append(f'<rect x="140" y="{y}" width="290" height="14" rx="7" fill="{MINT_PANEL}"/>')
        v.append(f'<rect class="bar" style="animation-delay:{.5 + j * .12:.2f}s" x="140" y="{y}" width="{max(6, 290 * p):.0f}" height="14" rx="7" fill="{MINT}" fill-opacity="{1 if j == 0 else .45}"/>')
    write("module-ai.svg", card_shell(
        404, "".join(v), "01", MINT, "modules/model_AI/visionfit-ai-pro", "Lõi Thị Giác Máy Tính",
        "Hiểu chuyển động — ngay trên máy của bạn.",
        ["PoseNet: ảnh RGB 128×128 → 33 điểm khớp (x, y, visibility)",
         "ActionNet Temporal CNN: squat · push_up · lunge · standing",
         "Góc gối, khuỷu, hông thời gian thực + đếm rep bằng FSM",
         "Web Studio, gán nhãn, cắt clip & đo chỉ số — chạy offline"],
        ["Python 3.10", "PyTorch", "OpenCV", "NumPy"],
        "Module 01 — Lõi thị giác máy tính visionfit-ai-pro: PoseNet 33 khớp, ActionNet, đếm rep."))


def card_vif():
    v = [t(48, 64, "VIF ASSISTANT · TOOL CALL", 12, CYAN, MONO, 700, ls=2)]
    v.append(f'<g class="up" style="animation-delay:.2s"><rect x="150" y="84" width="290" height="44" rx="14" fill="{CYAN}" fill-opacity=".16" stroke="{CYAN}" stroke-opacity=".4"/>'
             + t(166, 112, "Tối nay mình có lịch tập không?", 14, TXT) + "</g>")
    v.append(f'<g class="up" style="animation-delay:.6s"><rect x="48" y="142" width="250" height="32" rx="8" fill="{BG}" stroke="{LINE}"/>'
             + t(62, 163, "ƒ get_my_schedule()", 13, CYAN, MONO, 700)
             + f'<circle cx="282" cy="158" r="4" fill="{MINT}" class="pulse"/></g>')
    v.append(f'<g class="up" style="animation-delay:1s"><rect x="48" y="188" width="320" height="68" rx="14" fill="{BG}" stroke="{LINE}"/>'
             + t(64, 214, "19:00 hôm nay · Leg day với PT.", 14, TXT)
             + t(64, 238, "Bạn còn 8 buổi trong gói tập.", 14, SUB) + "</g>")
    v.append('<g class="up" style="animation-delay:1.3s">' + chips(48, 278, ["schedule", "packages", "meal_plan"], size=11, h=26, mono=True, color=CYAN) + "</g>")
    v.append(t(48, 334, "dữ liệu minh họa", 11, MUTED, MONO, extra='fill-opacity=".6"'))
    write("module-vif.svg", card_shell(
        404, "".join(v), "02", CYAN, "backend · Services/Assistant  +  model_AI/Chatbox_AI", "Trợ Lý Thể Hình VIF",
        "Trả lời bằng dữ liệu của bạn, không phải đoán.",
        ["Gemini Function Calling với 9 tool nội bộ có kiểm chứng",
         "Tìm tri thức bằng gemini-embedding-001 + cache vector truy vấn",
         "Ngữ cảnh theo vai trò: Hội viên · PT · Ban quản lý",
         "Fallback OpenAI-compatible, xử lý timeout · 429 · 5xx an toàn"],
        ["Gemini API", "Laravel", "Node.js 24", "SQLite"],
        "Module 02 — Trợ lý thể hình VIF: Gemini Function Calling, 9 tool nội bộ, tìm kiếm ngữ nghĩa."))


def card_backend():
    routes = [("POST", "/api/login", PINK), ("GET", "/api/members", CYAN), ("GET", "/api/lich-tap", CYAN),
              ("POST", "/api/buoi-tap", PINK), ("GET", "/api/goi-tap", CYAN), ("POST", "/api/assistant/chat", MINT),
              ("WS", "reverb · room.client", SUB)]
    v = [t(48, 64, "ROUTES · SANCTUM · REVERB", 12, PINK, MONO, 700, ls=2)]
    for i, (m, p, c) in enumerate(routes):
        y = 86 + i * 38
        v.append(f'<g class="up" style="animation-delay:{.1 + i * .1:.2f}s"><rect x="48" y="{y}" width="392" height="30" rx="8" fill="{BG}" stroke="{LINE}"/>'
                 + t(62, y + 20, m, 12, c, MONO, 800) + t(122, y + 20, p, 13, SUB, MONO)
                 + f'<circle cx="424" cy="{y + 15}" r="3.5" fill="{MINT}" class="pulse" style="animation-delay:{i * .3:.1f}s"/></g>')
    write("module-backend.svg", card_shell(
        404, "".join(v), "03", PINK, "modules/backend/visionfit", "Backend Trung Tâm",
        "Một nguồn sự thật cho cả phòng gym.",
        ["Laravel 12 · PHP 8.2 · Sanctum token đa vai trò",
         "Reverb realtime: chat Hội viên ↔ PT, thông báo đẩy",
         "Gói tập, buổi tập, lịch, thanh toán, mạng xã hội gym",
         "Bách khoa dinh dưỡng & thư viện bài tập dùng chung"],
        ["Laravel 12", "PHP 8.2", "Sanctum", "Reverb", "MySQL"],
        "Module 03 — Backend trung tâm Laravel 12: Sanctum, Reverb, quản lý gym, thanh toán."))


def card_mobile():
    v = [f'<rect x="168" y="44" width="152" height="300" rx="26" fill="{BG}" stroke="{SUB}" stroke-opacity=".45" stroke-width="2"/>',
         f'<rect x="222" y="54" width="44" height="6" rx="3" fill="{SUB}" fill-opacity=".35"/>',
         t(244, 92, "STREAK", 10, MUTED, MONO, anchor="middle", ls=2)]
    r, cx, cy = 42, 244, 150
    circ = 2 * math.pi * r
    v.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{INNER}" stroke-width="9"/>')
    v.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{CYAN}" stroke-width="9" stroke-linecap="round" '
             f'stroke-dasharray="{circ:.1f}" stroke-dashoffset="{circ:.1f}" transform="rotate(-90 {cx} {cy})">'
             f'<animate attributeName="stroke-dashoffset" from="{circ:.1f}" to="{circ * .3:.1f}" dur="1.6s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".2 .7 .2 1"/></circle>')
    v.append(t(cx, cy + 8, "🔥", 22, TXT, anchor="middle"))
    days = "T2 T3 T4 T5 T6 T7 CN".split()
    for i, d in enumerate(days):
        x = 186 + i * 19.5
        on = i < 5
        v.append(f'<circle cx="{x:.1f}" cy="220" r="6.5" fill="{CYAN if on else INNER}" fill-opacity="{1 if on else 1}"/>')
        v.append(t(x, 240, d, 8, MUTED, MONO, anchor="middle"))
    for i, (lb, c) in enumerate([("Leg day · 19:00", PINK), ("Chat với PT", CYAN), ("Quét QR điểm danh", MINT)]):
        y = 256 + i * 26
        v.append(f'<rect x="182" y="{y}" width="124" height="20" rx="6" fill="{INNER}"/><circle cx="192" cy="{y + 10}" r="3" fill="{c}"/>' + t(200, y + 14, lb, 10, SUB))
    v.append(f'<g class="float"><rect x="56" y="110" width="96" height="40" rx="12" fill="{INNER}" stroke="{LINE}"/>' + t(104, 128, "ROLE", 9, MUTED, MONO, anchor="middle", ls=1) + t(104, 143, "MEMBER", 11, CYAN, MONO, 700, "middle") + "</g>")
    v.append(f'<g class="float" style="animation-delay:-3s"><rect x="336" y="200" width="96" height="40" rx="12" fill="{INNER}" stroke="{LINE}"/>' + t(384, 218, "ROLE", 9, MUTED, MONO, anchor="middle", ls=1) + t(384, 233, "TRAINER", 11, PINK, MONO, 700, "middle") + "</g>")
    write("module-mobile.svg", card_shell(
        404, "".join(v), "04", CYAN, "modules/appmobile/VF", "Ứng Dụng Di Động",
        "Phòng gym nằm gọn trong túi.",
        ["Hội viên: khảo sát thể trạng, giáo án cá nhân, streak, calo",
         "Gửi video bài tập → nhận phản hồi kỹ thuật từ AI",
         "PT: học viên, lịch dạy, chấm điểm buổi tập, doanh thu",
         "Chat realtime, trợ lý VIF, gói tập, QR, thanh toán"],
        ["React Native 0.87", "React 19", "TypeScript"],
        "Module 04 — Ứng dụng di động React Native cho Hội viên và Huấn luyện viên."))


def card_web():
    v = [t(48, 64, "DASHBOARD · DOANH THU", 12, PINK, MONO, 700, ls=2)]
    vals = [.42, .55, .48, .66, .6, .78, .72, .9, .84, .97]
    for i, p in enumerate(vals):
        h = 170 * p
        v.append(f'<rect class="grow" style="animation-delay:{i * .07:.2f}s" x="{56 + i * 38}" y="{262 - h:.0f}" width="24" height="{h:.0f}" rx="5" fill="{PINK}" fill-opacity="{.4 + .06 * i:.2f}"/>')
    pts = " ".join(f"{68 + i * 38},{262 - 170 * p - 16:.0f}" for i, p in enumerate(vals))
    v.append(f'<polyline points="{pts}" fill="none" stroke="{CYAN}" stroke-width="2.5" stroke-linejoin="round" class="flow"/>')
    v.append(f'<line x1="48" y1="262" x2="440" y2="262" stroke="{LINE}"/>')
    for i, (k, val, c) in enumerate([("HỘI VIÊN MỚI", "↑", CYAN), ("GIA HẠN", "↑", MINT), ("PT", "★", PINK)]):
        x = 48 + i * 132
        v.append(f'<rect x="{x}" y="282" width="122" height="52" rx="12" fill="{BG}" stroke="{LINE}"/>' + t(x + 14, 302, k, 10, MUTED, MONO, ls=1) + t(x + 14, 324, val, 16, c, SANS, 800))
    write("module-web.svg", card_shell(
        404, "".join(v), "05", PINK, "modules/web-app/web-visionfit", "Bảng Quản Trị Web",
        "Nhìn toàn cảnh, quyết định nhanh.",
        ["Doanh thu theo ngày/tháng, hội viên mới, tỷ lệ gia hạn",
         "Bán gói tập, hóa đơn, giao dịch, lịch lớp",
         "Quản lý & đánh giá PT, phân công học viên",
         "Giám sát dữ liệu phân tích AI và lỗi kỹ thuật theo thời gian"],
        ["Vue 3", "Vite", "Bootstrap 5", "Chart.js"],
        "Module 05 — Bảng quản trị web Vue 3: doanh thu, gói tập, PT, báo cáo AI."))


# ── 7. training pipeline ────────────────────────────────────────────────────
def pipeline():
    W, H = 1200, 270
    steps = [("extract_frames.py", "Trích khung hình", "từ video quay thật", CYAN),
             ("pose_annotator.py", "Gán nhãn 33 khớp", "công cụ đồ họa", PINK),
             ("pose_model.py train", "Huấn luyện PoseNet", "heatmap regression", MINT),
             ("extract_clips.py", "Cắt clip động tác", "chuỗi 32 khung", CYAN),
             ("visionfit.py train", "Huấn luyện ActionNet", "temporal CNN", PINK)]
    b = [f'<rect width="{W}" height="{H}" rx="28" fill="{CARD}"/><rect x=".5" y=".5" width="{W - 1}" height="{H - 1}" rx="28" fill="none" stroke="{LINE}"/>',
         f'<line x1="120" y1="92" x2="1080" y2="92" stroke="{SUB}" stroke-opacity=".3" stroke-width="2" class="flow"/>']
    for i, (cmd, title, sub, c) in enumerate(steps):
        cx = 120 + i * 240
        b.append(f'<g class="up" style="animation-delay:{i * .15:.2f}s">'
                 f'<circle cx="{cx}" cy="92" r="34" fill="{INNER}" stroke="{c}" stroke-width="2"/>'
                 + t(cx, 103, f"{i + 1:02d}", 28, c, SANS, 800, "middle", ls=-1)
                 + t(cx, 160, title, 18, TXT, SANS, 800, "middle")
                 + t(cx, 186, sub, 15, SUB, SERIF, italic=True, anchor="middle")
                 + f'<rect x="{cx - 98}" y="208" width="196" height="30" rx="8" fill="{BG}" stroke="{LINE}"/>'
                 + t(cx, 228, cmd, 12, c, MONO, 600, "middle")
                 + "</g>")
    write("pipeline.svg", svg(W, H, "Pipeline huấn luyện: trích khung hình → gán nhãn 33 khớp → huấn luyện PoseNet → cắt clip động tác → huấn luyện ActionNet", "".join(b)))


# ── 8. stack ────────────────────────────────────────────────────────────────
def stack():
    groups = [("AI & VISION", MINT, ["Python 3.10", "PyTorch", "OpenCV", "NumPy", "Gemini API", "Embeddings"]),
              ("BACKEND", PINK, ["Laravel 12", "PHP 8.2", "Sanctum", "Reverb", "MySQL", "SQLite"]),
              ("MOBILE", CYAN, ["React Native 0.87", "React 19", "TypeScript", "Axios", "AsyncStorage"]),
              ("WEB ADMIN", PINK, ["Vue 3", "Vite", "Bootstrap 5", "Chart.js", "Vue Router"]),
              ("ASSISTANT", CYAN, ["Node.js 24", "ES Modules", "node:test", "HTTP-only cookie"])]
    H = 40 + len(groups) * 62
    b = [f'<rect width="1200" height="{H}" rx="28" fill="{CARD}"/><rect x=".5" y=".5" width="1199" height="{H - 1}" rx="28" fill="none" stroke="{LINE}"/>']
    for i, (g, c, items) in enumerate(groups):
        y = 30 + i * 62
        b.append(f'<g class="up" style="animation-delay:{i * .12:.2f}s">'
                 + f'<circle cx="44" cy="{y + 17}" r="5" fill="{c}"/>' + t(60, y + 22, g, 13, c, MONO, 700, ls=3)
                 + chips(250, y + 2, items, size=13.5, h=32)
                 + "</g>")
        if i < len(groups) - 1:
            b.append(f'<line x1="40" y1="{y + 49}" x2="1160" y2="{y + 49}" stroke="{LINE}" stroke-dasharray="2 6"/>')
    write("stack.svg", svg(1200, H, "Stack: Python, PyTorch, OpenCV, Gemini · Laravel 12, Sanctum, Reverb, MySQL · React Native, TypeScript · Vue 3, Vite, Chart.js · Node.js 24", "".join(b)))


# ── 9. footer ───────────────────────────────────────────────────────────────
def footer(light=False):
    txt, sub, acc, mut = (L_TXT, L_STROKE, L_ACC, L_STROKE) if light else (TXT, SUB, PINK, MUTED)
    body = (f'<line x1="0" y1="1" x2="1200" y2="1" stroke="{LINE if not light else "rgba(25,29,35,.16)"}"/>'
            + t(0, 44, f'VISIONFIT<tspan fill="{acc}" font-size="11" dy="-7">®</tspan>', 18, txt, SANS, 800)
            + t(600, 44, "Nâng tầm mỗi buổi tập bằng thị giác máy tính.", 17, sub, SERIF, italic=True, anchor="middle")
            + t(1200, 44, "MIT · © 2026 VISIONFIT TEAM", 13, mut, MONO, anchor="end", ls=1))
    return svg(1200, 70, "VisionFit — Nâng tầm mỗi buổi tập bằng thị giác máy tính. MIT License © 2026 VisionFit Team", body)


if __name__ == "__main__":
    print(f"Building into {OUT}")
    hero(); chapters(); about(); numbers(); architecture()
    card_ai(); card_vif(); card_backend(); card_mobile(); card_web()
    pipeline(); stack()
    write("footer.svg", footer()); write("footer-light.svg", footer(light=True))
