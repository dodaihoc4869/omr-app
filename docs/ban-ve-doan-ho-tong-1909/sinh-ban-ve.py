# Sinh 5 artboard game "Đoàn Hộ Tống" (.dc.html) + preview.html để tự chụp kiểm.
import os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'project')

FONT = "'Be Vietnam Pro', system-ui, sans-serif"
CSS = """
body{margin:0;font-family:'Be Vietnam Pro',system-ui,sans-serif}
a{color:#a8c7fa}a:hover{color:#d3e3fd}
@keyframes lt-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
@keyframes lt-float2{0%,100%{transform:translateY(-4px)}50%{transform:translateY(3px)}}
@keyframes lt-pulse{0%{transform:scale(.7);opacity:.75}100%{transform:scale(1.9);opacity:0}}
@keyframes lt-shine{0%{transform:translateX(-140%) skewX(-20deg)}60%,100%{transform:translateX(420%) skewX(-20deg)}}
@keyframes lt-rise{0%{transform:translateY(0) scale(.6);opacity:0}20%{opacity:.9}100%{transform:translateY(-70px) scale(1.1);opacity:0}}
@keyframes lt-twinkle{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes lt-pop{0%{transform:translateY(8px) scale(.7);opacity:0}25%{transform:translateY(0) scale(1.15);opacity:1}70%{transform:translateY(-14px) scale(1);opacity:1}100%{transform:translateY(-26px) scale(1);opacity:0}}
@keyframes lt-spin{to{transform:rotate(360deg)}}
@keyframes lt-glow{0%,100%{filter:drop-shadow(0 0 6px rgba(255,209,102,.55))}50%{filter:drop-shadow(0 0 16px rgba(255,209,102,.95))}}
@keyframes lt-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-2px) rotate(-1deg)}75%{transform:translateX(2px) rotate(1deg)}}
@keyframes lt-flash{0%,100%{opacity:0}6%{opacity:.75}16%{opacity:0}}
@keyframes lt-beam{0%,100%{filter:brightness(1) drop-shadow(0 0 10px var(--bc))}50%{filter:brightness(1.35) drop-shadow(0 0 22px var(--bc))}}
@keyframes lt-impact{0%,100%{transform:scale(.92) rotate(0deg)}50%{transform:scale(1.12) rotate(8deg)}}
@keyframes lt-hit{0%,100%{transform:translate(0,0) rotate(0)}20%{transform:translate(-4px,2px) rotate(-4deg)}40%{transform:translate(4px,-2px) rotate(4deg)}60%{transform:translate(-3px,1px) rotate(-3deg)}80%{transform:translate(3px,0) rotate(2deg)}}
@keyframes lt-cutin{0%{transform:translateX(-30px) skewX(-12deg);opacity:0}12%,100%{transform:translateX(0) skewX(-12deg);opacity:1}}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
"""

BG = "radial-gradient(120% 70% at 50% 0%, #22357a 0%, #101a44 42%, #070b1f 100%)"

def pet(name, size, style="", flip=False, anim="lt-float 3.2s ease-in-out infinite", glow="rgba(255,190,90,.55)"):
    fl = "transform: scaleX(-1);" if flip else ""
    return (f'<div style="position:absolute;width:{size}px;height:{size}px;{style}animation:{anim};">'
            f'<div style="position:absolute;left:12%;right:12%;bottom:-2px;height:{max(8,size//9)}px;border-radius:50%;background:rgba(0,0,0,.38);filter:blur(3px);"></div>'
            f'<img src="pets/{name}.png" alt="" style="position:relative;width:100%;height:100%;object-fit:contain;{fl}filter:drop-shadow(0 0 {max(6,size//8)}px {glow});">'
            f'</div>')

def stars(n, w, h, seed=7):
    out, x = [], seed
    for i in range(n):
        x = (x * 1103515245 + 12345) % 2147483648
        lx = x % w
        x = (x * 1103515245 + 12345) % 2147483648
        ly = x % h
        s = 1 + (x >> 7) % 2
        d = (x >> 9) % 30 / 10
        out.append(f'<div style="position:absolute;left:{lx}px;top:{ly}px;width:{s}px;height:{s}px;border-radius:50%;background:#fff;animation:lt-twinkle {2+d:.1f}s ease-in-out {d:.1f}s infinite;"></div>')
    return ''.join(out)

SLIME = """<svg viewBox="0 0 120 100" width="W" height="H" style="overflow:visible"><defs><radialGradient id="slG" cx="38%" cy="28%"><stop offset="0" stop-color="#e6ff7a"/><stop offset=".55" stop-color="#86bd2f"/><stop offset="1" stop-color="#355c12"/></radialGradient></defs><ellipse cx="60" cy="93" rx="46" ry="6" fill="rgba(0,0,0,.4)"/><path d="M14 84 C4 48 28 12 60 12 C94 12 116 48 106 84 C100 97 20 97 14 84Z" fill="url(#slG)"/><path d="M22 86 q4 12 9 0 M84 88 q5 14 10 0" fill="#86bd2f"/><path d="M30 38 C36 26 46 21 56 21" stroke="rgba(255,255,255,.6)" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M32 44 L54 52 M88 44 L66 52" stroke="#16210a" stroke-width="5" stroke-linecap="round"/><ellipse cx="45" cy="60" rx="8" ry="9" fill="#fff"/><ellipse cx="75" cy="60" rx="8" ry="9" fill="#fff"/><circle cx="47" cy="62" r="4.2" fill="#16210a"/><circle cx="73" cy="62" r="4.2" fill="#16210a"/><path d="M46 80 Q60 70 74 80" stroke="#16210a" stroke-width="4" stroke-linecap="round" fill="none"/></svg>"""
def slime(w): return SLIME.replace('W', str(w)).replace('H', str(int(w*100/120)))

BOSS = """<svg viewBox="0 0 220 210" width="W" height="H" style="overflow:visible"><defs><linearGradient id="bsG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9c8ff"/><stop offset=".45" stop-color="#7a4fe0"/><stop offset="1" stop-color="#23104f"/></linearGradient><linearGradient id="bsD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2aa8"/><stop offset="1" stop-color="#160a38"/></linearGradient></defs><ellipse cx="110" cy="198" rx="84" ry="10" fill="rgba(0,0,0,.45)"/><polygon points="44,100 8,58 20,150 52,158" fill="url(#bsD)"/><polygon points="176,100 212,58 200,150 168,158" fill="url(#bsD)"/><polygon points="8,58 26,96 20,150" fill="rgba(255,255,255,.12)"/><polygon points="60,84 160,84 186,160 110,196 34,160" fill="url(#bsG)"/><polygon points="60,84 110,118 34,160" fill="rgba(255,255,255,.16)"/><polygon points="160,84 110,118 186,160" fill="rgba(0,0,0,.22)"/><polygon points="110,118 186,160 110,196 34,160" fill="rgba(0,0,0,.12)"/><polygon points="110,12 142,58 132,98 88,98 78,58" fill="url(#bsG)"/><polygon points="110,12 110,98 88,98 78,58" fill="rgba(255,255,255,.18)"/><polygon points="78,58 62,22 92,44" fill="#b79cff"/><polygon points="142,58 158,22 128,44" fill="#8f6cf0"/><polygon points="90,64 106,70 90,77" fill="#fff36b" style="filter:drop-shadow(0 0 6px #fff36b)"/><polygon points="130,64 114,70 130,77" fill="#fff36b" style="filter:drop-shadow(0 0 6px #fff36b)"/><path d="M96 88 l6 -5 l6 5 l6 -5 l6 5" stroke="#160a38" stroke-width="3" fill="none"/><polygon points="110,128 124,148 110,170 96,148" fill="#7fe9ff" style="filter:drop-shadow(0 0 10px #7fe9ff)"/></svg>"""
def boss(w): return BOSS.replace('W', str(w)).replace('H', str(int(w*210/220)))

CHEST = """<svg viewBox="0 0 64 56" width="W" height="H" style="overflow:visible"><defs><linearGradient id="chG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset="1" stop-color="#d98a0c"/></linearGradient></defs><ellipse cx="32" cy="53" rx="26" ry="3.5" fill="rgba(0,0,0,.4)"/><path d="M5 25 C5 10 15 3 32 3 C49 3 59 10 59 25Z" fill="url(#chG)"/><rect x="5" y="25" width="54" height="25" rx="4" fill="#9a5608"/><rect x="5" y="25" width="54" height="6" fill="#ffd166"/><path d="M15 5 v45 M49 5 v45" stroke="#7a4300" stroke-width="3" opacity=".55"/><rect x="26" y="20" width="12" height="15" rx="3" fill="#fff6d0" stroke="#7a4300" stroke-width="2"/><circle cx="32" cy="27" r="2.2" fill="#7a4300"/><path d="M12 12 C18 7 24 6 30 6" stroke="rgba(255,255,255,.8)" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>"""
def chest(w): return CHEST.replace('W', str(w)).replace('H', str(int(w*56/64)))

def orb(size, style=""):
    r = size
    return (f'<div style="position:absolute;width:{r}px;height:{r}px;{style}">'
            f'<div style="position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px rgba(127,233,255,.7);animation:lt-pulse 2.4s ease-out infinite;"></div>'
            f'<div style="position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px rgba(127,233,255,.7);animation:lt-pulse 2.4s ease-out 1.2s infinite;"></div>'
            f'<div style="position:absolute;inset:-40%;border-radius:50%;background:radial-gradient(circle, rgba(127,233,255,.55) 0%, rgba(127,233,255,0) 65%);"></div>'
            f'<div style="position:absolute;inset:10%;border-radius:50%;background:radial-gradient(circle at 38% 32%, #ffffff 0%, #c8f6ff 28%, #5fd0ff 58%, #2a6bd6 100%);box-shadow:0 0 22px rgba(127,233,255,.95), inset 0 -6px 12px rgba(20,60,160,.5);animation:lt-float2 3s ease-in-out infinite;"></div>'
            f'</div>')

def hex_gem(grad, glow, cracked=False, label=""):
    clip = "clip-path:polygon(50% 0,100% 25%,100% 75%,50% 100%,0 75%,0 25%);"
    if cracked:
        inner = (f'<div style="width:46px;height:52px;{clip}background:linear-gradient(160deg,#3a4468,#1a2140);position:relative;">'
                 f'<svg viewBox="0 0 46 52" width="46" height="52" style="position:absolute;inset:0"><path d="M24 4 L19 18 L27 25 L20 36 L25 48" stroke="#ff9a76" stroke-width="2" fill="none" stroke-linejoin="round"/><path d="M19 18 L10 22 M27 25 L37 29" stroke="#ff9a76" stroke-width="1.5" fill="none"/></svg></div>')
        return f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px;"><div style="filter:drop-shadow(0 0 6px rgba(255,154,118,.55));animation:lt-shake 2.6s ease-in-out infinite;">{inner}</div><div style="font-size:10px;font-weight:700;color:#ffb59a;">{label}</div></div>'
    inner = (f'<div style="width:46px;height:52px;{clip}background:{grad};position:relative;">'
             f'<div style="position:absolute;left:8px;top:6px;width:14px;height:20px;{clip}background:rgba(255,255,255,.55);"></div></div>')
    return f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px;"><div style="filter:drop-shadow(0 0 9px {glow});">{inner}</div><div style="font-size:10px;font-weight:700;color:#c9d6f2;">{label}</div></div>'

def shine():
    return '<div style="position:absolute;top:0;bottom:0;left:0;width:34%;background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.55),rgba(255,255,255,0));animation:lt-shine 2.8s ease-in-out infinite;"></div>'

def cta(text, href, icon=True, h=58):
    ic = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"></path></svg>' if icon else ''
    return (f'<a href="{href}" style="position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:8px;height:{h}px;border-radius:{h//2}px;'
            f'background:linear-gradient(180deg,#ffe9a0 0%,#ffc53d 48%,#f09a0c 100%);color:#4a2a00;font-size:18px;font-weight:800;letter-spacing:.04em;text-decoration:none;'
            f'box-shadow:0 8px 22px rgba(255,180,40,.5), inset 0 2px 0 rgba(255,255,255,.7), inset 0 -3px 0 rgba(160,90,0,.35);">{shine()}<span style="position:relative;display:flex;align-items:center;gap:8px;">{ic}{text}</span></a>')

def glass(inner, extra=""):
    return f'<div style="position:relative;border-radius:24px;background:linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.05));box-shadow:inset 0 0 0 1px rgba(255,255,255,.12), 0 10px 24px rgba(0,0,0,.28);{extra}">{inner}</div>'

def label(t, color="#9fb2d9"):
    return f'<div style="font-size:11px;font-weight:700;letter-spacing:.1em;color:{color};">{t}</div>'

def gold_text(t, size):
    return f'<span style="font-size:{size}px;font-weight:800;background:linear-gradient(180deg,#fff3c0,#ffc53d 60%,#e08a00);-webkit-background-clip:text;background-clip:text;color:transparent;">{t}</span>'

# ───────────────────────── 1. SẢNH ─────────────────────────
def sanh():
    H = 1424
    chips = ('<div style="display:flex;gap:8px;">'
             '<div style="display:flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-radius:17px;background:linear-gradient(180deg,rgba(255,209,102,.28),rgba(255,209,102,.12));box-shadow:inset 0 0 0 1px rgba(255,209,102,.5);font-size:14px;font-weight:800;color:#ffe08a;">'
             '<svg viewBox="0 0 24 24" width="16" height="16" fill="#ffd166"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path></svg>2</div>'
             '<div style="display:flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-radius:17px;background:linear-gradient(180deg,rgba(255,138,92,.3),rgba(255,138,92,.12));box-shadow:inset 0 0 0 1px rgba(255,138,92,.55);font-size:14px;font-weight:800;color:#ffc2a6;">'
             '<svg viewBox="0 0 24 24" width="16" height="16" fill="#ff8a5c"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>5</div></div>')
    head = ('<div style="display:flex;flex-direction:column;gap:6px;">'
            f'<div style="display:flex;align-items:center;justify-content:space-between;">{label("MÙA 1 · HÀNH TRÌNH PHA LÊ")}{chips}</div>'
            '<div style="font-size:26px;font-weight:800;line-height:1.15;">Đoàn Hộ Tống 12A1</div></div>')

    # bản đồ
    path_all = "M18 300 C110 292 70 236 150 226 S 292 214 236 160 S 150 116 236 86 S 330 70 346 40"
    path_done = "M18 300 C110 292 70 236 150 226 S 292 214 236 160"
    nodes_done = [(56, 292), (112, 250), (176, 222), (250, 196)]
    node_html = ''.join(f'<div style="position:absolute;left:{x-8}px;top:{y-8}px;width:16px;height:16px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d6ffe2,#3fd07a);box-shadow:0 0 10px rgba(109,213,140,.9);"></div>' for x, y in nodes_done)
    future = ''.join(f'<div style="position:absolute;left:{x-7}px;top:{y-7}px;width:14px;height:14px;border-radius:50%;background:rgba(10,16,40,.6);box-shadow:inset 0 0 0 2px rgba(255,255,255,.45);"></div>' for x, y in [(236, 88), (300, 66)])
    castle = ('<div style="position:absolute;right:10px;top:6px;width:84px;height:84px;animation:lt-glow 3s ease-in-out infinite;">'
              '<svg viewBox="0 0 84 84" width="84" height="84"><defs><linearGradient id="cry" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#8fe6ff"/><stop offset="1" stop-color="#3b7be0"/></linearGradient></defs>'
              '<polygon points="42,4 54,30 50,72 34,72 30,30" fill="url(#cry)"/><polygon points="20,24 30,40 30,72 14,72 12,42" fill="url(#cry)" opacity=".9"/><polygon points="64,20 72,40 70,72 54,72 54,40" fill="url(#cry)" opacity=".9"/><polygon points="42,4 42,72 34,72 30,30" fill="rgba(255,255,255,.35)"/><rect x="8" y="70" width="68" height="8" rx="4" fill="#2a3f86"/></svg></div>'
              '<div style="position:absolute;right:8px;top:88px;padding:3px 9px;border-radius:999px;background:rgba(8,14,40,.7);box-shadow:inset 0 0 0 1px rgba(143,230,255,.5);font-size:11px;font-weight:700;color:#c8f6ff;">Thành Pha Lê</div>')
    mountains = ('<svg viewBox="0 0 358 340" width="358" height="340" preserveAspectRatio="none" style="position:absolute;inset:0;">'
                 '<path d="M0 210 L50 150 L96 196 L150 120 L210 190 L262 140 L320 200 L358 170 L358 340 L0 340Z" fill="rgba(60,50,140,.55)"/>'
                 '<path d="M0 262 L60 214 L120 258 L190 204 L250 250 L310 216 L358 250 L358 340 L0 340Z" fill="rgba(24,60,90,.75)"/>'
                 '<path d="M0 306 C80 286 140 320 210 300 S 320 292 358 306 L358 340 L0 340Z" fill="rgba(14,58,52,.95)"/>'
                 f'<path d="{path_all}" stroke="rgba(255,255,255,.35)" stroke-width="5" stroke-dasharray="2 11" stroke-linecap="round" fill="none"/>'
                 f'<path d="{path_done}" stroke="#7dffb0" stroke-width="5" stroke-linecap="round" fill="none" style="filter:drop-shadow(0 0 6px #6dd58c)"/></svg>')
    chest_node = f'<div style="position:absolute;left:140px;top:92px;animation:lt-glow 2.4s ease-in-out infinite;">{chest(44)}</div>'
    mapc = ('<div style="position:relative;height:340px;border-radius:28px;overflow:hidden;background:linear-gradient(180deg,#2a1f6e 0%,#3b2f8f 30%,#285a8f 66%,#1b6a5c 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14), 0 14px 30px rgba(0,0,0,.4);">'
            '<div style="position:absolute;left:36px;top:26px;width:70px;height:70px;border-radius:50%;background:radial-gradient(circle,#fff6d6 0%,#ffe08a 38%,rgba(255,224,138,0) 70%);"></div>'
            + stars(26, 358, 150) + mountains + node_html + future + chest_node + castle
            + orb(46, "left:213px;top:137px;")
            + pet('thuy-long', 58, "left:120px;top:176px;", anim="lt-float2 3.4s ease-in-out infinite", glow="rgba(110,200,255,.7)")
            + pet('phong-tho', 50, "left:66px;top:212px;", anim="lt-float 3.8s ease-in-out infinite", glow="rgba(150,255,210,.7)")
            + pet('viem-su', 132, "left:4px;bottom:34px;")
            + '<div style="position:absolute;left:14px;top:14px;display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;background:rgba(8,14,40,.65);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);font-size:12px;font-weight:700;"><span style="width:8px;height:8px;border-radius:50%;background:#7dffb0;box-shadow:0 0 8px #7dffb0;"></span>Trạm 17/30 · còn 3 trạm tới mốc quà</div>'
            + '<div style="position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:linear-gradient(180deg,rgba(6,10,30,0),rgba(6,10,30,.85));">'
            '<div style="font-size:12px;color:#dfe8ff;padding-left:128px;white-space:nowrap;"><b style="color:#fff;font-size:14px;">9/32 bạn</b> góp sức</div>'
            '<div style="display:flex;">'
            + ''.join(f'<div style="width:30px;height:30px;border-radius:50%;background:radial-gradient(circle,{c} 0%,rgba(10,16,40,.9) 75%);box-shadow:0 0 0 2px #0b1230;margin-left:{m}px;overflow:hidden;"><img src="pets/{n}.png" alt="" style="width:100%;height:100%;object-fit:contain;"></div>' for n, c, m in [('thach-quy', 'rgba(160,220,120,.7)', 0), ('tinh-lang', 'rgba(140,170,255,.7)', -8), ('ai-ho', 'rgba(255,160,210,.7)', -8)])
            + '<div style="width:30px;height:30px;border-radius:50%;background:#1d2a5c;box-shadow:0 0 0 2px #0b1230;margin-left:-8px;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;">+6</div></div></div></div>')

    # thẻ chặng hôm nay
    reward = lambda t, c: f'<div style="padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.14);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22);font-size:12px;font-weight:700;color:{c};">{t}</div>'
    today = ('<div style="position:relative;overflow:hidden;display:flex;flex-direction:column;gap:12px;padding:18px;border-radius:28px;background:linear-gradient(135deg,#3f6bff 0%,#6a3ff0 55%,#a23bd6 100%);box-shadow:0 14px 34px rgba(90,70,240,.5), inset 0 0 0 1px rgba(255,255,255,.25);">'
             '<div style="position:absolute;right:-30px;top:-30px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(230,255,122,.35) 0%,rgba(230,255,122,0) 68%);"></div>'
             f'<div style="position:absolute;right:10px;top:34px;animation:lt-float 2.6s ease-in-out infinite;">{slime(92)}</div>'
             '<div style="display:flex;align-items:center;gap:8px;"><div style="padding:4px 10px;border-radius:999px;background:#fff;color:#4a2fd0;font-size:11px;font-weight:800;letter-spacing:.06em;">CHẶNG HÔM NAY · MIỄN PHÍ</div></div>'
             '<div style="font-size:22px;font-weight:800;line-height:1.15;white-space:nowrap;">Vượt Đầm Bùn Acid</div>'
             '<div style="font-size:13px;line-height:1.5;color:rgba(255,255,255,.92);max-width:236px;">Câu của riêng em hôm nay: <b>3 câu tới hạn ôn</b> · <b>3 câu Ester</b> em đang yếu. 8 hiệp · 5–6 phút.</div>'
             f'<div style="display:flex;flex-wrap:wrap;gap:6px;">{reward("EXP thần thú", "#d6ffe2")}{reward("Mảnh khiên", "#ffe9a0")}{reward("Giữ chuỗi 5 ngày", "#ffd0bd")}</div>'
             + cta('LÊN ĐƯỜNG', 'GameTran.dc.html')
             + '<div style="font-size:12px;color:rgba(255,255,255,.85);text-align:center;">Chặng thêm tốn 1 vé · vé chỉ kiếm được bằng làm bài tập</div></div>')

    # bạn đồng hành
    comp = glass(
        f'<div style="display:flex;flex-direction:column;gap:10px;padding:16px;">{label("BẠN ĐỒNG HÀNH HỢP NHẤT HÔM NAY")}'
        '<div style="position:relative;height:104px;">'
        + pet('viem-su', 92, "left:6px;top:4px;")
        + pet('thuy-long', 88, "right:6px;top:8px;", flip=True, anim="lt-float2 3.3s ease-in-out infinite", glow="rgba(110,200,255,.7)")
        + '<div style="position:absolute;left:104px;right:104px;top:14px;display:flex;flex-direction:column;align-items:center;gap:6px;">'
        '<div style="padding:4px 9px;border-radius:999px;background:rgba(127,233,255,.16);box-shadow:inset 0 0 0 1px rgba(127,233,255,.5);font-size:11px;font-weight:700;color:#c8f6ff;white-space:nowrap;">Hà vững Ester →</div>'
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffd166" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>'
        '<div style="padding:4px 9px;border-radius:999px;background:rgba(255,190,90,.16);box-shadow:inset 0 0 0 1px rgba(255,190,90,.5);font-size:11px;font-weight:700;color:#ffe3b0;white-space:nowrap;">← Em vững Ancol</div></div></div>'
        '<div style="display:flex;align-items:center;justify-content:space-between;"><div style="font-size:13px;font-weight:700;">Minh (em)</div><div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;"><span style="width:8px;height:8px;border-radius:50%;background:#7dffb0;box-shadow:0 0 8px #7dffb0;"></span>Thu Hà · đang online</div></div>'
        '<a href="GameTran.dc.html" style="display:flex;align-items:center;justify-content:center;height:48px;border-radius:24px;background:linear-gradient(180deg,rgba(127,233,255,.3),rgba(127,233,255,.14));box-shadow:inset 0 0 0 1px rgba(127,233,255,.55);color:#e2fbff;font-size:15px;font-weight:800;text-decoration:none;">Mời Hà đi cùng · hai bạn bù nhau</a></div>')

    pips = ''.join(f'<div style="height:8px;border-radius:999px;background:{"linear-gradient(90deg,#ffb27a,#ff7a45)" if i < 5 else "rgba(255,255,255,.16)"};{"box-shadow:0 0 8px rgba(255,138,92,.8);" if i < 5 else ""}"></div>' for i in range(7))
    tiles = ('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;">'
             + glass(f'<div style="display:flex;flex-direction:column;gap:8px;padding:14px;">{label("RƯƠNG CHUỖI NGÀY", "#ffd9a0")}<div style="display:flex;align-items:center;gap:10px;"><div style="animation:lt-glow 2.4s ease-in-out infinite;">{chest(50)}</div><div style="font-size:13px;line-height:1.35;color:#e8eefc;">Còn <b style="color:#ffd166;">2 ngày</b><br>mở rương 7 ngày</div></div><div style="display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;">{pips}</div></div>')
             + glass(f'<div style="position:relative;overflow:hidden;border-radius:24px;display:flex;flex-direction:column;gap:6px;padding:14px;min-height:118px;box-sizing:border-box;"><div style="position:absolute;right:-14px;bottom:-16px;opacity:.95;">{boss(96)}</div>{label("TRÙM LỚP", "#d9c8ff")}<div style="font-size:17px;font-weight:800;">Chủ nhật 20:00</div><div style="font-size:12px;color:#c9d6f2;max-width:92px;line-height:1.4;">Cả lớp cùng đánh · còn 1 ngày 4 giờ</div></div>', "background:linear-gradient(160deg,rgba(122,79,224,.35),rgba(255,255,255,.05));")
             + '</div>')

    gems = ''.join([
        hex_gem("linear-gradient(160deg,#d6ffe2,#3fd07a 55%,#14733c)", "rgba(109,213,140,.9)", label="Ancol"),
        hex_gem("linear-gradient(160deg,#dcebff,#5a9bff 55%,#1b47b0)", "rgba(110,160,255,.9)", label="Amin"),
        hex_gem("linear-gradient(160deg,#fff3c0,#ffc53d 55%,#b86e00)", "rgba(255,209,102,.9)", label="Polime"),
        hex_gem("linear-gradient(160deg,#f0e2ff,#a97bff 55%,#5a2bc0)", "rgba(190,150,255,.9)", label="Điện li"),
        hex_gem("", "", cracked=True, label="Ester"),
        hex_gem("", "", cracked=True, label="Peptit"),
    ])
    an = glass(f'<div style="display:flex;flex-direction:column;gap:12px;padding:16px;"><div style="display:flex;justify-content:space-between;align-items:baseline;">{label("ẤN THẠCH DẠNG CỦA EM")}<div style="font-size:12px;color:#9fb2d9;">sáng 4 · nứt 2</div></div><div style="display:flex;justify-content:space-between;">{gems}</div><div style="font-size:13px;line-height:1.5;color:#dfe8ff;">Ấn <b style="color:#ffb59a;">Ester</b> đang nứt: khắc phục thêm <b style="color:#fff;">3 câu</b> là sáng → mở kỹ năng {gold_text("Liệt Diễm Xuyên Giáp", 13)}</div></div>')

    body = (f'<div style="width:390px;height:{H}px;position:relative;overflow:hidden;box-sizing:border-box;background:{BG};color:#f2f5ff;font-family:{FONT};">'
            + stars(36, 390, 1424, 11)
            + f'<div style="position:relative;display:flex;flex-direction:column;gap:14px;padding:50px 16px 28px;box-sizing:border-box;">{head}{mapc}{today}{comp}{tiles}{an}</div></div>')
    return body, H

# ───────────────────────── HUD + cảnh trận dùng chung ─────────────────────────
def hud(cur, secs, frac):
    pips = []
    for i in range(1, 9):
        is_boss = i in (4, 8)
        if is_boss:
            col = "#7dffb0" if i < cur else ("#fff" if i == cur else "rgba(255,209,102,.55)")
            pips.append(f'<div style="width:13px;height:13px;transform:rotate(45deg);border-radius:3px;background:{col};{"box-shadow:0 0 10px #ffd166;" if i >= cur else ""}"></div>')
        else:
            col = "#7dffb0" if i < cur else ("#ffffff" if i == cur else "rgba(255,255,255,.2)")
            pips.append(f'<div style="flex-grow:1;height:8px;border-radius:999px;background:{col};{"box-shadow:0 0 10px rgba(255,255,255,.9);" if i == cur else ""}"></div>')
    c = 2 * 3.14159 * 17
    ring = (f'<div style="position:relative;width:46px;height:46px;flex-shrink:0;"><svg viewBox="0 0 46 46" width="46" height="46" style="transform:rotate(-90deg)"><circle cx="23" cy="23" r="17" stroke="rgba(255,255,255,.16)" stroke-width="5" fill="none"></circle><circle cx="23" cy="23" r="17" stroke="#ffd166" stroke-width="5" fill="none" stroke-linecap="round" stroke-dasharray="{c*frac:.1f} {c:.1f}" style="filter:drop-shadow(0 0 5px #ffd166)"></circle></svg><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;">{secs}</div></div>')
    return (f'<div style="display:flex;align-items:center;gap:10px;"><div style="display:flex;flex-direction:column;gap:6px;flex-grow:1;"><div style="display:flex;justify-content:space-between;align-items:baseline;"><div style="font-size:13px;font-weight:800;letter-spacing:.06em;">HIỆP {cur}/8</div><div style="font-size:11px;color:#9fb2d9;">◆ = hiệp trùm</div></div><div style="display:flex;align-items:center;gap:5px;">{"".join(pips)}</div></div>{ring}</div>')

def bubbles():
    return ''.join(f'<div style="position:absolute;left:{x}px;bottom:{b}px;width:{s}px;height:{s}px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f4ffb0,#8fd42e);opacity:0;animation:lt-rise {d}s ease-in infinite {dl}s;"></div>' for x, b, s, d, dl in [(208, 14, 8, 3.2, 0), (250, 8, 6, 2.6, .8), (300, 18, 10, 3.6, 1.4), (336, 10, 7, 2.9, .4), (176, 6, 6, 3.1, 2)])

def swamp_open(h):
    return (f'<div style="position:relative;height:{h}px;border-radius:28px;overflow:hidden;background:linear-gradient(180deg,#131c52 0%,#173a5e 46%,#1d5a3a 78%,#123a22 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14), 0 14px 30px rgba(0,0,0,.4);">'
            '<div style="position:absolute;right:34px;top:-26px;width:130px;height:130px;border-radius:50%;background:radial-gradient(circle,#f4ffd0 0%,#c6f27a 30%,rgba(198,242,122,0) 70%);opacity:.8;"></div>'
            + stars(16, 358, 90, 5)
            + f'<svg viewBox="0 0 358 {h}" width="358" height="{h}" preserveAspectRatio="none" style="position:absolute;inset:0;"><path d="M0 {h*0.5:.0f} C60 {h*0.36:.0f} 110 {h*0.52:.0f} 170 {h*0.42:.0f} S 290 {h*0.34:.0f} 358 {h*0.48:.0f} L358 {h} L0 {h}Z" fill="rgba(10,30,50,.55)"/><ellipse cx="270" cy="{h-16}" rx="120" ry="16" fill="rgba(170,230,60,.35)"/><ellipse cx="90" cy="{h-10}" rx="110" ry="12" fill="rgba(0,0,0,.25)"/></svg>'
            + bubbles())

def hpbar(w, frac, col, style):
    return f'<div style="position:absolute;{style}width:{w}px;height:7px;border-radius:999px;background:rgba(0,0,0,.5);box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);overflow:hidden;"><div style="width:{frac}%;height:100%;border-radius:999px;background:{col};"></div></div>'

def tag(t, style, bg="rgba(8,14,40,.72)", col="#fff", ring="rgba(255,255,255,.25)"):
    return f'<div style="position:absolute;{style}padding:3px 8px;border-radius:999px;background:{bg};box-shadow:inset 0 0 0 1px {ring};font-size:11px;font-weight:700;color:{col};white-space:nowrap;">{t}</div>'

# ───────────────────────── 2. TRONG TRẬN ─────────────────────────
def tran():
    H = 844
    scene = (swamp_open(262)
             + pet('phong-tho', 64, "left:8px;top:64px;", anim="lt-float 3.6s ease-in-out infinite", glow="rgba(150,255,210,.7)")
             + pet('thuy-long', 74, "left:50px;top:132px;", anim="lt-float2 3.2s ease-in-out infinite", glow="rgba(110,200,255,.7)")
             + pet('viem-su', 104, "left:92px;top:60px;")
             + orb(44, "left:22px;top:196px;")
             + hpbar(64, 80, "linear-gradient(90deg,#7dffb0,#7fe9ff)", "left:12px;top:248px;")
             + f'<div style="position:absolute;right:66px;top:118px;animation:lt-float 2.4s ease-in-out infinite;">{slime(84)}</div>'
             + f'<div style="position:absolute;right:6px;top:150px;animation:lt-float2 2.8s ease-in-out infinite;">{slime(70)}</div>'
             + hpbar(70, 35, "linear-gradient(90deg,#ff7a45,#ffd166)", "right:74px;top:106px;")
             + hpbar(58, 100, "linear-gradient(90deg,#ff7a45,#ffd166)", "right:12px;top:140px;")
             + '<svg viewBox="0 0 120 60" width="120" height="60" style="position:absolute;left:176px;top:96px;"><defs><linearGradient id="fl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="rgba(255,120,40,0)"/><stop offset=".6" stop-color="#ffb84d"/><stop offset="1" stop-color="#fff3c0"/></linearGradient></defs><path d="M0 34 C30 10 70 18 116 30 C74 30 40 40 0 34Z" fill="url(#fl)" style="filter:drop-shadow(0 0 8px #ff9a3d)"/></svg>'
             + f'<div style="position:absolute;right:92px;top:74px;animation:lt-pop 1.8s ease-out infinite;">{gold_text("−24", 26)}</div>'
             + '<div style="position:absolute;left:50%;top:12px;transform:translateX(-50%);padding:5px 14px;border-radius:999px;background:linear-gradient(90deg,#ff7a45,#ffc53d);box-shadow:0 0 18px rgba(255,160,60,.8);font-size:12px;font-weight:800;letter-spacing:.08em;color:#3a1600;white-space:nowrap;">LIÊN KÍCH ×2 SẴN SÀNG</div>'
             + tag('Bùn Acid ×2', 'right:12px;bottom:10px;', col="#e6ff7a", ring="rgba(230,255,122,.5)")
             + tag('Linh Tâm 80', 'left:82px;bottom:10px;', col="#c8f6ff", ring="rgba(127,233,255,.5)")
             + '</div>')

    def mate(name, pimg, st, col, ring=False):
        r = f"box-shadow:inset 0 0 0 2px {col};" if ring else "box-shadow:inset 0 0 0 1px rgba(255,255,255,.12);"
        return (f'<div style="display:flex;align-items:center;gap:8px;padding:6px 10px 6px 6px;border-radius:999px;background:rgba(255,255,255,.08);{r}">'
                f'<div style="width:30px;height:30px;border-radius:50%;background:rgba(10,16,40,.8);overflow:hidden;flex-shrink:0;"><img src="pets/{pimg}.png" alt="" style="width:100%;height:100%;object-fit:contain;"></div>'
                f'<div style="display:flex;flex-direction:column;line-height:1.2;"><span style="font-size:12px;font-weight:800;">{name}</span><span style="font-size:11px;font-weight:700;color:{col};">{st}</span></div></div>')
    mates = f'<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;">{mate("Em","viem-su","đang làm","#ffd166",True)}{mate("Thu Hà","thuy-long","đã chốt","#7dffb0")}{mate("Nam","phong-tho","đang làm","#9fb2d9")}</div>'

    def opt(k, t, sel=False):
        if sel:
            return f'<div style="display:flex;align-items:center;gap:10px;min-height:46px;padding:0 12px;border-radius:14px;background:#d3e3fd;box-shadow:inset 0 0 0 2px #0b57d0;"><span style="width:26px;height:26px;border-radius:50%;background:#0b57d0;color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{k}</span><span style="font-size:14px;font-weight:600;color:#041e49;">{t}</span></div>'
        return f'<div style="display:flex;align-items:center;gap:10px;min-height:46px;padding:0 12px;border-radius:14px;background:#fff;box-shadow:inset 0 0 0 1px #d9d2c0;"><span style="width:26px;height:26px;border-radius:50%;box-shadow:inset 0 0 0 1.5px #8a8f98;color:#3c4046;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{k}</span><span style="font-size:14px;color:#22262b;">{t}</span></div>'
    q = ('<div style="display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:24px;background:#f7f2e7;color:#22262b;box-shadow:0 12px 26px rgba(0,0,0,.35);">'
         '<div style="display:flex;align-items:center;gap:8px;"><div style="padding:3px 10px;border-radius:999px;background:#0b57d0;color:#fff;font-size:11px;font-weight:800;white-space:nowrap;flex-shrink:0;">CÂU CỦA EM</div><div style="font-size:12px;color:#5b6168;white-space:nowrap;">Ester · tới hạn ôn</div><div style="margin-left:auto;font-size:12px;font-weight:700;color:#b3471e;white-space:nowrap;">+1 ấn Ester</div></div>'
         '<div style="font-size:15px;line-height:1.5;">Thuỷ phân ethyl acetate trong dung dịch NaOH dư, đun nóng, thu được sản phẩm hữu cơ gồm</div>'
         '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;">'
         + opt('A', 'CH₃COOH, C₂H₅OH') + opt('B', 'CH₃COONa, C₂H₅OH', True) + opt('C', 'CH₃COONa, CH₃OH') + opt('D', 'HCOONa, C₂H₅OH') + '</div></div>')

    def act(t, sub, icon, on=False):
        if on:
            st = "background:linear-gradient(180deg,#ffe9a0,#ffc53d 50%,#f09a0c);color:#4a2a00;box-shadow:0 6px 18px rgba(255,180,40,.5), inset 0 2px 0 rgba(255,255,255,.7);"
        else:
            st = "background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.06));color:#f2f5ff;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);"
        return f'<button type="button" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;height:66px;border:0;border-radius:20px;font-family:inherit;{st}">{icon}<span style="font-size:13px;font-weight:800;">{t}</span><span style="font-size:10px;font-weight:600;opacity:.8;">{sub}</span></button>'
    i_sword = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"></path><path d="m13 19 6-6"></path><path d="m16 16 4 4"></path><path d="m19 21 2-2"></path></svg>'
    i_shield = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path></svg>'
    i_fire = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>'
    acts = f'<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;">{act("Đánh","đúng → 24 sát thương",i_sword,True)}{act("Chắn","đỡ cho Linh Tâm",i_shield)}{act("Liệt Diễm","kỹ năng · 2 NL",i_fire)}</div>'
    lock = ('<a href="GameTiepSuc.dc.html" style="position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;height:52px;border-radius:26px;background:linear-gradient(180deg,#5b8cff,#2f5bd0);color:#fff;font-size:16px;font-weight:800;text-decoration:none;box-shadow:0 8px 20px rgba(47,91,208,.55), inset 0 2px 0 rgba(255,255,255,.35);">'
            + shine() + '<span style="position:relative;">Chốt đòn · B + Đánh</span></a>')
    body = (f'<div style="width:390px;height:{H}px;position:relative;overflow:hidden;box-sizing:border-box;background:{BG};color:#f2f5ff;font-family:{FONT};">'
            f'<div style="position:relative;display:flex;flex-direction:column;gap:10px;padding:48px 16px 18px;box-sizing:border-box;height:100%;">{hud(3, 27, .68)}{scene}{mates}{q}{acts}{lock}</div></div>')
    return body, H

# ───────────────────────── 3. TIẾP SỨC ─────────────────────────
def tiepsuc():
    H = 844
    scene = (swamp_open(262)
             + pet('phong-tho', 64, "left:8px;top:64px;", anim="lt-float 3.6s ease-in-out infinite", glow="rgba(150,255,210,.7)")
             + pet('viem-su', 96, "left:44px;top:120px;")
             + pet('thuy-long', 92, "left:178px;top:56px;", flip=True, anim="lt-float2 3.2s ease-in-out infinite", glow="rgba(110,200,255,.85)")
             + '<svg viewBox="0 0 140 90" width="140" height="90" style="position:absolute;left:108px;top:92px;"><defs><linearGradient id="bm" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffb84d"/><stop offset="1" stop-color="#7fe9ff"/></linearGradient></defs><path d="M6 80 C40 70 70 50 132 12" stroke="url(#bm)" stroke-width="6" stroke-linecap="round" stroke-dasharray="3 12" fill="none" style="filter:drop-shadow(0 0 8px #7fe9ff)"/></svg>'
             + '<div style="position:absolute;left:252px;top:34px;padding:6px 12px;border-radius:16px 16px 16px 4px;background:#fff;color:#1a2a66;font-size:12px;font-weight:800;box-shadow:0 6px 14px rgba(0,0,0,.35);animation:lt-float 2s ease-in-out infinite;">Cần tiếp sức!</div>'
             + f'<div style="position:absolute;right:4px;top:160px;opacity:.85;">{slime(66)}</div>'
             + tag('Em đã chốt · còn 0:18', 'left:12px;top:12px;', col="#7dffb0", ring="rgba(125,255,176,.5)")
             + '</div>')

    def card(title, desc, grad, icon, rec=False):
        badge = '<div style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);padding:2px 8px;border-radius:999px;background:#ffd166;color:#4a2a00;font-size:10px;font-weight:800;white-space:nowrap;">HỢP NHẤT</div>' if rec else ''
        return (f'<button type="button" style="position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px 12px;border:0;border-radius:20px;background:{grad};color:#fff;font-family:inherit;box-shadow:0 10px 22px rgba(0,0,0,.4), inset 0 0 0 1.5px rgba(255,255,255,.45), inset 0 2px 0 rgba(255,255,255,.4);min-height:148px;">{badge}'
                f'<div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.22);box-shadow:inset 0 0 0 1px rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;">{icon}</div>'
                f'<div style="font-size:13px;font-weight:800;line-height:1.2;">{title}</div><div style="font-size:11px;line-height:1.35;opacity:.92;">{desc}</div></button>')
    i_book = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>'
    i_x = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>'
    i_step = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4v-5h4v-5h4V5h4"></path></svg>'
    sheet = ('<div style="position:absolute;left:0;bottom:0;width:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;padding:10px 16px 24px;border-radius:32px 32px 0 0;background:linear-gradient(180deg,#223273 0%,#131c4a 100%);box-shadow:0 -10px 30px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.25);">'
             '<div style="width:36px;height:4px;border-radius:999px;background:rgba(255,255,255,.35);align-self:center;"></div>'
             '<div style="display:flex;align-items:center;gap:10px;"><div style="width:44px;height:44px;border-radius:50%;background:radial-gradient(circle,rgba(110,200,255,.6),rgba(10,16,40,.9) 75%);overflow:hidden;flex-shrink:0;"><img src="pets/thuy-long.png" alt="" style="width:100%;height:100%;object-fit:contain;"></div>'
             f'<div style="display:flex;flex-direction:column;gap:2px;"><div style="font-size:18px;font-weight:800;">Tiếp sức cho Thu Hà</div><div style="font-size:12px;color:#c9d6f2;">Hà làm lại đúng → cả hai nhận {gold_text("LIÊN KÍCH ×2", 12)}</div></div></div>'
             '<div style="padding:12px 14px;border-radius:16px;background:#f7f2e7;color:#22262b;font-size:13px;line-height:1.5;"><span style="font-size:11px;font-weight:800;color:#0b57d0;">CÂU CỦA HÀ · ANCOL</span><br>Oxi hoá ethanol bằng CuO, đun nóng, thu được chất hữu cơ X. X là… <span style="color:#5b6168;">(em không thấy Hà đã chọn gì)</span></div>'
             '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding-top:6px;">'
             + card('Nhắc công thức', 'Gửi Hà kiến thức gốc của câu', 'linear-gradient(160deg,#4f8bff,#2a3fb8)', i_book, True)
             + card('Loại 1 phương án', 'Máy gạch một đáp án sai', 'linear-gradient(160deg,#b06bff,#5a2bc0)', i_x)
             + card('Chỉ bước đầu', 'Hé bước đầu của lời giải', 'linear-gradient(160deg,#2fc98a,#0f7a5a)', i_step)
             + '</div>'
             '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;"><div style="font-size:12px;line-height:1.45;color:#9fb2d9;">Thẻ do máy soạn từ lời giải — không bao giờ là đáp án. Em nhận <b style="color:#a8c7fa;">+3 EXP tiếp sức</b>.</div><a href="GameTrum.dc.html" style="flex-shrink:0;display:flex;align-items:center;height:40px;padding:0 16px;border-radius:20px;background:rgba(255,255,255,.12);color:#fff;font-size:13px;font-weight:700;text-decoration:none;">Để sau</a></div></div>')
    body = (f'<div style="width:390px;height:{H}px;position:relative;overflow:hidden;box-sizing:border-box;background:{BG};color:#f2f5ff;font-family:{FONT};">'
            f'<div style="position:relative;display:flex;flex-direction:column;gap:10px;padding:48px 16px 18px;box-sizing:border-box;">{hud(3, 18, .45)}{scene}</div>{sheet}</div>')
    return body, H

# ───────────────────────── 6. TUNG CHƯỞNG · LIÊN KÍCH ─────────────────────────
def chuong():
    H = 844
    rays = ('<div style="position:absolute;left:195px;top:238px;width:1100px;height:1100px;margin-left:-550px;margin-top:-550px;border-radius:50%;'
            'background:repeating-conic-gradient(from 0deg, rgba(255,170,60,.34) 0deg 3deg, rgba(255,170,60,0) 3deg 9deg, rgba(127,233,255,.22) 9deg 11deg, rgba(127,233,255,0) 11deg 18deg);'
            '-webkit-mask-image:radial-gradient(circle,rgba(0,0,0,0) 8%,#000 22%,rgba(0,0,0,0) 62%);mask-image:radial-gradient(circle,rgba(0,0,0,0) 8%,#000 22%,rgba(0,0,0,0) 62%);animation:lt-spin 50s linear infinite;"></div>')
    glow = ('<div style="position:absolute;left:195px;top:238px;width:520px;height:520px;margin-left:-260px;margin-top:-260px;border-radius:50%;background:radial-gradient(circle,rgba(255,240,180,.95) 0%,rgba(255,160,50,.6) 22%,rgba(255,90,30,.22) 45%,rgba(255,90,30,0) 68%);"></div>')
    burst = ('<svg viewBox="-100 -100 200 200" width="300" height="300" style="position:absolute;left:45px;top:88px;animation:lt-impact .7s ease-in-out infinite;overflow:visible;">'
             '<defs><radialGradient id="bu"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#fff3a0"/><stop offset=".7" stop-color="#ff9a3d"/><stop offset="1" stop-color="rgba(255,90,30,0)"/></radialGradient></defs>'
             '<polygon fill="url(#bu)" points="0,-98 12,-34 46,-86 34,-24 86,-50 46,-8 98,0 46,10 84,52 32,26 44,88 10,36 0,98 -12,36 -46,86 -32,26 -86,50 -46,8 -98,0 -46,-10 -84,-52 -34,-24 -46,-86 -12,-34"/></svg>')
    fire = ('<img src="fx/fire.png" alt="" style="position:absolute;left:130px;top:491px;width:344px;height:90px;transform-origin:0 50%;transform:rotate(-77.8deg);--bc:#ff8a3d;animation:lt-beam .9s ease-in-out infinite;">')
    water = ('<img src="fx/water.png" alt="" style="position:absolute;left:266px;top:494px;width:348px;height:92px;transform-origin:0 50%;transform:rotate(-103.1deg) scaleY(-1);--bc:#6fd6ff;animation:lt-beam .9s ease-in-out .3s infinite;">')
    enemy = (f'<div style="position:absolute;left:131px;top:176px;animation:lt-hit .45s linear infinite;filter:drop-shadow(0 0 14px rgba(255,255,255,.9)) saturate(1.2);">{slime(128)}</div>')
    core = '<div style="position:absolute;left:195px;top:238px;width:120px;height:120px;margin-left:-60px;margin-top:-60px;border-radius:50%;background:radial-gradient(circle,#fff 0%,rgba(255,255,255,.75) 30%,rgba(255,255,255,0) 70%);mix-blend-mode:screen;"></div>'
    embers = ''.join(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{w}px;border-radius:50%;background:{c};box-shadow:0 0 8px {c};animation:lt-rise {d}s ease-out {dl}s infinite;"></div>' for x, y, w, c, d, dl in [
        (70, 420, 5, '#ffb84d', 2.2, 0), (120, 360, 4, '#fff3a0', 2.8, .5), (300, 400, 5, '#7fe9ff', 2.4, .2), (330, 330, 4, '#c8f6ff', 3, .9), (220, 470, 4, '#ffb84d', 2.6, 1.2), (160, 300, 3, '#fff3a0', 2.1, .7), (260, 300, 3, '#7fe9ff', 2.5, 1.5), (40, 300, 4, '#ff8a5c', 3.1, .3)])
    band1 = ('<div style="position:absolute;left:-30px;top:96px;width:330px;height:62px;background:linear-gradient(90deg,#ff5a2a 0%,#ff9a3d 55%,rgba(255,197,61,0) 100%);box-shadow:0 0 26px rgba(255,120,40,.8);animation:lt-cutin 2.4s ease-out infinite;">'
             '<div style="position:absolute;left:46px;top:7px;display:flex;flex-direction:column;transform:skewX(12deg);"><span style="font-size:11px;font-weight:800;letter-spacing:.12em;color:#3a1200;">VIÊM SƯ · KỸ NĂNG ẤN ESTER</span><span style="font-size:23px;font-weight:800;font-style:italic;color:#fff;text-shadow:0 2px 0 #7a1e00, 0 0 14px rgba(255,240,180,.9);white-space:nowrap;">LIỆT DIỄM XUYÊN GIÁP</span></div></div>')
    band2 = ('<div style="position:absolute;right:-30px;top:372px;width:236px;height:46px;background:linear-gradient(270deg,#1f7bff 0%,#6fd6ff 60%,rgba(111,214,255,0) 100%);box-shadow:0 0 22px rgba(80,170,255,.8);transform:skewX(-12deg);">'
             '<div style="position:absolute;right:44px;top:5px;display:flex;flex-direction:column;align-items:flex-end;transform:skewX(12deg);"><span style="font-size:10px;font-weight:800;letter-spacing:.12em;color:#04204a;">THU HÀ · THUỶ LONG</span><span style="font-size:16px;font-weight:800;font-style:italic;color:#fff;text-shadow:0 2px 0 #0a3a8a;white-space:nowrap;">BĂNG LONG TRẢO</span></div></div>')
    dmg = (f'<div style="position:absolute;left:262px;top:160px;display:flex;flex-direction:column;align-items:flex-start;transform:rotate(6deg);animation:lt-pop 1.8s ease-out infinite;">{gold_text("−96", 50)}<span style="margin-top:-8px;font-size:12px;font-weight:800;letter-spacing:.1em;color:#fff;text-shadow:0 0 10px #ff8a3d;">HẠ GỤC!</span></div>')
    combo = ('<div style="position:absolute;left:10px;top:222px;padding:7px 14px;border-radius:999px;background:linear-gradient(90deg,#ff7a45,#ffc53d 55%,#7fe9ff);box-shadow:0 0 22px rgba(255,200,90,.9);font-size:14px;font-weight:800;letter-spacing:.06em;color:#2a1200;transform:rotate(-8deg);white-space:nowrap;">LIÊN KÍCH ×2</div>')
    hp = ('<div style="position:absolute;left:14px;top:272px;width:112px;display:flex;flex-direction:column;gap:4px;align-items:flex-start;">'
          '<div style="width:112px;height:9px;border-radius:999px;background:rgba(0,0,0,.55);box-shadow:inset 0 0 0 1px rgba(255,255,255,.3);overflow:hidden;"><div style="width:4%;height:100%;background:linear-gradient(90deg,#ff3d3d,#ffb84d);"></div></div>'
          '<div style="font-size:11px;font-weight:700;color:#e6ff7a;">Bùn Acid · 35 → 0</div></div>')
    def why(icon_bg, icon, html):
        return f'<div style="display:flex;align-items:center;gap:10px;"><div style="width:30px;height:30px;border-radius:10px;background:{icon_bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;font-weight:800;color:#1a1200;">{icon}</div><div style="font-size:13px;line-height:1.35;color:#eef3ff;">{html}</div></div>'
    panel = ('<div style="position:absolute;left:12px;right:12px;bottom:14px;display:flex;flex-direction:column;gap:8px;padding:14px;border-radius:24px;background:linear-gradient(180deg,rgba(20,28,70,.92),rgba(10,14,40,.96));box-shadow:inset 0 0 0 1px rgba(255,255,255,.16), 0 -8px 26px rgba(0,0,0,.5);">'
             + label("VÌ SAO ĐÒN NÀY MẠNH", "#ffd9a0")
             + why('linear-gradient(180deg,#ffe9a0,#ffb52e)', '×1,5', 'Em <b>tự làm đúng</b> câu Ester ★★ — câu vừa sức của chính em')
             + why('linear-gradient(180deg,#c8f6ff,#6fd6ff)', '×2', 'Hà <b>làm lại đúng</b> sau khi em tiếp sức → hai bạn Liên Kích')
             + why('linear-gradient(180deg,#ffd0bd,#ff8a5c)', 'ẤN', 'Chiêu này mở ra khi em <b>khắc phục xong dạng Ester</b>')
             + '</div>')
    flash = '<div style="position:absolute;inset:0;background:#fff;opacity:0;animation:lt-flash 2.4s ease-out infinite;pointer-events:none;"></div>'
    body = (f'<div style="width:390px;height:{H}px;position:relative;overflow:hidden;box-sizing:border-box;background:radial-gradient(90% 60% at 50% 28%, #4a1c10 0%, #1a0d2e 45%, #05060f 100%);color:#f2f5ff;font-family:{FONT};">'
            + rays + glow + burst + fire + water + enemy + core + embers
            + pet('viem-su', 214, "left:-16px;top:470px;", anim="lt-float 1.4s ease-in-out infinite", glow="rgba(255,170,60,.95)")
            + pet('thuy-long', 176, "left:222px;top:490px;", flip=True, anim="lt-float2 1.6s ease-in-out infinite", glow="rgba(110,210,255,.95)")
            + f'<div style="position:absolute;left:16px;right:16px;top:48px;">{hud(3, "", 1.0)}</div>'
            + band1 + band2 + dmg + combo + hp + panel + flash + '</div>')
    return body, H

# ───────────────────────── 4. TRÙM CÂU CHUNG ─────────────────────────
def trum():
    H = 844
    armor = ''.join(f'<div style="flex-grow:1;height:10px;border-radius:4px;background:{"linear-gradient(180deg,#d9c8ff,#7a4fe0)" if i < 3 else "rgba(255,255,255,.14)"};{"box-shadow:0 0 8px rgba(183,156,255,.9);" if i < 3 else ""}"></div>' for i in range(4))
    scene = ('<div style="position:relative;height:250px;border-radius:28px;overflow:hidden;background:radial-gradient(90% 90% at 50% 30%,#5a2bc0 0%,#2a1466 45%,#0d0828 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14), 0 14px 30px rgba(0,0,0,.45);">'
             '<div style="position:absolute;left:50%;top:-40px;width:420px;height:420px;margin-left:-210px;border-radius:50%;background:conic-gradient(from 0deg,rgba(255,255,255,.1) 0 8%,rgba(255,255,255,0) 8% 16%,rgba(255,255,255,.1) 16% 24%,rgba(255,255,255,0) 24% 33%,rgba(255,255,255,.1) 33% 41%,rgba(255,255,255,0) 41% 50%,rgba(255,255,255,.1) 50% 58%,rgba(255,255,255,0) 58% 66%,rgba(255,255,255,.1) 66% 75%,rgba(255,255,255,0) 75% 83%,rgba(255,255,255,.1) 83% 91%,rgba(255,255,255,0) 91% 100%);animation:lt-spin 40s linear infinite;"></div>'
             + stars(14, 358, 120, 3)
             + f'<div style="position:absolute;left:50%;top:34px;margin-left:-96px;animation:lt-float 3s ease-in-out infinite;">{boss(192)}</div>'
             + pet('viem-su', 62, "left:6px;bottom:8px;")
             + pet('thuy-long', 56, "left:62px;bottom:2px;", anim="lt-float2 3.2s ease-in-out infinite", glow="rgba(110,200,255,.7)")
             + pet('phong-tho', 54, "right:60px;bottom:2px;", flip=True, anim="lt-float 3.6s ease-in-out infinite", glow="rgba(150,255,210,.7)")
             + pet('thach-quy', 60, "right:4px;bottom:8px;", flip=True, anim="lt-float2 3.4s ease-in-out infinite", glow="rgba(200,255,140,.7)")
             + '<div style="position:absolute;left:14px;right:14px;top:12px;display:flex;flex-direction:column;gap:6px;"><div style="display:flex;justify-content:space-between;align-items:baseline;"><div style="font-size:14px;font-weight:800;letter-spacing:.04em;color:#f0e2ff;">TRÙM · CHÚA TỂ KẾT TỦA</div><div style="font-size:11px;font-weight:700;color:#d9c8ff;">GIÁP 3/4</div></div>'
             f'<div style="display:flex;gap:4px;">{armor}</div></div></div>')

    def row(k, text, who, pimg, state, mine=False, val=None):
        ava = f'<div style="width:34px;height:34px;border-radius:50%;background:rgba(10,16,40,.85);overflow:hidden;flex-shrink:0;box-shadow:0 0 0 2px {"#ffd166" if mine else "rgba(255,255,255,.25)"};"><img src="pets/{pimg}.png" alt="" style="width:100%;height:100%;object-fit:contain;"></div>'
        if mine:
            right = ('<div style="display:flex;gap:6px;flex-shrink:0;"><div style="height:40px;padding:0 14px;border-radius:20px;background:#0f5223;color:#c4eed0;font-size:13px;font-weight:800;display:flex;align-items:center;box-shadow:inset 0 0 0 2px #6dd58c;">Đúng</div><div style="height:40px;padding:0 14px;border-radius:20px;background:#fff;color:#3c4046;font-size:13px;font-weight:700;display:flex;align-items:center;box-shadow:inset 0 0 0 1px #c9c2b0;">Sai</div></div>')
            wrap = "background:#fff7dc;box-shadow:inset 0 0 0 2px #ffc53d;"
        else:
            col = "#146c2e" if state == "đã chốt" else "#8a6d00"
            right = f'<div style="flex-shrink:0;font-size:12px;font-weight:800;color:{col};">{state}</div>'
            wrap = "background:#fff;box-shadow:inset 0 0 0 1px #e2dbc8;"
        return (f'<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:16px;{wrap}">{ava}<div style="flex-grow:1;display:flex;flex-direction:column;gap:1px;"><div style="font-size:10px;font-weight:800;letter-spacing:.06em;color:{"#b3471e" if mine else "#5b6168"};">Ý {k} · {who}</div><div style="font-size:13px;line-height:1.35;color:#22262b;">{text}</div></div>{right}</div>')
    q = ('<div style="display:flex;flex-direction:column;gap:8px;padding:14px;border-radius:24px;background:#f7f2e7;color:#22262b;box-shadow:0 12px 26px rgba(0,0,0,.35);">'
         '<div style="display:flex;align-items:center;gap:8px;"><div style="padding:3px 10px;border-radius:999px;background:#5a2bc0;color:#fff;font-size:11px;font-weight:800;">CÂU CHUNG CẢ ĐỘI</div><div style="font-size:12px;color:#5b6168;">Ester · dạng cả lớp đang yếu</div></div>'
         '<div style="font-size:14px;line-height:1.5;">Cho ester X có công thức CH₃COOC₂H₅. Mỗi bạn giữ một ý — cứ bàn với nhau:</div>'
         + row('a', 'X có tên là ethyl acetate.', 'THU HÀ', 'thuy-long', 'đã chốt')
         + row('b', 'Thuỷ phân X trong NaOH thu được muối và ancol.', 'CỦA EM', 'viem-su', '', mine=True)
         + row('c', 'X tan tốt trong nước hơn ethanol.', 'NAM', 'phong-tho', 'đang nghĩ…')
         + row('d', 'Đốt cháy X thu được số mol CO₂ bằng số mol H₂O.', 'LAN', 'thach-quy', 'đã chốt')
         + '</div>')
    emo = lambda t: f'<div style="height:40px;padding:0 14px;border-radius:20px;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);font-size:13px;font-weight:700;display:flex;align-items:center;white-space:nowrap;">{t}</div>'
    foot = (f'<div style="display:flex;gap:8px;justify-content:center;">{emo("Mình chắc ý này")}{emo("Cần bàn thêm")}{emo("Đợi tí")}</div>'
            f'<div style="text-align:center;font-size:13px;color:#dfe8ff;">Đúng từ <b style="color:#fff;">3/4 ý</b> → {gold_text("VỠ GIÁP TRÙM", 13)} · cả đội cùng thắng</div>')
    body = (f'<div style="width:390px;height:{H}px;position:relative;overflow:hidden;box-sizing:border-box;background:radial-gradient(120% 70% at 50% 0%, #3a1f8a 0%, #160d44 45%, #070b1f 100%);color:#f2f5ff;font-family:{FONT};">'
            f'<div style="position:relative;display:flex;flex-direction:column;gap:10px;padding:48px 16px 18px;box-sizing:border-box;">{hud(4, 52, .87)}{scene}{q}{foot}</div></div>')
    return body, H

# ───────────────────────── 5. KẾT CHẶNG ─────────────────────────
def ket():
    H = 1170
    confetti = ''.join(f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:2px;background:{c};transform:rotate({r}deg);animation:lt-twinkle {d}s ease-in-out infinite;"></div>' for x, y, w, h, c, r, d in [
        (40, 90, 8, 14, '#ffd166', 20, 2.2), (92, 60, 6, 12, '#7fe9ff', -30, 2.8), (300, 70, 8, 14, '#ff8a5c', 40, 2.4), (338, 120, 6, 12, '#7dffb0', -15, 3), (60, 190, 6, 10, '#c9a7ff', 55, 2.6), (324, 210, 8, 12, '#ffd166', -40, 2.1), (150, 50, 6, 10, '#ff8a5c', 10, 3.2), (240, 46, 6, 12, '#c9a7ff', -25, 2.5)])
    star = lambda on: f'<svg viewBox="0 0 24 24" width="40" height="40" fill="{"#ffd166" if on else "rgba(255,255,255,.18)"}" style="{"filter:drop-shadow(0 0 10px rgba(255,209,102,.9));" if on else ""}"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>'
    hero = ('<div style="position:relative;height:300px;">'
            '<div style="position:absolute;left:50%;top:-30px;width:460px;height:460px;margin-left:-230px;border-radius:50%;background:conic-gradient(from 0deg,rgba(255,209,102,.22) 0 6%,rgba(255,209,102,0) 6% 12.5%,rgba(255,209,102,.22) 12.5% 18.5%,rgba(255,209,102,0) 18.5% 25%,rgba(255,209,102,.22) 25% 31%,rgba(255,209,102,0) 31% 37.5%,rgba(255,209,102,.22) 37.5% 43.5%,rgba(255,209,102,0) 43.5% 50%,rgba(255,209,102,.22) 50% 56%,rgba(255,209,102,0) 56% 62.5%,rgba(255,209,102,.22) 62.5% 68.5%,rgba(255,209,102,0) 68.5% 75%,rgba(255,209,102,.22) 75% 81%,rgba(255,209,102,0) 81% 87.5%,rgba(255,209,102,.22) 87.5% 93.5%,rgba(255,209,102,0) 93.5% 100%);-webkit-mask-image:radial-gradient(circle,#000 0%,rgba(0,0,0,0) 68%);mask-image:radial-gradient(circle,#000 0%,rgba(0,0,0,0) 68%);animation:lt-spin 36s linear infinite;"></div>'
            + confetti
            + pet('viem-su', 168, "left:50%;margin-left:-84px;top:36px;", anim="lt-float 1.6s ease-in-out infinite", glow="rgba(255,200,90,.9)")
            + pet('thuy-long', 76, "left:26px;top:128px;", anim="lt-float2 2.2s ease-in-out infinite", glow="rgba(110,200,255,.8)")
            + pet('phong-tho', 70, "right:26px;top:136px;", flip=True, anim="lt-float 2.4s ease-in-out infinite", glow="rgba(150,255,210,.8)")
            + f'<div style="position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;gap:2px;"><div style="display:flex;gap:4px;align-items:flex-end;">{star(True)}<div style="transform:translateY(-8px) scale(1.15);">{star(True)}</div>{star(True)}</div>{gold_text("VƯỢT CHẶNG!", 34)}</div></div>')
    cls = glass('<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;">' + '<div style="position:relative;width:40px;height:40px;flex-shrink:0;">' + orb(40, "left:0;top:0;") + '</div>'
                '<div style="flex-grow:1;display:flex;flex-direction:column;gap:6px;"><div style="font-size:14px;font-weight:700;">Linh Tâm của lớp: trạm 17 → <span style="color:#7dffb0;">18</span>/30</div><div style="height:8px;border-radius:999px;background:rgba(255,255,255,.14);overflow:hidden;"><div style="width:60%;height:100%;border-radius:999px;background:linear-gradient(90deg,#7dffb0,#7fe9ff);box-shadow:0 0 10px #7dffb0;"></div></div><div style="font-size:12px;color:#c9d6f2;">Em là bạn thứ 10 góp sức hôm nay · còn 2 trạm tới quà cả lớp</div></div></div>')
    def prow(bg, fg, icon, html):
        return f'<div style="display:flex;align-items:center;gap:12px;"><div style="width:42px;height:42px;border-radius:14px;background:{bg};color:{fg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">{icon}</div><div style="flex-grow:1;font-size:15px;line-height:1.4;">{html}</div></div>'
    i_up = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"></path></svg>'
    i_gem = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"></path><path d="M11 3 8 9l4 13 4-13-3-6"></path><path d="M2 9h20"></path></svg>'
    i_ppl = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'
    prog = ('<div style="display:flex;flex-direction:column;gap:12px;padding:18px;border-radius:24px;background:#f7f2e7;color:#22262b;box-shadow:0 12px 26px rgba(0,0,0,.35);">'
            '<div style="font-size:12px;font-weight:800;letter-spacing:.08em;color:#5b6168;">HÔM NAY EM TIẾN BỘ GÌ</div>'
            + prow('#c4eed0', '#146c2e', i_up, '<b>2 câu lên bậc ôn</b> · em tự làm đúng 5/6 câu')
            + prow('#fde7dc', '#b3471e', i_gem, 'Ấn <b>Ester</b>: còn <b>3 câu</b> nữa là sáng<div style="margin-top:6px;height:6px;border-radius:999px;background:#e7e1d3;overflow:hidden;"><div style="width:62%;height:6px;background:linear-gradient(90deg,#ffb27a,#d9774a);"></div></div>')
            + prow('#d3e3fd', '#0b57d0', i_ppl, 'Em <b>tiếp sức Thu Hà 1 lần</b> · Hà làm lại đúng')
            + '<div style="font-size:12px;line-height:1.5;color:#5b6168;">Câu Hà được giúp hôm nay sẽ quay lại để Hà tự làm vào ngày mai.</div></div>')
    shards = ''.join(f'<div style="flex-grow:1;height:10px;border-radius:3px;transform:skewX(-14deg);background:{"linear-gradient(180deg,#fff0a8,#ffb52e)" if i < 8 else "rgba(255,255,255,.16)"};{"box-shadow:0 0 6px rgba(255,209,102,.8);" if i < 8 else ""}"></div>' for i in range(12))
    def rt(v, t, c, bg):
        return f'<div style="display:flex;flex-direction:column;gap:2px;padding:12px;border-radius:18px;background:{bg};box-shadow:inset 0 0 0 1px rgba(255,255,255,.14);"><div style="font-size:24px;font-weight:800;color:{c};">{v}</div><div style="font-size:12px;color:#dfe8ff;">{t}</div></div>'
    rew = glass(f'<div style="display:flex;flex-direction:column;gap:10px;padding:16px;">{label("PHẦN THƯỞNG")}<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;">{rt("+46","EXP thần thú","#7dffb0","rgba(109,213,140,.16)")}{rt("+3","EXP tiếp sức","#a8c7fa","rgba(168,199,250,.16)")}</div>'
                f'<div style="display:flex;align-items:center;gap:12px;padding:12px;border-radius:18px;background:rgba(255,209,102,.14);box-shadow:inset 0 0 0 1px rgba(255,209,102,.4);"><div style="animation:lt-glow 2.4s ease-in-out infinite;"><svg viewBox="0 0 48 54" width="44" height="50" style="overflow:visible"><defs><linearGradient id="shG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c0"/><stop offset=".5" stop-color="#ffc53d"/><stop offset="1" stop-color="#b86e00"/></linearGradient></defs><path d="M24 2 L44 9 V26 C44 39 35 48 24 52 C13 48 4 39 4 26 V9Z" fill="url(#shG)"/><path d="M24 8 L38 13 V26 C38 35 32 42 24 45Z" fill="rgba(0,0,0,.16)"/><path d="M24 8 L10 13 V26 C10 35 16 42 24 45Z" fill="rgba(255,255,255,.28)"/><path d="M24 17 l3 6 6.5 1 -4.7 4.6 1.1 6.4 -5.9 -3.1 -5.9 3.1 1.1 -6.4 -4.7 -4.6 6.5 -1Z" fill="#7a4300" opacity=".7"/></svg></div><div style="flex-grow:1;display:flex;flex-direction:column;gap:6px;"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700;"><span>Mảnh khiên · đủ 12 rèn 1 khiên</span><span style="color:#ffd166;">8/12</span></div><div style="display:flex;gap:3px;">{shards}</div><div style="font-size:12px;color:#c9d6f2;">Mai đi tiếp để giữ chuỗi · rương 7 ngày còn 2 ngày</div></div></div></div>')
    btns = ('<div style="display:flex;flex-direction:column;gap:10px;">' + cta('VỀ BẢNG NHIỆM VỤ', 'Main.dc.html', icon=False, h=54)
            + '<a href="GameSanh.dc.html" style="display:flex;align-items:center;justify-content:center;height:48px;border-radius:24px;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);color:#f2f5ff;font-size:14px;font-weight:700;text-decoration:none;">Đi thêm một chặng · 1 vé</a>'
            '<div style="font-size:12px;color:#9fb2d9;text-align:center;">Hết vé? Làm xong nhiệm vụ hôm nay để nhận 2 vé.</div></div>')
    body = (f'<div style="width:390px;height:{H}px;position:relative;overflow:hidden;box-sizing:border-box;background:{BG};color:#f2f5ff;font-family:{FONT};">'
            + stars(24, 390, 400, 9)
            + f'<div style="position:relative;display:flex;flex-direction:column;gap:14px;padding:44px 16px 28px;box-sizing:border-box;">{hero}{cls}{prog}{rew}{btns}</div></div>')
    return body, H

BOARDS = [('GameSanh', 'Đoàn Hộ Tống — sảnh hằng ngày', sanh), ('GameTran', 'Đoàn Hộ Tống — trong trận', tran), ('GameTiepSuc', 'Đoàn Hộ Tống — tiếp sức bạn', tiepsuc), ('GameChuong', 'Đoàn Hộ Tống — tung chưởng Liên Kích', chuong), ('GameTrum', 'Đoàn Hộ Tống — trùm câu chung', trum), ('GameKetChang', 'Đoàn Hộ Tống — kết chặng', ket)]

TPL = """<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>__TITLE__</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">
<style>__CSS__</style>
</helmet>
__BODY__
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":390,"height":__H__}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
"""
sizes = {}
prev = []
for name, title, fn in BOARDS:
    body, H = fn()
    sizes[name] = H
    open(os.path.join(P, name + '.dc.html'), 'w', encoding='utf-8').write(TPL.replace('__TITLE__', title).replace('__CSS__', CSS).replace('__BODY__', body).replace('__H__', str(H)))
    prev.append(f'<div style="flex-shrink:0">{body}</div>')
open(os.path.join(P, 'preview.html'), 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>' + CSS + 'body{background:#222;display:flex;gap:24px;padding:24px;align-items:flex-start}</style></head><body>' + ''.join(prev) + '</body></html>')
print(sizes)
