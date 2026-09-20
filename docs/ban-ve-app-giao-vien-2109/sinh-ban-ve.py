# Sinh 3 artboard app GIÁO VIÊN (Material 3, 1440×900) + preview.
import os
D = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(D, 'project')
LOGO = open(os.path.join(D, '..', 'logo', 'out', 'logo-gv.svg'), encoding='utf-8').read().replace('width="512" height="512"', 'width="40" height="40"', 1)
F = "'Be Vietnam Pro',system-ui,sans-serif"
# bảng màu M3 đã chốt (sáng)
PRI, PRIC, ONPRIC = '#0b57d0', '#d3e3fd', '#041e49'
SEC, TER, ONTER = '#c2e7ff', '#c4eed0', '#0f5223'
ERR, ONERR = '#f9dedc', '#8c1d18'
WARN, ONWARN = '#fef7e0', '#5c4400'
SUR, SC, SCH = '#fdfbff', '#f0f4f9', '#e9eef6'
TXT, SUB, LINE = '#1f1f1f', '#444746', '#c4c7c5'

def ic(d, s=22, c='currentColor', fill=False):
    a = f'fill="{c}"' if fill else f'fill="none" stroke="{c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
    return f'<svg viewBox="0 0 24 24" width="{s}" height="{s}" {a}>{d}</svg>'
I = dict(
 nay='<path d="M3 12 12 4l9 8"/><path d="M5 10v10h14V10"/>', hs='<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
 ca='<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/>', de='<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
 btvn='<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>', bang='<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
 hoi='<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', cai='<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
 tim='<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>', them='<path d="M12 5v14M5 12h14"/>', canh='<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
 len='<path d="m18 15-6-6-6 6"/>', phai='<path d="m9 18 6-6-6-6"/>', tich='<path d="M20 6 9 17l-5-5"/>', khoa='<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 lua='<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>', choi='<path d="M8 5v14l11-7z"/>')

MUC = [('nay', 'Hôm nay'), ('hs', 'Học sinh'), ('ca', 'Ca thi'), ('de', 'Ngân hàng đề'), ('btvn', 'Bài tập về nhà'), ('bang', 'Gọi lên bảng'), ('hoi', 'Học sinh hỏi')]
def vo(chon, tieu_de, phu, noi_dung, nut=''):
    HUY = f'<span style="margin-left:auto;min-width:24px;height:24px;border-radius:12px;background:{PRI};color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;">4</span>'
    def muc(k, t):
        kieu = f'background:{PRIC};color:{ONPRIC};font-weight:700;' if k == chon else f'color:{SUB};font-weight:500;'
        return f'<div style="display:flex;align-items:center;gap:14px;height:52px;padding:0 18px;border-radius:26px;{kieu}font-size:15px;">{ic(I[k])}<span>{t}</span>{HUY if k == "hoi" else ""}</div>'
    nav = ''.join(muc(k, t) for k, t in MUC)
    return (f'<div style="width:1440px;height:900px;display:grid;grid-template-columns:264px 1fr;background:{SC};color:{TXT};font-family:{F};overflow:hidden;">'
            f'<div style="display:flex;flex-direction:column;gap:6px;padding:20px 14px;">'
            f'<div style="display:flex;align-items:center;gap:12px;padding:4px 10px 18px;">{LOGO}<div style="display:flex;flex-direction:column;line-height:1.15"><span style="font-size:16px;font-weight:800;">ĐỖ ĐẠI HỌC</span><span style="font-family:Didot,Georgia,serif;font-style:italic;font-size:12px;color:{SUB};">6,022 · 10²³</span></div></div>'
            f'<div style="display:flex;align-items:center;gap:10px;height:56px;padding:0 20px;margin-bottom:10px;border-radius:18px;background:{PRI};color:#fff;font-size:15px;font-weight:700;box-shadow:0 2px 6px rgba(11,87,208,.35);">{ic(I["them"])}Mở ca kiểm tra</div>'
            f'{nav}<div style="margin-top:auto;display:flex;align-items:center;gap:14px;height:52px;padding:0 18px;color:{SUB};font-size:15px;">{ic(I["cai"])}Cài đặt</div></div>'
            f'<div style="margin:12px 12px 12px 0;border-radius:28px;background:{SUR};display:flex;flex-direction:column;overflow:hidden;">'
            f'<div style="display:flex;align-items:center;gap:16px;padding:22px 32px 14px;"><div style="display:flex;flex-direction:column;gap:2px;"><span style="font-size:28px;font-weight:800;letter-spacing:-.01em;">{tieu_de}</span><span style="font-size:14px;color:{SUB};">{phu}</span></div>'
            f'<div style="margin-left:auto;display:flex;align-items:center;gap:10px;"><div style="display:flex;align-items:center;gap:10px;width:300px;height:48px;padding:0 18px;border-radius:24px;background:{SCH};color:{SUB};font-size:14px;">{ic(I["tim"],20)}Tìm học sinh, ca thi, mã đề…</div>{nut}</div></div>'
            f'<div style="flex:1;padding:6px 32px 28px;overflow:hidden;">{noi_dung}</div></div></div>')

def the(noi, bg='#fff', them=''): return f'<div style="border-radius:24px;background:{bg};padding:20px;{("box-shadow:inset 0 0 0 1px #e1e3e1;" if bg=="#fff" else "")}{them}">{noi}</div>'
def chip(t, bg, fg): return f'<span style="display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border-radius:14px;background:{bg};color:{fg};font-size:12px;font-weight:700;white-space:nowrap;">{t}</span>'
def nut(t, kieu='tonal', icon=''):
    st = {'chinh': f'background:{PRI};color:#fff;', 'tonal': f'background:{SEC};color:#004a77;', 'vien': f'box-shadow:inset 0 0 0 1px {LINE};color:{PRI};'}[kieu]
    return f'<span style="display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 20px;border-radius:20px;font-size:14px;font-weight:700;white-space:nowrap;{st}">{icon}{t}</span>'
def nhan(t): return f'<div style="font-size:12px;font-weight:800;letter-spacing:.1em;color:{SUB};">{t}</div>'

# ───────── 1. HÔM NAY ─────────
def hom_nay():
    def so(n, t, p, bg, fg): return the(f'<div style="display:flex;flex-direction:column;gap:6px;"><span style="font-size:13px;font-weight:700;color:{fg};">{t}</span><span style="font-size:38px;font-weight:800;line-height:1;color:{fg};">{n}</span><span style="font-size:13px;color:{fg};opacity:.85;">{p}</span></div>', bg)
    hang_so = (f'<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;">'
               + so('142<span style="font-size:20px;">/261</span>', 'ĐẠT NHIỆM VỤ HÔM NAY', '54% · hôm qua 49%', TER, ONTER)
               + so('86%', 'BTVN ĐÚNG NHỊP', '3 bài đang chạy · lô hôm nay', PRIC, ONPRIC)
               + so('1.179', 'CÂU TỚI HẠN ÔN', 'cả trường · 939 mở được', SEC, '#004a77')
               + so('17', 'EM CẦN THẦY ĐỂ Ý', 'trễ nhịp ≥ 3 ngày hoặc tụt bậc', ERR, ONERR) + '</div>')
    def dong(ten, lop, vi_sao, mau, fg, hanh):
        return (f'<div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-top:1px solid #eceeed;"><div style="width:40px;height:40px;border-radius:50%;background:{mau};color:{fg};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;flex-shrink:0;">{ten[0]}</div>'
                f'<div style="flex:1;display:flex;flex-direction:column;gap:2px;"><span style="font-size:15px;font-weight:700;">{ten} <span style="font-weight:500;color:{SUB};font-size:13px;">· {lop}</span></span><span style="font-size:13px;color:{SUB};">{vi_sao}</span></div>{hanh}</div>')
    chu_y = the(f'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">{nhan("CẦN THẦY ĐỂ Ý HÔM NAY")}<span style="font-size:13px;color:{PRI};font-weight:700;">Xem cả 17 em</span></div>'
                + dong('Nguyễn Minh Khôi', '12A1', 'Trễ nhịp BTVN 4 ngày · còn 22 câu, hạn thứ Sáu — máy đã dồn 8 câu/ngày', ERR, ONERR, nut('Nhắn phụ huynh', 'vien'))
                + dong('Trần Thu Hà', '12A1', 'Dạng "Oxi hoá ancol" sai 4/5 lần · 6 câu cần dạy lại', WARN, ONWARN, nut('Đưa vào buổi chữa', 'tonal'))
                + dong('Lê Hoàng Nam', '12A2', 'Tụt bậc 5 câu trong 3 ngày (trả lời dưới 8 giây/câu)', WARN, ONWARN, nut('Xem hồ sơ', 'vien'))
                + dong('Phạm Gia Bảo', '12A2', 'Chuỗi 14 ngày đạt · vừa hết yếu dạng Ester', TER, ONTER, nut('Khen trước lớp', 'tonal')))
    def bt(ten, lop, lo, pct, han):
        o = ''.join(f'<span style="flex:1;height:8px;border-radius:4px;background:{PRI if i < lo else SCH};"></span>' for i in range(5))
        return (f'<div style="display:grid;grid-template-columns:1.6fr 1.3fr 90px 110px;align-items:center;gap:14px;padding:12px 0;border-top:1px solid #eceeed;font-size:14px;"><span style="font-weight:700;">{ten} <span style="font-weight:500;color:{SUB};">· {lop}</span></span>'
                f'<div style="display:flex;gap:4px;align-items:center;">{o}<span style="font-size:12px;color:{SUB};margin-left:6px;white-space:nowrap;">lô {lo}/5</span></div><span style="font-weight:700;color:{ONTER};">{pct}% kịp</span><span style="color:{SUB};text-align:right;">{han}</span></div>')
    btvn = the(f'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">{nhan("BÀI TẬP VỀ NHÀ ĐANG CHẠY · CHIA LÔ THEO HẠN NỘP")}<span style="font-size:13px;color:{PRI};font-weight:700;">Giao bài mới</span></div>'
               + bt('Chương 1 · Ester – Lipid', '12A1', 3, 88, 'hạn thứ Sáu') + bt('Ôn giữa kỳ · 40 câu', '12A2', 2, 81, 'hạn Chủ nhật') + bt('Carbohydrate · cơ bản', '11B1', 4, 92, 'hạn thứ Tư'))
    def thanh(t, pct, n): return f'<div style="display:flex;align-items:center;gap:12px;"><span style="width:190px;font-size:14px;">{t}</span><div style="flex:1;height:10px;border-radius:5px;background:{SCH};overflow:hidden;"><div style="width:{pct}%;height:100%;border-radius:5px;background:#d9480f;"></div></div><span style="width:74px;text-align:right;font-size:13px;color:{SUB};">{n}</span></div>'
    yeu = the(f'{nhan("DẠNG CẢ LỚP 12A1 ĐANG YẾU")}<div style="display:flex;flex-direction:column;gap:12px;margin-top:14px;">{thanh("Oxi hoá ancol", 62, "21/34 em")}{thanh("Thuỷ phân ester", 47, "16/34 em")}{thanh("Glucose tráng bạc", 35, "12/34 em")}</div>'
              f'<div style="display:flex;gap:10px;margin-top:16px;">{nut("Giao BTVN theo 3 dạng này", "chinh")}{nut("Rút đề kiểm tra", "vien")}</div>')
    buoi = the(f'<div style="display:flex;justify-content:space-between;align-items:center;">{nhan("BUỔI CHỮA TỐI NAY · 12A1")}{chip("90 phút", "#fff", ONPRIC)}</div>'
               f'<div style="font-size:22px;font-weight:800;margin-top:10px;color:{ONPRIC};">21 em lên bảng · 24 câu</div><div style="font-size:14px;color:{ONPRIC};opacity:.85;margin-top:4px;line-height:1.5;">Thời gian tính theo độ khó × độ dài × từng em. 3 câu dài sẽ chiếm cả bảng — thầy chuẩn bị bảng phụ.</div>'
               f'<div style="display:flex;gap:10px;margin-top:16px;">{nut("Mở buổi chữa", "chinh", ic(I["choi"],18,"#fff",True))}{nut("Tiếp tục buổi trước · còn 6 câu", "vien")}</div>', PRIC)
    game = the(f'{nhan("ĐOÀN HỘ TỐNG · 12A1")}<div style="display:flex;align-items:center;gap:14px;margin-top:12px;"><div style="width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 38% 32%,#fff,#c8f6ff 30%,#5fd0ff 60%,#2a6bd6);box-shadow:0 0 18px rgba(95,208,255,.8);flex-shrink:0;"></div><div style="flex:1;"><div style="font-size:15px;font-weight:700;">Trạm 17/30 · hôm nay 9/34 bạn góp sức</div><div style="height:8px;border-radius:4px;background:{SCH};margin-top:8px;overflow:hidden;"><div style="width:56%;height:100%;background:linear-gradient(90deg,#34c26a,#5fd0ff);"></div></div></div></div>'
               f'<div style="font-size:13px;color:{SUB};margin-top:10px;">Người tiếp sức của tuần: <b style="color:{TXT};">Thu Hà</b> (giúp 7 lượt, 6 lượt bạn làm lại đúng)</div>')
    nd = (f'<div style="display:flex;flex-direction:column;gap:16px;">{hang_so}<div style="display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px;">'
          f'<div style="display:flex;flex-direction:column;gap:16px;">{chu_y}{btvn}</div><div style="display:flex;flex-direction:column;gap:16px;">{buoi}{yeu}{game}</div></div></div>')
    return vo('nay', 'Chào thầy Học', 'Thứ Hai, 21/09 · 261 học sinh · 8 lớp', nd, chip('Không có ca nào đang mở', TER, ONTER))

# ───────── 2. CA THI ─────────
def ca_thi():
    tabs = ''.join(f'<span style="height:44px;padding:0 4px;display:inline-flex;align-items:center;font-size:14px;font-weight:{700 if on else 500};color:{PRI if on else SUB};{"box-shadow:inset 0 -3px 0 "+PRI+";" if on else ""}">{t}</span>' for t, on in [('Đang làm · 22', True), ('Phòng chờ · 3', False), ('Đã nộp · 9', False), ('Chưa vào · 6', False), ('Biên bản đề riêng', False)])
    def hang(ten, sbd, tt, tien, roi, mau, fg):
        return (f'<div style="display:grid;grid-template-columns:2.2fr 1fr 1.4fr 1fr 120px;align-items:center;gap:12px;height:56px;border-top:1px solid #eceeed;font-size:14px;"><span style="font-weight:700;">{ten} <span style="color:{SUB};font-weight:500;">· {sbd}</span></span>{chip(tt, mau, fg)}'
                f'<div style="display:flex;align-items:center;gap:10px;"><div style="flex:1;height:8px;border-radius:4px;background:{SCH};overflow:hidden;"><div style="width:{tien}%;height:100%;background:{PRI};"></div></div><span style="font-size:13px;color:{SUB};width:44px;">{int(tien*0.28)}/28</span></div><span style="color:{ONERR if roi else SUB};font-weight:{700 if roi else 500};">{"rời màn "+str(roi)+" lần" if roi else "—"}</span><span style="color:{PRI};font-weight:700;text-align:right;">Chi tiết</span></div>')
    bang = the(f'<div style="display:flex;gap:28px;border-bottom:1px solid #e1e3e1;margin:-4px 0 0;">{tabs}</div>'
               f'<div style="display:grid;grid-template-columns:2.2fr 1fr 1.4fr 1fr 120px;gap:12px;height:40px;align-items:center;font-size:12px;font-weight:800;letter-spacing:.06em;color:{SUB};"><span>HỌC SINH</span><span>TRẠNG THÁI</span><span>TIẾN ĐỘ</span><span>CHỐNG GIAN LẬN</span><span></span></div>'
               + hang('Nguyễn Minh Khôi', '12121034', 'Đang làm', 64, 0, PRIC, ONPRIC) + hang('Trần Thu Hà', '12121007', 'Đang làm', 82, 0, PRIC, ONPRIC)
               + hang('Lê Hoàng Nam', '12121019', 'Bị khoá', 40, 3, ERR, ONERR) + hang('Phạm Gia Bảo', '12121002', 'Đang làm', 93, 0, PRIC, ONPRIC)
               + hang('Đỗ Khánh Linh', '12121015', 'Thi lại · đúng máy cũ', 12, 0, WARN, ONWARN) + hang('Vũ Đức Anh', '12121031', 'Đang làm', 57, 1, PRIC, ONPRIC) + hang('Hoàng Mai Chi', '12121011', 'Đang làm', 71, 0, PRIC, ONPRIC))
    de_rieng = the(f'{nhan("ĐỀ RIÊNG TỪNG EM")}<div style="font-size:20px;font-weight:800;margin-top:8px;color:{ONTER};">25 em có mặt · 15 em chuẩn bị sẵn</div>'
                   f'<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;font-size:14px;color:{ONTER};"><span>{ic(I["tich"],16)} Hỏi lại 3 câu/em từ hồ sơ · bỏ 41 câu em đã tự khắc phục</span><span>{ic(I["tich"],16)} Ưu tiên 58 câu tới hạn ôn hôm nay</span><span>{ic(I["tich"],16)} Không trùng câu em làm trong 7 ngày</span></div>', TER)
    canh = the(f'<div style="display:flex;gap:12px;align-items:flex-start;color:{ONWARN};">{ic(I["canh"],22)}<div style="display:flex;flex-direction:column;gap:4px;"><span style="font-size:15px;font-weight:700;">Kho mỏng: 4 em phải nhận lại 6 câu vừa làm trong tuần</span><span style="font-size:13px;">Thêm câu dạng "Oxi hoá ancol" vào kho ca để hết trùng.</span></div></div>', WARN)
    tg = the(f'{nhan("THỜI GIAN")}<div style="display:flex;align-items:baseline;gap:10px;margin-top:8px;"><span style="font-size:44px;font-weight:800;line-height:1;">31:46</span><span style="font-size:14px;color:{SUB};">còn lại · 50 phút</span></div>'
             f'<div style="display:flex;gap:10px;margin-top:16px;">{nut("Khoá ca", "vien", ic(I["khoa"],18))}{nut("Thêm 5 phút", "tonal")}</div>')
    nd = f'<div style="display:grid;grid-template-columns:minmax(0,2.1fr) minmax(0,1fr);gap:16px;"><div>{bang}</div><div style="display:flex;flex-direction:column;gap:16px;">{tg}{de_rieng}{canh}</div></div>'
    return vo('ca', 'Kiểm tra Chương 1 · 12A1', 'Mã ca 784 817 · đề riêng từng em · công bố khi cả lớp nộp xong', nd, chip('Đang diễn ra', PRIC, ONPRIC) + nut('Chiếu mã vào thi', 'tonal'))

# ───────── 3. HỒ SƠ HỌC SINH ─────────
def ho_so():
    def em(ten, p, on=False, mau=TER, fg=ONTER): return f'<div style="display:flex;align-items:center;gap:12px;height:60px;padding:0 14px;border-radius:18px;{"background:"+PRIC+";" if on else ""}"><div style="width:38px;height:38px;border-radius:50%;background:{mau};color:{fg};display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0;">{ten[0]}</div><div style="display:flex;flex-direction:column;line-height:1.25;"><span style="font-size:14px;font-weight:700;">{ten}</span><span style="font-size:12px;color:{SUB};">{p}</span></div></div>'
    ds = the(f'<div style="display:flex;gap:8px;margin-bottom:10px;">{chip("12A1 · 34 em", PRIC, ONPRIC)}{chip("Cần để ý · 6", ERR, ONERR)}{chip("Tất cả lớp", SCH, SUB)}</div>'
             + em('Trần Thu Hà', 'đạt 5 ngày liền · 6 câu cần dạy lại', True, WARN, ONWARN) + em('Nguyễn Minh Khôi', 'trễ nhịp 4 ngày', False, ERR, ONERR) + em('Phạm Gia Bảo', 'chuỗi 14 ngày')
             + em('Lê Hoàng Nam', 'tụt bậc 5 câu', False, WARN, ONWARN) + em('Đỗ Khánh Linh', 'đạt hôm nay') + em('Vũ Đức Anh', 'đạt hôm nay') + em('Hoàng Mai Chi', 'chưa làm hôm nay', False, SCH, SUB) + em('Bùi Quang Huy', 'đạt hôm nay'), '#fff', 'padding:16px;')
    def dg(t, pct, n, c): return f'<div style="display:flex;align-items:center;gap:12px;"><span style="width:170px;font-size:14px;">{t}</span><div style="flex:1;height:10px;border-radius:5px;background:{SCH};overflow:hidden;"><div style="width:{pct}%;height:100%;border-radius:5px;background:{c};"></div></div><span style="width:96px;text-align:right;font-size:13px;color:{SUB};">{n}</span></div>'
    manh_yeu = the(f'{nhan("MẠNH · YẾU THEO DẠNG (từ bài đã làm, không suy từ điểm)")}<div style="display:flex;flex-direction:column;gap:12px;margin-top:14px;">{dg("Oxi hoá ancol", 20, "1/5 đúng · yếu", "#d9480f")}{dg("Thuỷ phân ester", 50, "3/6 đúng · yếu", "#e08a00")}{dg("Tên gọi ester", 100, "6/6 đúng", "#188a42")}{dg("Xà phòng hoá", 86, "6/7 đúng", "#188a42")}{dg("Glucose tráng bạc", 75, "3/4 đúng", "#188a42")}</div>')
    on = the(f'{nhan("LỊCH ÔN 1 · 3 · 7 NGÀY")}<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:12px;">'
             + ''.join(f'<div style="border-radius:16px;background:{bg};padding:12px;"><div style="font-size:26px;font-weight:800;color:{fg};line-height:1;">{n}</div><div style="font-size:12px;color:{fg};margin-top:4px;">{t}</div></div>' for n, t, bg, fg in [('6', 'mới sai', ERR, ONERR), ('11', 'đang ôn', WARN, ONWARN), ('4', 'tới hạn hôm nay', PRIC, ONPRIC), ('23', 'đã khắc phục', TER, ONTER)]) + '</div>')
    ke_hoach = the(f'<div style="display:flex;justify-content:space-between;align-items:center;">{nhan("KẾ HOẠCH HÔM NAY CỦA EM")}{chip("8 câu · 20 phút/ngày", "#fff", ONPRIC)}</div>'
                   f'<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;font-size:14px;color:{ONPRIC};"><span><b>1.</b> BTVN Chương 1 · lô 3/5 · 6 câu — <b>đã xong</b></span><span><b>2.</b> Ôn 4 câu tới hạn — đang làm 2/4</span><span style="opacity:.7;"><b>3.</b> Thần thú: luyện dạng Oxi hoá ancol (tuỳ chọn)</span></div>', PRIC)
    thu = the(f'{nhan("THẦN THÚ · EXP")}<div style="display:flex;align-items:center;gap:14px;margin-top:10px;"><img src="pets/thuy-long.png" alt="" style="width:64px;height:64px;object-fit:contain;"><div style="flex:1;"><div style="font-size:16px;font-weight:800;">Thuỷ Long · cấp 12</div><div style="font-size:13px;color:{SUB};">hôm nay +85 EXP · mảnh khiên 8/12 · chuỗi 5 ngày</div></div></div>')
    phai = (f'<div style="display:flex;flex-direction:column;gap:16px;"><div style="display:flex;align-items:center;gap:16px;"><div style="width:64px;height:64px;border-radius:50%;background:{WARN};color:{ONWARN};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;">H</div><div style="display:flex;flex-direction:column;"><span style="font-size:24px;font-weight:800;">Trần Thu Hà</span><span style="font-size:14px;color:{SUB};">12A1 · SBD 12121007 · phụ huynh: đã kết nối</span></div>'
            f'<div style="margin-left:auto;display:flex;gap:10px;">{nut("Giao bài riêng", "chinh")}{nut("Cho thi lại", "vien")}{nut("Nhắn phụ huynh", "vien")}</div></div>'
            f'<div style="display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:16px;"><div style="display:flex;flex-direction:column;gap:16px;">{manh_yeu}{on}</div><div style="display:flex;flex-direction:column;gap:16px;">{ke_hoach}{thu}</div></div></div>')
    nd = f'<div style="display:grid;grid-template-columns:340px minmax(0,1fr);gap:20px;height:100%;">{ds}{phai}</div>'
    return vo('hs', 'Học sinh', '261 em · 8 lớp · sắp theo "cần thầy để ý"', nd)

BOARDS = [('GvHomNay', 'App giáo viên — Hôm nay', hom_nay), ('GvCaThi', 'App giáo viên — Ca thi đang diễn ra', ca_thi), ('GvHoSo', 'App giáo viên — Hồ sơ học sinh', ho_so)]
HEAD = '<!doctype html>\n<html lang="vi">\n<head>\n<meta charset="utf-8">\n<title>__T__</title>\n<script src="./support.js"></script>\n</head>\n<body>\n<x-dc>\n<helmet>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet">\n<style>body{margin:0;font-family:\'Be Vietnam Pro\',system-ui,sans-serif}</style>\n</helmet>\n'
TAIL = '\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props=\'{"$preview":{"width":1440,"height":900}}\'>\nclass Component extends DCLogic {\n  renderVals() { return {}; }\n}\n</script>\n</body>\n</html>\n'
prev = []
for name, title, fn in BOARDS:
    body = fn()
    open(os.path.join(P, name + '.dc.html'), 'w', encoding='utf-8').write(HEAD.replace('__T__', title) + body + TAIL)
    prev.append(body)
open(os.path.join(P, 'preview-gv.html'), 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>body{margin:0;background:#222;display:flex;flex-direction:column;gap:24px;padding:24px}</style></head><body>' + ''.join(prev) + '</body></html>')
print('ok')
