# Sinh bộ logo ĐỖ ĐẠI HỌC (3 app) dạng SVG + bảng trình bày.
import math, os
D = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(D, 'out'); os.makedirs(OUT, exist_ok=True)

# ── chữ A của Avogadro: trụ đậm, nét chéo mảnh, thanh ngang, gạch rời ──
def glyph(color='#fff', accent='#fff', w_cheo=13.0, w_ngang=11.0, dx=0, dy=0, sc=1.0):
    # tâm nét chéo đi qua P0 (trong trụ) và đỉnh gãy V
    P0 = (360.0, 108.0); V = (232.0, 230.0); S = (340.0, 274.0)   # S: chỗ thanh ngang chạm trụ
    dxv, dyv = V[0]-P0[0], V[1]-P0[1]; L = math.hypot(dxv, dyv); ux, uy = dxv/L, dyv/L
    nx, ny = uy, -ux                       # pháp tuyến hướng lên-trái
    if ny > 0: nx, ny = -nx, -ny
    h = w_cheo/2
    # mép ngoài nét chéo
    ox, oy = P0[0]+nx*h, P0[1]+ny*h
    xr = 366.0                              # mép phải trụ ở đỉnh
    t = (xr-ox)/(-ux); apex = (xr, oy + t*(-uy))
    xl = 333.0
    t2 = (ox-xl)/(-ux) if False else (xl-ox)/ux; tl = (xl, oy + t2*uy)
    stem = [apex, (370.5, 410.0), (337.0, 395.5), tl]
    # gạch rời: tiếp tục hướng nét chéo sau V, cách một khoảng
    g0 = (V[0]+ux*62, V[1]+uy*62); g1 = (V[0]+ux*128, V[1]+uy*128)
    hs = w_cheo*0.62
    slash = [(g0[0]+nx*hs, g0[1]+ny*hs), (g0[0]-nx*hs, g0[1]-ny*hs), (g1[0]-nx*hs, g1[1]-ny*hs), (g1[0]+nx*hs, g1[1]+ny*hs)]
    pts = lambda P: ' '.join(f'{x:.1f},{y:.1f}' for x, y in P)
    tr = f'translate({dx},{dy})' + (f' translate(256,256) scale({sc}) translate(-256,-256)' if sc != 1.0 else '')
    return (f'<g transform="{tr}">'
            f'<polygon points="{pts(stem)}" fill="{color}"/>'
            f'<path d="M{P0[0]+ -ux*6:.1f} {P0[1]+ -uy*6:.1f} L{V[0]:.1f} {V[1]:.1f}" stroke="{color}" stroke-width="{w_cheo}" fill="none" stroke-linecap="butt"/>'
            f'<path d="M{V[0]-ux*0:.1f} {V[1]:.1f} L{S[0]:.1f} {S[1]:.1f}" stroke="{color}" stroke-width="{w_ngang}" fill="none"/>'
            f'<polygon points="{pts([(V[0]+nx*h, V[1]+ny*h), (V[0]-nx*h+ux*2, V[1]-ny*h+uy*2), (V[0]+6, V[1]+8), (V[0]-2, V[1]-7)])}" fill="{color}"/>'
            f'<polygon points="{pts(slash)}" fill="{accent}"/>'
            f'</g>')

def polar_path(fn, n=720, cx=256, cy=256):
    P = []
    for i in range(n):
        th = 2*math.pi*i/n; r = fn(th)
        P.append((cx + r*math.cos(th), cy + r*math.sin(th)))
    return 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in P) + 'Z'

def squircle(R=222, n=4.6):
    def fn(th):
        c, s = abs(math.cos(th)), abs(math.sin(th))
        return R / ((c**n + s**n) ** (1/n))
    return polar_path(fn)
def cookie(R=214, a=0.042, k=12): return polar_path(lambda th: R*(1 + a*math.cos(k*th)))
def clover(R=206, a=0.135): return polar_path(lambda th: R*(1 + a*math.cos(4*(th - math.pi/4))))
def arch():
    # mái vòm: nửa trên tròn, nửa dưới vuông bo — "ngôi nhà"
    L, Rr, T, B, r = 52, 460, 40, 472, 96
    cx = 256; rad = (Rr-L)/2
    return (f'M{L} {T+rad} A{rad} {rad} 0 0 1 {Rr} {T+rad} L{Rr} {B-r} Q{Rr} {B} {Rr-r} {B} L{L+r} {B} Q{L} {B} {L} {B-r}Z')

def bo_goc(P, r):
    # đa giác bo góc: mỗi góc một cung bậc hai
    n = len(P); d = ''
    for i in range(n):
        p0, p1, p2 = P[i-1], P[i], P[(i+1) % n]
        def toward(a, b, dist):
            L = math.hypot(b[0]-a[0], b[1]-a[1]); t = min(dist, L/2)/L
            return (a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t)
        a = toward(p1, p0, r); b = toward(p1, p2, r)
        d += (f'M{a[0]:.1f} {a[1]:.1f}' if i == 0 else f'L{a[0]:.1f} {a[1]:.1f}') + f' Q{p1[0]:.1f} {p1[1]:.1f} {b[0]:.1f} {b[1]:.1f} '
    return d + 'Z'
def nha(): return bo_goc([(256, 30), (478, 196), (446, 474), (66, 474), (34, 196)], 92)

def sparkle(cx, cy, r, fill):
    k = 0.16
    return (f'<path d="M{cx} {cy-r} C{cx+r*k} {cy-r*k} {cx+r*k} {cy-r*k} {cx+r} {cy} C{cx+r*k} {cy+r*k} {cx+r*k} {cy+r*k} {cx} {cy+r} '
            f'C{cx-r*k} {cy+r*k} {cx-r*k} {cy+r*k} {cx-r} {cy} C{cx-r*k} {cy-r*k} {cx-r*k} {cy-r*k} {cx} {cy-r}Z" fill="{fill}"/>')

APPS = {
  'gv': dict(ten='Giáo viên', shape=squircle(), g=('#3b82f6', '#0b57d0', '#08409a'), nen='#062e6f', accent='#a8c7fa', nhat='#d3e3fd'),
  'hs': dict(ten='Học sinh', shape=cookie(), g=('#34c26a', '#188a42', '#0f5f2c'), nen='#0a4a22', accent='#fdd663', nhat='#c4eed0'),
  'ph': dict(ten='Phụ huynh', shape=nha(), g=('#ff9a5c', '#e2621b', '#b3440c'), nen='#7a2c05', accent='#ffe0cc', nhat='#ffdbc8'),
}

def trang_tri(app, a):
    if app == 'gv':   # quỹ đạo electron + hạt
        return (f'<g fill="none" stroke="{a["accent"]}" stroke-width="7" stroke-linecap="round" opacity=".95">'
                f'<path d="M322 348 A160 62 -30 0 1 112 262" />'
                f'<path d="M128 214 A160 62 -30 0 1 318 160" opacity=".5"/></g>'
                f'<circle cx="111" cy="263" r="14" fill="{a["accent"]}"/>')
    if app == 'hs':   # sao tiến bộ
        return sparkle(138, 150, 42, a['accent']) + sparkle(196, 92, 17, a['accent'])
    # ph: hai chấm lớn–nhỏ (cha mẹ & con)
    return f'<circle cx="138" cy="232" r="26" fill="{a["accent"]}"/><circle cx="188" cy="186" r="14" fill="{a["accent"]}" opacity=".9"/>'

def svg(app, kieu='hinh', dam=False):
    a = APPS[app]; g = a['g']
    defs = (f'<defs><linearGradient id="g{app}" x1="0.15" y1="0" x2="0.85" y2="1"><stop offset="0" stop-color="{g[0]}"/><stop offset=".5" stop-color="{g[1]}"/><stop offset="1" stop-color="{g[2]}"/></linearGradient>'
            f'<filter id="b{app}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#000" flood-opacity=".22"/></filter>'
            f'<radialGradient id="s{app}" cx=".3" cy=".18" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>')
    wc, wn = (19, 16) if dam else (13, 11)
    body = ''
    if kieu == 'day':     # tràn nền (maskable / iOS): nền đậm + hình khối thu nhỏ trong vùng an toàn
        body += f'<rect width="512" height="512" fill="{a["nen"]}"/><g transform="translate(256,256) scale(.84) translate(-256,-256)">'
    body += f'<path d="{a["shape"]}" fill="url(#g{app})"/><path d="{a["shape"]}" fill="url(#s{app})"/>'
    body += (f'<clipPath id="c{app}"><path d="{a["shape"]}"/></clipPath><g clip-path="url(#c{app})">' + trang_tri(app, a) + '</g>' if not dam else '') + f'<g filter="url(#b{app})">' + glyph('#ffffff', a['accent'], wc, wn, dx=-14, dy=(22 if app=='ph' else 4), sc=((1.0 if app=='ph' else 1.06) if not dam else (1.1 if app=='ph' else 1.16))) + '</g>'
    if kieu == 'day': body += '</g>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">{defs}{body}</svg>'

def svg_don_sac(color):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">{glyph(color, color, 13, 11, sc=1.25)}</svg>'

for app in APPS:
    open(f'{OUT}/logo-{app}.svg', 'w').write(svg(app))
    open(f'{OUT}/logo-{app}-day.svg', 'w').write(svg(app, 'day'))
    open(f'{OUT}/logo-{app}-nho.svg', 'w').write(svg(app, dam=True))
open(f'{OUT}/logo-don-sac.svg', 'w').write(svg_don_sac('#1f1f1f'))

# ── bảng trình bày ──
def inl(s, px): return s.replace('width="512" height="512"', f'width="{px}" height="{px}"', 1)
def uniq(s, suf): return s.replace('id="g', f'id="{suf}g').replace('url(#g', f'url(#{suf}g').replace('id="s', f'id="{suf}s').replace('url(#s', f'url(#{suf}s').replace('id="b', f'id="{suf}b').replace('url(#b', f'url(#{suf}b').replace('id="c', f'id="{suf}c').replace('url(#c', f'url(#{suf}c')
cards = ''
n = 0
for app, a in APPS.items():
    n += 1
    big = uniq(inl(svg(app), 260), f'b{n}')
    sizes = ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">{uniq(inl(svg(app, dam=(px<=40)), px), f"z{n}{px}")}<span style="font-size:11px;color:#5f6368;">{px}px</span></div>' for px in (96, 64, 40, 24))
    ios = uniq(inl(svg(app, 'day'), 84), f'i{n}')
    lock_l = (f'<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:16px;background:#fdfbff;box-shadow:inset 0 0 0 1px #e0e3e7;">{uniq(inl(svg(app), 44), f"l{n}")}'
              f'<div style="display:flex;flex-direction:column;line-height:1.15;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:18px;font-weight:800;letter-spacing:.02em;color:#1f1f1f;">ĐỖ ĐẠI HỌC</span><span style="padding:2px 8px;border-radius:999px;background:{a["nhat"]};color:{a["g"][2]};font-size:10px;font-weight:800;letter-spacing:.08em;">{a["ten"].upper()}</span></div><span style="font-family:Didot,\'Bodoni 72\',Georgia,serif;font-style:italic;font-size:13px;color:#5f6368;">6,022 · 10²³</span></div></div>')
    lock_d = lock_l.replace('#fdfbff', '#1e1f20').replace('#e0e3e7', '#3c4043').replace('color:#1f1f1f', 'color:#e3e3e3').replace('color:#5f6368', 'color:#c4c7c5').replace(f'l{n}', f'd{n}')
    cards += (f'<div style="display:flex;flex-direction:column;gap:20px;padding:28px;border-radius:32px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.12),0 8px 24px rgba(0,0,0,.06);">'
              f'<div style="display:flex;flex-direction:column;gap:4px;"><div style="font-size:22px;font-weight:800;color:#1f1f1f;">App {a["ten"]}</div><div style="font-size:13px;color:#5f6368;">{"Vuông bo · xanh dương chủ đạo · quỹ đạo electron" if app=="gv" else "Bánh quy 12 múi · xanh lá tiến bộ · sao tiến bộ" if app=="hs" else "Ngôi nhà bo góc · cam ấm · hai chấm cha mẹ và con"}</div></div>'
              f'<div style="display:flex;align-items:center;justify-content:center;height:300px;border-radius:24px;background:linear-gradient(180deg,#f0f4f9,#e9eef6);">{big}</div>'
              f'<div style="display:flex;align-items:flex-end;justify-content:space-between;">{sizes}'
              f'<div style="display:flex;flex-direction:column;align-items:center;gap:6px;"><div style="border-radius:20px;overflow:hidden;width:84px;height:84px;box-shadow:0 4px 12px rgba(0,0,0,.25);">{ios}</div><span style="font-size:11px;color:#5f6368;">icon điện thoại</span></div></div>'
              f'{lock_l}{lock_d}</div>')
board = (f'<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap" rel="stylesheet">'
         f'<style>body{{margin:0;background:#f8fafd;font-family:"Be Vietnam Pro",system-ui,sans-serif}}</style></head><body>'
         f'<div style="width:1500px;padding:40px;box-sizing:border-box;display:flex;flex-direction:column;gap:28px;">'
         f'<div style="display:flex;align-items:center;gap:20px;"><div style="width:72px;height:72px;">{inl(svg_don_sac("#1f1f1f"),72)}</div><div><div style="font-size:30px;font-weight:800;color:#1f1f1f;">Bộ logo ĐỖ ĐẠI HỌC · bản vẽ 19/09</div><div style="font-size:15px;color:#5f6368;">Giữ chữ A của Avogadro từ logo gốc (trụ đậm · nét chéo mảnh · gạch rời). Mỗi app một HÌNH KHỐI + MÀU + CHI TIẾT riêng, cùng một ngôn ngữ Material 3.</div></div></div>'
         f'<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;">{cards}</div></div></body></html>')
open(f'{D}/board.html', 'w').write(board)
print('ok')
