# Sinh 4 artboard "Đảo thần thú" bản mới (.dc.html) + preview.
import os, importlib.util
D = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(D, 'project')
spec = importlib.util.spec_from_file_location('g', os.path.join(D, 'gen_game.py'))
# dùng lại CSS + hàm của gen_game mà không chạy phần ghi tệp của nó
src = open(os.path.join(D, 'gen_game.py'), encoding='utf-8').read().split('BOARDS = [')[0]
g = {'__file__': os.path.join(D, 'gen_game.py')}; exec(compile(src, 'gen_game_lib', 'exec'), g)
CSS, FONT, BG = g['CSS'], g['FONT'], g['BG']
pet, stars, orb, slime, chest, shine, cta, glass, label, gold_text, hud = (g[k] for k in ('pet', 'stars', 'orb', 'slime', 'chest', 'shine', 'cta', 'glass', 'label', 'gold_text', 'hud'))

def khung(h, body, bg=BG):
    return f'<div style="width:390px;height:{h}px;position:relative;overflow:hidden;box-sizing:border-box;background:{bg};color:#f2f5ff;font-family:{FONT};">{body}</div>'

# ───────── 1. CHỌN THẦN THÚ ─────────
def chon():
    H = 844
    def the(ten, nhan, he, mau, chon=False, goc=0, x=0, y=0, w=250, z=1, mo=1.0):
        vien = f'box-shadow:0 0 0 3px {mau},0 18px 40px rgba(0,0,0,.55),0 0 46px {mau};' if chon else 'box-shadow:0 10px 26px rgba(0,0,0,.5);'
        return (f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;border-radius:26px;overflow:hidden;background:#f6efe0;transform:rotate({goc}deg);z-index:{z};opacity:{mo};{vien}">'
                f'<img src="the/{ten}-thuong.jpg" alt="" style="display:block;width:100%;height:{int(w*1.0)}px;object-fit:cover;object-position:50% 40%;">'
                f'<div style="padding:10px 14px 14px;color:#2a2116;"><div style="display:flex;align-items:baseline;justify-content:space-between;"><span style="font-size:{22 if chon else 16}px;font-weight:800;">{nhan}</span><span style="padding:2px 9px;border-radius:999px;background:{mau};color:#fff;font-size:11px;font-weight:800;">{he}</span></div>'
                + (f'<div style="font-size:13px;line-height:1.4;color:#5a4a36;margin-top:4px;">Giỏi nhất việc: <b>thử câu cùng dạng mới</b>. Càng làm đúng liên tiếp càng dễ <b style="color:#c2410c;">CUỒNG NỘ</b>.</div>' if chon else '') + '</div></div>')
    body = (stars(30, 390, 844, 3)
            + '<div style="position:absolute;left:0;right:0;top:52px;text-align:center;"><div style="font-size:12px;font-weight:800;letter-spacing:.3em;color:#a8c7fa;">BÁT LINH ĐẢO</div><div style="font-size:30px;font-weight:800;margin-top:4px;">Chọn bạn đồng hành</div><div style="font-size:14px;color:#c9d6f2;margin-top:4px;">Tám thần thú — con nào cũng học được mọi phần Hoá</div></div>'
            + the('thuy-long', 'Thuỷ Long', 'Nước', '#2b9fd0', goc=-9, x=-64, y=232, w=200, z=1, mo=.78)
            + the('phong-tho', 'Phong Thố', 'Khí', '#3fb58f', goc=9, x=254, y=232, w=200, z=1, mo=.78)
            + the('viem-su', 'Viêm Sư', 'Lửa', '#e2571b', chon=True, x=70, y=176, w=250, z=3)
            + '<div style="position:absolute;left:0;right:0;top:606px;display:flex;justify-content:center;gap:8px;">' + ''.join(f'<span style="width:{22 if i==2 else 8}px;height:8px;border-radius:999px;background:{"#ffd166" if i==2 else "rgba(255,255,255,.3)"};"></span>' for i in range(8)) + '</div>'
            + '<div style="position:absolute;left:16px;right:16px;top:634px;display:flex;gap:10px;"><div style="flex:1;height:56px;border-radius:18px;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);display:flex;align-items:center;padding:0 16px;font-size:15px;color:#c9d6f2;">Đặt tên cho bạn ấy…</div><div style="width:56px;height:56px;border-radius:18px;background:rgba(255,255,255,.1);box-shadow:inset 0 0 0 1px rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ffd166" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.8 1 6.5 2.7L21 8"/><path d="M21 3v5h-5"/></svg></div></div>'
            + '<div style="position:absolute;left:16px;right:16px;top:706px;">' + cta('CHỌN VIÊM SƯ', 'DaoNha.dc.html', icon=False) + '<div style="font-size:12px;color:#9fb2d9;text-align:center;margin-top:10px;">Vuốt để xem cả tám · chạm thẻ để xem dạng CUỒNG NỘ · đổi thần thú sau vẫn giữ cấp</div></div>')
    return khung(H, body), H

# ───────── 2. ĐẢO (NHÀ) ─────────
def dao():
    H = 1240
    dau = ('<div style="display:flex;align-items:center;justify-content:space-between;"><div style="display:flex;flex-direction:column;"><span style="font-size:12px;font-weight:800;letter-spacing:.24em;color:#a8c7fa;">BÁT LINH ĐẢO</span><span style="font-size:24px;font-weight:800;">Lửa Nhỏ của Minh</span></div>'
           '<div style="display:flex;gap:8px;"><div style="display:flex;align-items:center;gap:6px;height:34px;padding:0 12px;border-radius:17px;background:rgba(255,138,92,.22);box-shadow:inset 0 0 0 1px rgba(255,138,92,.55);font-size:14px;font-weight:800;color:#ffc2a6;"><svg viewBox="0 0 24 24" width="16" height="16" fill="#ff8a5c"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>5 ngày</div></div></div>')
    # hòn đảo
    C = 2 * 3.14159 * 118
    dao_html = ('<div style="position:relative;height:400px;border-radius:32px;overflow:hidden;background:linear-gradient(180deg,#2a1f6e 0%,#4a3aa8 34%,#ff9a6b 72%,#ffd9a0 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.16),0 16px 36px rgba(0,0,0,.45);">'
                '<div style="position:absolute;left:50%;top:210px;width:220px;height:220px;margin-left:-110px;border-radius:50%;background:radial-gradient(circle,#fff6d6 0%,#ffd98a 38%,rgba(255,217,138,0) 70%);"></div>'
                + stars(18, 358, 140, 8)
                + '<svg viewBox="0 0 358 400" width="358" height="400" style="position:absolute;inset:0;"><path d="M0 330 C70 300 120 340 190 316 S 300 300 358 326 L358 400 L0 400Z" fill="rgba(60,40,120,.55)"/><ellipse cx="179" cy="338" rx="150" ry="34" fill="#3d7a4a"/><ellipse cx="179" cy="330" rx="150" ry="30" fill="#5fae62"/><path d="M40 338 C70 392 130 400 179 400 C228 400 290 392 318 338Z" fill="#6b4a2e"/><path d="M70 350 q10 26 22 4 M250 352 q12 30 24 2" stroke="#4a3220" stroke-width="5" fill="none" stroke-linecap="round"/><g fill="#2f7d45"><circle cx="66" cy="312" r="16"/><circle cx="84" cy="304" r="20"/><circle cx="292" cy="308" r="18"/><circle cx="276" cy="300" r="14"/></g></svg>'
                # vòng EXP quanh thú
                + f'<svg viewBox="0 0 260 260" width="260" height="260" style="position:absolute;left:49px;top:64px;transform:rotate(-90deg);"><circle cx="130" cy="130" r="118" stroke="rgba(255,255,255,.16)" stroke-width="8" fill="none"/><circle cx="130" cy="130" r="118" stroke="#ffd166" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="{C*0.64:.0f} {C:.0f}" style="filter:drop-shadow(0 0 8px #ffd166)"/></svg>'
                + pet('viem-su', 210, 'left:74px;top:96px;', glow='rgba(255,190,90,.8)')
                + '<div style="position:absolute;left:14px;top:14px;display:flex;flex-direction:column;gap:2px;"><span style="font-size:12px;font-weight:700;color:#e8eefc;">CẤP</span><span style="font-size:44px;font-weight:800;line-height:.9;">34</span></div>'
                + '<div style="position:absolute;right:14px;top:14px;padding:6px 12px;border-radius:999px;background:rgba(8,14,40,.6);box-shadow:inset 0 0 0 1px rgba(255,209,102,.6);font-size:12px;font-weight:800;color:#ffe08a;">còn 86 EXP lên cấp 35</div>'
                + '<div style="position:absolute;left:0;right:0;bottom:12px;display:flex;justify-content:center;"><div style="padding:6px 14px;border-radius:999px;background:rgba(8,14,40,.66);font-size:13px;font-weight:700;">Lửa Nhỏ đang rất vui — em giữ chuỗi 5 ngày rồi</div></div></div>')
    # chuyến thám hiểm hôm nay
    ai = lambda t, s, c: f'<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;"><div style="width:40px;height:40px;border-radius:50%;background:{c};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#0b1230;">{s}</div><span style="font-size:10px;font-weight:700;color:#dfe8ff;text-align:center;line-height:1.2;">{t}</span></div>'
    hanh_trinh = ('<div style="position:relative;overflow:hidden;display:flex;flex-direction:column;gap:12px;padding:18px;border-radius:28px;background:linear-gradient(135deg,#3f6bff,#6a3ff0 55%,#a23bd6);box-shadow:0 14px 34px rgba(90,70,240,.5),inset 0 0 0 1px rgba(255,255,255,.25);">'
                  '<div style="display:flex;align-items:center;justify-content:space-between;"><span style="padding:4px 10px;border-radius:999px;background:#fff;color:#4a2fd0;font-size:11px;font-weight:800;letter-spacing:.06em;">CHUYẾN THÁM HIỂM HÔM NAY</span><span style="font-size:12px;color:rgba(255,255,255,.85);">6 ải · 6–8 phút</span></div>'
                  f'<div style="display:flex;align-items:flex-start;">{ai("Sửa lỗi","2","#ffb27a")}{ai("Ký ức","1","#7fe9ff")}{ai("Luyện đều","2","#c4eed0")}{ai("Trùm ải","1","#ffd166")}</div>'
                  '<div style="font-size:13px;line-height:1.5;color:rgba(255,255,255,.92);">Hôm nay: <b>2 câu Ester</b> em hay sai · <b>1 câu tới hạn ôn</b> · 1 câu khó hơn sức em một bậc để đánh Trùm ải.</div>'
                  + cta('LÊN ĐƯỜNG', 'DaoThamHiem.dc.html') + '</div>')
    # 3 mục tiêu ngắn
    def mt(icon, t, s, pct, c):
        return (f'<div style="display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:14px;background:{c};display:flex;align-items:center;justify-content:center;flex-shrink:0;">{icon}</div>'
                f'<div style="flex-grow:1;display:flex;flex-direction:column;gap:5px;"><div style="display:flex;justify-content:space-between;font-size:13px;"><b>{t}</b><span style="color:#c9d6f2;">{s}</span></div><div style="height:6px;border-radius:999px;background:rgba(255,255,255,.14);overflow:hidden;"><div style="width:{pct}%;height:100%;border-radius:999px;background:{c};"></div></div></div></div>')
    i1 = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0b1230" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>'
    i2 = '<svg viewBox="0 0 24 24" width="20" height="20" fill="#0b1230"><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z"/></svg>'
    i3 = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#0b1230" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3 8 3z"/></svg>'
    muc_tieu = glass(f'<div style="display:flex;flex-direction:column;gap:14px;padding:16px;">{label("MỤC TIÊU GẦN NHẤT")}{mt(i1,"Lên cấp 35","còn 86 EXP",64,"#ffd166")}{mt(i2,"Thành thạo dạng Ester thuỷ phân","2/3 sao",66,"#7fe9ff")}{mt(i3,"Rèn khiên","8/12 mảnh",66,"#ffb27a")}</div>')
    # tiến hoá
    HOI = '<span style="font-size:20px;font-weight:800;color:#5d6a94;">?</span>'
    def o_dang(i, c):
        nen = "radial-gradient(circle,rgba(255,190,90,.5),rgba(10,16,40,.9) 75%)" if i <= 2 else "rgba(255,255,255,.08)"
        vien = "box-shadow:0 0 0 2px #ffd166;" if i == 2 else ""
        trong = f'<img src="pets/lua-tien-hoa-{i+1}.png" alt="" style="width:40px;height:40px;object-fit:contain;">' if i <= 2 else HOI
        mau = "#ffd166" if i == 2 else "#9fb2d9"
        return (f'<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;"><div style="width:48px;height:48px;border-radius:50%;background:{nen};display:flex;align-items:center;justify-content:center;{vien}">{trong}</div>'
                f'<span style="font-size:10px;font-weight:700;color:{mau};">cấp {c}</span></div>')
    dang = ''.join(o_dang(i, c) for i, c in enumerate([1, 10, 30, 50, 70, 100]))
    tien_hoa = glass(f'<div style="display:flex;flex-direction:column;gap:12px;padding:16px;"><div style="display:flex;justify-content:space-between;align-items:baseline;">{label("ĐƯỜNG TIẾN HOÁ")}<span style="font-size:12px;color:#ffd166;font-weight:700;">16 cấp nữa tới dạng 4</span></div><div style="display:flex;">{dang}</div></div>')
    nav = ('<div style="position:absolute;left:12px;right:12px;bottom:14px;height:68px;border-radius:34px;background:rgba(14,20,52,.92);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 -6px 22px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:space-around;">'
           + ''.join(f'<div style="display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;font-weight:{800 if on else 600};color:{"#ffd166" if on else "#9fb2d9"};"><div style="width:52px;height:30px;border-radius:15px;background:{"rgba(255,209,102,.18)" if on else "transparent"};display:flex;align-items:center;justify-content:center;">{ic}</div>{t}</div>' for t, on, ic in [
               ('Đảo', True, '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3 3 10v11h6v-6h6v6h6V10z"/></svg>'),
               ('Đoàn', False, '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>'),
               ('Sổ tay', False, '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>'),
               ('Túi đồ', False, '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 0 1-8 0"/></svg>')]) + '</div>')
    body = stars(30, 390, H, 12) + f'<div style="position:relative;display:flex;flex-direction:column;gap:14px;padding:50px 16px 124px;box-sizing:border-box;">{dau}{dao_html}{hanh_trinh}{muc_tieu}{tien_hoa}</div>' + nav
    return khung(H, body), H

# ───────── 3. THÁM HIỂM: bản đồ 6 ải + trận CUỒNG NỘ ─────────
def tham_hiem():
    H = 844
    # bản đồ mini trên cùng
    diem = [(28, 'x', '#7dffb0'), (88, 'x', '#7dffb0'), (148, 'x', '#7dffb0'), (208, 'o', '#fff'), (268, '.', 'rgba(255,255,255,.3)'), (328, 'B', '#ffd166')]
    ban_do = ('<div style="position:relative;height:54px;"><div style="position:absolute;left:28px;right:28px;top:20px;height:4px;border-radius:999px;background:rgba(255,255,255,.16);"></div><div style="position:absolute;left:28px;top:20px;width:180px;height:4px;border-radius:999px;background:linear-gradient(90deg,#7dffb0,#fff);"></div>'
              + ''.join((f'<div style="position:absolute;left:{x-13}px;top:9px;width:26px;height:26px;border-radius:{"8px" if k=="B" else "50%"};{"transform:rotate(45deg);" if k=="B" else ""}background:{c};{"box-shadow:0 0 14px #fff;" if k=="o" else ""}"></div>') for x, k, c in diem)
              + '<div style="position:absolute;left:0;right:0;top:40px;display:flex;justify-content:space-between;padding:0 4px;font-size:10px;font-weight:700;color:#9fb2d9;"><span>Sửa lỗi</span><span></span><span>Ký ức</span><span style="color:#fff;">Luyện đều</span><span></span><span style="color:#ffd166;">Trùm ải</span></div></div>')
    san = ('<div style="position:relative;height:268px;border-radius:28px;overflow:hidden;background:radial-gradient(100% 90% at 30% 40%,#7a2a10 0%,#3a1430 50%,#0d0828 100%);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 14px 30px rgba(0,0,0,.45);">'
           '<div style="position:absolute;left:-40px;top:-30px;width:330px;height:330px;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,170,60,.3) 0deg 4deg,rgba(255,170,60,0) 4deg 12deg);-webkit-mask-image:radial-gradient(circle,#000 20%,rgba(0,0,0,0) 66%);mask-image:radial-gradient(circle,#000 20%,rgba(0,0,0,0) 66%);animation:lt-spin 30s linear infinite;"></div>'
           '<div style="position:absolute;left:6px;top:24px;width:214px;height:214px;border-radius:24px;overflow:hidden;box-shadow:0 0 0 3px #ffb84d,0 0 40px rgba(255,140,40,.8);transform:rotate(-3deg);"><img src="the/viem-su-no.jpg" alt="" style="width:100%;height:100%;object-fit:cover;object-position:50% 42%;"></div>'
           '<div style="position:absolute;left:14px;top:12px;padding:5px 12px;border-radius:999px;background:linear-gradient(90deg,#ff5a2a,#ffc53d);font-size:12px;font-weight:800;letter-spacing:.08em;color:#2a1200;box-shadow:0 0 18px rgba(255,140,40,.9);">CUỒNG NỘ ×2 · 3 câu đúng liền</div>'
           f'<div style="position:absolute;right:14px;top:74px;animation:lt-hit .5s linear infinite;">{slime(104)}</div>'
           '<div style="position:absolute;right:16px;top:58px;width:100px;height:8px;border-radius:999px;background:rgba(0,0,0,.5);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);"><div style="width:38%;height:100%;background:linear-gradient(90deg,#ff3d3d,#ffb84d);"></div></div>'
           f'<div style="position:absolute;right:30px;top:150px;animation:lt-pop 1.8s ease-out infinite;">{gold_text("−34", 34)}</div>'
           '<div style="position:absolute;right:14px;top:34px;font-size:11px;font-weight:700;color:#e6ff7a;">Quái Sương Mù · 38/100</div>'
           '<div style="position:absolute;left:14px;bottom:12px;display:flex;align-items:center;gap:8px;"><div style="width:120px;height:8px;border-radius:999px;background:rgba(0,0,0,.5);overflow:hidden;"><div style="width:82%;height:100%;background:linear-gradient(90deg,#7dffb0,#7fe9ff);"></div></div><span style="font-size:11px;font-weight:700;">Lửa Nhỏ 82</span></div></div>')
    def opt(k, t, sel=False):
        if sel: return f'<div style="display:flex;align-items:center;gap:10px;min-height:48px;padding:0 12px;border-radius:14px;background:#c4eed0;box-shadow:inset 0 0 0 2px #146c2e;"><span style="width:26px;height:26px;border-radius:50%;background:#146c2e;color:#fff;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{k}</span><span style="font-size:14px;font-weight:700;color:#0f5223;">{t}</span></div>'
        return f'<div style="display:flex;align-items:center;gap:10px;min-height:48px;padding:0 12px;border-radius:14px;background:#fff;box-shadow:inset 0 0 0 1px #d9d2c0;"><span style="width:26px;height:26px;border-radius:50%;box-shadow:inset 0 0 0 1.5px #8a8f98;color:#3c4046;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">{k}</span><span style="font-size:14px;color:#22262b;">{t}</span></div>'
    cau = ('<div style="display:flex;flex-direction:column;gap:10px;padding:14px;border-radius:24px;background:#f7f2e7;color:#22262b;box-shadow:0 12px 26px rgba(0,0,0,.35);">'
           '<div style="display:flex;align-items:center;gap:8px;"><span style="padding:3px 10px;border-radius:999px;background:#0b57d0;color:#fff;font-size:11px;font-weight:800;">ẢI 4 · LUYỆN ĐỀU</span><span style="font-size:12px;color:#5b6168;">Ancol · oxi hoá</span></div>'
           '<div style="font-size:15px;line-height:1.5;">Oxi hoá ethanol bằng CuO, đun nóng, thu được chất hữu cơ X. X là</div>'
           f'<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;">{opt("A","CH₃COOH")}{opt("B","CH₃CHO",True)}{opt("C","HCHO")}{opt("D","C₂H₄")}</div></div>')
    thuong = ('<div style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:20px;background:linear-gradient(90deg,rgba(125,255,176,.2),rgba(125,255,176,.06));box-shadow:inset 0 0 0 1px rgba(125,255,176,.5);">'
              '<div style="width:44px;height:44px;border-radius:50%;background:#7dffb0;color:#0a4a22;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;flex-shrink:0;">+40</div>'
              '<div style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:14px;font-weight:800;">Đúng lại sau 1 ngày — sao thứ 2 của dạng này</span><span style="font-size:12px;color:#c9d6f2;">Làm đúng lần nữa sau 7 ngày là THÀNH THẠO (+40)</span></div></div>')
    nut = ('<a href="DaoSoTay.dc.html" style="position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;height:54px;border-radius:27px;background:linear-gradient(180deg,#5b8cff,#2f5bd0);color:#fff;font-size:16px;font-weight:800;text-decoration:none;box-shadow:0 8px 20px rgba(47,91,208,.55),inset 0 2px 0 rgba(255,255,255,.35);">' + shine() + '<span style="position:relative;">Xem lời giải · sang ải 5</span></a>')
    body = f'<div style="position:relative;display:flex;flex-direction:column;gap:10px;padding:48px 16px 18px;box-sizing:border-box;">{ban_do}{san}{cau}{thuong}{nut}</div>'
    return khung(H, body), H

# ───────── 4. SỔ TAY DẠNG BÀI ─────────
def so_tay():
    H = 1000
    def sao(n): return ''.join(f'<svg viewBox="0 0 24 24" width="14" height="14" fill="{"#ffd166" if i<n else "rgba(255,255,255,.2)"}"><path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z"/></svg>' for i in range(3))
    def o(t, n, mau, khoa=False):
        if khoa: return f'<div style="display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:18px;background:rgba(255,255,255,.05);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);min-height:84px;"><span style="font-size:12px;font-weight:700;color:#5d6a94;">???</span><span style="font-size:11px;color:#5d6a94;">gặp dạng này trong bài là mở</span></div>'
        return f'<div style="display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:18px;background:{mau};box-shadow:inset 0 0 0 1px rgba(255,255,255,.16);min-height:84px;"><span style="font-size:13px;font-weight:700;line-height:1.25;">{t}</span><span style="display:flex;gap:2px;margin-top:auto;">{sao(n)}</span></div>'
    vang, xanh, cam = 'linear-gradient(160deg,rgba(255,209,102,.34),rgba(255,209,102,.1))', 'linear-gradient(160deg,rgba(127,233,255,.28),rgba(127,233,255,.08))', 'linear-gradient(160deg,rgba(255,154,118,.3),rgba(255,154,118,.08))'
    chuong = lambda ten, xong, tong, luoi: glass(f'<div style="display:flex;flex-direction:column;gap:12px;padding:16px;"><div style="display:flex;justify-content:space-between;align-items:baseline;"><span style="font-size:16px;font-weight:800;">{ten}</span><span style="font-size:12px;color:#ffd166;font-weight:700;">{xong}/{tong} dạng thành thạo</span></div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;">{luoi}</div></div>')
    body = (stars(24, 390, H, 21)
            + '<div style="position:relative;display:flex;flex-direction:column;gap:14px;padding:50px 16px 28px;box-sizing:border-box;">'
            '<div style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:12px;font-weight:800;letter-spacing:.24em;color:#a8c7fa;">SỔ TAY DẠNG BÀI</span><span style="font-size:26px;font-weight:800;">Em đã thành thạo 7/42 dạng</span><span style="font-size:13px;color:#c9d6f2;">Mỗi dạng 3 sao: đúng lần đầu · đúng lại sau 1 ngày · đúng lại sau 7 ngày</span></div>'
            + '<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:24px;background:linear-gradient(135deg,rgba(255,154,118,.3),rgba(255,154,118,.08));box-shadow:inset 0 0 0 1px rgba(255,154,118,.5);"><div style="width:52px;height:52px;border-radius:50%;background:#ff9a76;color:#3a1200;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;flex-shrink:0;">3</div><div style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:15px;font-weight:800;">3 dạng đang yếu — sửa là lên sao nhanh nhất</span><span style="font-size:12px;color:#ffd0bd;">Chuyến thám hiểm mai sẽ có 2 câu của các dạng này</span></div></div>'
            + chuong('Chương 1 · Ester – Lipid', 2, 6, o('Tên gọi ester', 3, vang) + o('Thuỷ phân ester', 2, xanh) + o('Đốt cháy ester', 1, cam) + o('Xà phòng hoá', 3, vang) + o('Chất béo', 0, cam) + o('', 0, '', True))
            + chuong('Chương 2 · Carbohydrate', 1, 5, o('Glucose tráng bạc', 3, vang) + o('Lên men', 2, xanh) + o('Tinh bột', 1, xanh) + o('', 0, '', True) + o('', 0, '', True))
            + '<div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:24px;background:rgba(255,209,102,.12);box-shadow:inset 0 0 0 1px rgba(255,209,102,.4);"><div style="animation:lt-glow 2.4s ease-in-out infinite;">' + chest(50) + '</div><div style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:14px;font-weight:800;">Thành thạo trọn Chương 1 → mở trang phục "Hoả Diệm" cho Lửa Nhỏ</span><span style="font-size:12px;color:#c9d6f2;">còn 4 dạng</span></div></div></div>')
    return khung(H, body), H

BOARDS = [('DaoChonThu', 'Đảo thần thú — chọn bạn đồng hành', chon), ('DaoNha', 'Đảo thần thú — hòn đảo của em', dao), ('DaoThamHiem', 'Đảo thần thú — chuyến thám hiểm 6 ải', tham_hiem), ('DaoSoTay', 'Đảo thần thú — sổ tay dạng bài', so_tay)]
TPL = open(os.path.join(P, 'GameSanh.dc.html'), encoding='utf-8').read()
dau = TPL.split('<x-dc>')[0]; helmet = TPL.split('<helmet>')[1].split('</helmet>')[0]
sizes = {}; prev = []
for name, title, fn in BOARDS:
    body, H = fn(); sizes[name] = H
    html = (dau.replace(dau[dau.find('<title>'):dau.find('</title>') + 8], f'<title>{title}</title>') + '<x-dc>\n<helmet>' + helmet + '</helmet>\n' + body + '\n</x-dc>\n'
            + '<script type="text/x-dc" data-dc-script data-props=\'{"$preview":{"width":390,"height":' + str(H) + '}}\'>\nclass Component extends DCLogic {\n  renderVals() { return {}; }\n}\n</script>\n</body>\n</html>\n')
    open(os.path.join(P, name + '.dc.html'), 'w', encoding='utf-8').write(html)
    prev.append(f'<div style="flex-shrink:0">{body}</div>')
open(os.path.join(P, 'preview-dao.html'), 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>' + CSS + 'body{background:#222;display:flex;gap:24px;padding:24px;align-items:flex-start}</style></head><body>' + ''.join(prev) + '</body></html>')
print(sizes)
