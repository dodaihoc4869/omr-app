# Gợi ý 3 tầng viết RIÊNG cho từng câu (thầy 26/10: «phần gợi ý phải có ý nghĩa thực sự cho bài đó … đẹp hơn doligo»).
def span(cls, chu):
    return f'<span class="cham-duoc {cls}">{chu}</span>'

def kh(chu, sang=False):
    """cụm chữ then chốt: bình thường không tô, chỉ SÁNG khi gợi ý nói tới"""
    return f'<span class="cham-duoc d-khoa{" sang" if sang else ""}">{chu}</span>'

T1 = """<div class="tang"><span class="o-icon tin"><i data-i="book"></i></span><div>
<div class="t-ten">Đề đang nói gì <small>· gợi ý 1</small></div>
<div class="t-noi">Ester bị NaOH <b>thuỷ phân</b> khi đun nóng. Sau đó <b>cô cạn</b>: chất dễ bay hơi mất đi, phần <b>rắn</b> còn lại được cân.</div>
<div class="so-do"><span class="ct">CH<sub>3</sub>COOC<sub>2</sub>H<sub>5</sub></span><span class="mui">+</span><span class="ct">NaOH</span><span class="mui">→</span><span class="ct">CH<sub>3</sub>COONa</span><span class="mui">+</span><span class="ct">C<sub>2</sub>H<sub>5</sub>OH<span class="bay"> (bay hơi khi cô cạn)</span></span></div>
</div></div>"""
T2 = """<div class="tang"><span class="o-icon chu-y"><i data-i="target"></i></span><div>
<div class="t-ten">Chìa khoá của bài <small>· gợi ý 2</small></div>
<div class="t-noi">Chất rắn khan = <b>muối</b> + <b>NaOH còn dư</b> (nếu có). Vì vậy phải so số mol hai chất trước phản ứng: chất nào hết, chất nào dư?</div>
<div class="so-sanh"><div class="o"><small>ethyl acetate</small><b>? mol</b></div><span class="mo">so với</span><div class="o"><small>NaOH</small><b>? mol</b></div></div>
</div></div>"""
T3 = """<div class="tang"><span class="o-icon dung"><i data-i="pen"></i></span><div>
<div class="t-ten">Bước đầu tiên <small>· gợi ý 3</small></div>
<div class="phep" style="margin-top:8px">
<div><b>ethyl acetate</b><span>n = m : M = 8,8 : 88</span></div>
<div><b>NaOH</b><span>n = C<sub>M</sub> × V = 1,5 × 0,1</span><span class="chip">100 mL = 0,1 L</span></div></div>
<div class="t-noi" style="margin-top:8px">Tính xong, em so hai số rồi tự làm tiếp.</div>
</div></div>"""
GHI = '<div class="gy-ghi" style="margin-top:10px">Mỗi gợi ý viết riêng cho câu này. Xem gợi ý thì lần này tính là có trợ giúp.</div>'

def khoa(n, ten):
    return f'<div class="tang khoa"><span class="o-icon xam"><i data-i="lock"></i></span><div><div class="t-ten">{ten} <small>· gợi ý {n}</small></div></div></div>'

def nac(mo):
    return ''.join(f'<i class="{"mo" if k <= mo else ""}"></i>' for k in (1, 2, 3))

def lua_chon(ds):
    return ''.join(f'<div class="lua-chon"><b>{k}</b><span>{v}</span></div>' for k, v in ds)

def khung(de, tang, mo, nut, lc):
    return f"""<section class="the cau soi" aria-label="Câu 2">
<div class="cau-dau"><span class="chip">Phần I · Trắc nghiệm</span><span class="day"></span><span class="chip chinh"><i data-i="bulb" class="nho"></i>Đang xem gợi ý</span></div>
<p class="cau-de">{de}</p>
<div class="goi-y" aria-label="Gợi ý cho câu này">
<div class="gy-dau"><span class="h3">Bắt đầu từ đâu?</span><span class="gy-nac" role="img" aria-label="Đã mở {mo} trên 3 gợi ý">{nac(mo)}</span></div>
{tang}
<div class="gy-cuoi">{nut}<span class="nut chinh">Em tự làm tiếp</span></div>
{GHI}
</div>
<div class="lua-chon-ds">{lc}</div>
</section>
"""

def cau_goi_y(mo):
    s1, s23 = mo == 1, mo >= 2
    de = ('Thuỷ phân hoàn toàn ' + span('d-cho' + (' sang' if s23 else ''), '8,8 gam') + ' ' + span('d-chat' + (' sang' if s1 else ''), 'ethyl acetate') +
          ' bằng ' + span('d-cho' + (' sang' if s23 else ''), '100 mL') + ' dung dịch ' + span('d-chat' + (' sang' if s1 else ''), 'NaOH') + ' ' +
          span('d-cho' + (' sang' if s23 else ''), '1,5 M') + ', ' + kh('đun nóng', s1) + '. ' + kh('Cô cạn', s1) + ' dung dịch sau phản ứng, thu được m gam ' +
          kh('chất rắn khan', mo == 2) + '. ' + span('d-hoi', 'Giá trị của m là'))
    tang = T1 + (T2 if mo >= 2 else khoa(2, 'Chìa khoá của bài')) + (T3 if mo >= 3 else khoa(3, 'Bước đầu tiên'))
    nut = f'<span class="nut">Gợi ý tiếp <span class="mo" style="font-weight:500">({mo + 1}/3)</span></span>' if mo < 3 else ''
    return khung(de, tang, mo, nut, lua_chon([('A', '8,2.'), ('B', '10,2.'), ('C', '12,2.'), ('D', '14,2.')]))

def ly_thuyet_goi_y():
    de = 'Phát biểu nào sau đây ' + span('d-hoi sang', 'không đúng') + '?'
    tang = """<div class="tang"><span class="o-icon tin"><i data-i="book"></i></span><div><div class="t-ten">Đề đang nói gì <small>· gợi ý 1</small></div>
<div class="t-noi">Bốn câu đều nói về <b>khí nitrogen</b>. Ba câu đúng, <b>một câu sai</b>: em cần tìm câu sai đó.</div></div></div>
<div class="tang"><span class="o-icon chu-y"><i data-i="target"></i></span><div><div class="t-ten">Chìa khoá của bài <small>· gợi ý 2</small></div>
<div class="t-noi">Mỗi câu thuộc một mảng kiến thức. Đối chiếu từng câu với đúng mảng của nó:</div>
<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px"><span class="chip tin">Thành phần không khí</span><span class="chip tin">Tính chất vật lí của N<sub>2</sub></span><span class="chip tin">Liên kết N≡N</span></div></div></div>
<div class="tang"><span class="o-icon dung"><i data-i="ask"></i></span><div><div class="t-ten">Tự hỏi để kiểm <small>· gợi ý 3</small></div>
<div class="t-noi">Trong phòng thí nghiệm, người ta thu khí N<sub>2</sub> bằng cách <b>đẩy nước</b>. Điều đó cho em biết N<sub>2</sub> tan trong nước <b>nhiều hay ít</b>?</div></div></div>"""
    lc = lua_chon([('A', 'Nitrogen chiếm khoảng 78% thể tích không khí.'),
                   ('B', 'Ở điều kiện thường, nitrogen là chất khí không màu, không mùi.'),
                   ('C', 'Phân tử N<sub>2</sub> có liên kết ba bền nên nitrogen khá trơ ở nhiệt độ thường.'),
                   ('D', 'Nitrogen tan rất tốt trong nước.')])
    return khung(de, tang, 3, '', lc)


# ---------------- SƠ ĐỒ TỐI GIẢN + MỘT PHÉP TÍNH (phương pháp của thầy 26/10) ----------------
CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>'

def thua(t, cls):
    if '/' in t:
        tu, mau = t.split('/')
        return f'<span class="thua ps {cls}" role="button" aria-label="{tu} phần {mau}"><b>{tu}</b><i>{mau}</i></span>'
    return f'<span class="thua {cls}" role="button">{t}</span>'

def chuoi_html(thuas, dang):
    out = ['<span class="nhan">m =</span>']
    for i, (t, _, _) in enumerate(thuas):
        cls = 'dang' if i == dang else ('qua' if i < dang else 'sau')
        if i: out.append('<span class="nhan">·</span>')
        out.append(thua(t, cls))
    out.append('<span class="nhan bang-hoi">= ?</span>')
    return '<div class="chuoi" aria-label="Một phép tính">' + ''.join(out) + '</div>'

def y_nghia_html(thuas, dang):
    rows = []
    for i, (t, ten, nghia) in enumerate(thuas):
        cls = 'dang' if i == dang else ('qua' if i < dang else 'sau')
        tt = CHECK if i < dang else str(i + 1)
        rows.append(f'<div class="dong-yn {cls}"><span class="tt">{tt}</span><span class="ps-chu">{"" if i == 0 else "· "}{t}</span><span>{nghia}</span></div>')
    return '<div class="y-nghia">' + ''.join(rows) + '</div>'

def bai_chuoi(de, phan_nhan, sd, thuas, dang, bong, noi_gi, quy_uoc_on):
    quy = (f'<div class="quy-uoc"><span class="chip {"chinh" if quy_uoc_on == "xuoi" else "vien"}">Tính xuôi: × H/100</span>'
           f'<span class="chip {"chinh" if quy_uoc_on == "nguoc" else "vien"}">Tính ngược: × 100/H</span></div>')
    tang = f"""<div class="tang"><span class="o-icon tin"><i data-i="book"></i></span><div>
<div class="t-ten">Đề đang nói gì <small>· gợi ý 1</small></div><div class="t-noi">{noi_gi}</div></div></div>
<div class="tang"><span class="o-icon chu-y"><i data-i="route"></i></span><div>
<div class="t-ten">Tóm tắt của thầy Đỗ Đại Học <small>· gợi ý 2</small></div>{sd}{quy}</div></div>
<div class="tang"><span class="o-icon dung"><i data-i="pen"></i></span><div>
<div class="t-ten">Một phép tính <small>· gợi ý 3 · chạm từng số để xem đến đó là gì</small></div>
{chuoi_html(thuas, dang)}
<div class="bong-so" role="status">{bong}</div>
{y_nghia_html(thuas, dang)}
</div></div>"""
    return f"""<section class="the cau soi" aria-label="Câu 3">
<div class="cau-dau"><span class="chip">{phan_nhan}</span><span class="day"></span><span class="chip chinh"><i data-i="bulb" class="nho"></i>Đang xem gợi ý</span></div>
<p class="cau-de">{de}</p>
<div class="goi-y" aria-label="Gợi ý cho câu này">
<div class="gy-dau"><span class="h3">Bắt đầu từ đâu?</span><span class="gy-nac" role="img" aria-label="Đã mở 3 trên 3 gợi ý">{nac(3)}</span></div>
{tang}
<div class="gy-cuoi"><span class="nut chinh">Em tự bấm máy tính</span></div>
{GHI}
</div>
<div class="o-dap"><span class="nhan">Đáp số</span><span class="o-nhap" style="min-height:48px"></span></div>
</section>
"""

def so_do_xuoi():
    sang = lambda c, t: span(c + ' sang', t)
    de = ('Đốt cháy ' + sang('d-cho', '1 tấn') + ' quặng pyrite chứa ' + sang('d-cho', '8%') + ' ' + span('d-chat sang', 'FeS<sub>2</sub>') +
          ' về khối lượng (tạp chất không chứa sulfur) để sản xuất ' + span('d-chat sang', 'SO<sub>2</sub>') + ', ' + kh('hiệu suất', True) + ' quá trình đạt ' +
          sang('d-cho', '90%') + '. Khối lượng SO<sub>2</sub> thu được là m kg. ' + span('d-hoi', 'Giá trị của m là'))
    sd = """<div class="sd"><div class="dau"><span class="goc">1 tấn</span><span class="ct">FeS<sub>2</sub></span><span class="so-nho">8%</span></div>
<div class="mui-dai"><span class="mui-nhan">H = 90%</span><span class="mui-duoi">bảo toàn S</span></div>
<div class="cuoi"><span class="ct">2 SO<sub>2</sub></span><span class="hoi">m kg</span></div></div>"""
    thuas = [('10⁶', '', '1 tấn quặng = 10⁶ gam'),
             ('8/100', '', '<b>gam FeS<sub>2</sub></b> (quặng chứa 8%)'),
             ('1/120', '', '<b>mol FeS<sub>2</sub></b> (chia M = 120)'),
             ('2', '', '<b>mol SO<sub>2</sub></b> (bảo toàn S: 1 FeS<sub>2</sub> có 2 S ⇒ 2 SO<sub>2</sub>)'),
             ('64', '', '<b>gam SO<sub>2</sub></b> theo lí thuyết (nhân M = 64)'),
             ('90/100', '', '<b>gam SO<sub>2</sub> thực tế</b> (tính xuôi: × H/100)'),
             ('1/1000', '', '<b>kg SO<sub>2</sub></b> (đề hỏi theo kg)')]
    bong = 'Em đang chạm <b>2</b>. Từ đầu tới đây: <b>10⁶ · 8/100 · 1/120 · 2</b> = <b>số mol SO<sub>2</sub></b>, vì mỗi FeS<sub>2</sub> có 2 nguyên tử S, toàn bộ S chuyển vào SO<sub>2</sub>.'
    noi = 'Lấy phần FeS<sub>2</sub> trong quặng, đốt ra SO<sub>2</sub>. Chỉ cần theo dấu <b>nguyên tố S</b> từ đầu đến cuối: không cần viết phương trình.'
    return bai_chuoi(de, 'Phần III · Trả lời ngắn', sd, thuas, 3, bong, noi, 'xuoi')

def so_do_nguoc():
    sang = lambda c, t: span(c + ' sang', t)
    de = ('Để sản xuất ' + sang('d-cho', '1 tấn') + ' dung dịch ' + span('d-chat sang', 'H<sub>2</sub>SO<sub>4</sub>') + ' ' + sang('d-cho', '98%') +
          ' từ quặng pyrite chứa ' + sang('d-cho', '60%') + ' ' + span('d-chat sang', 'FeS<sub>2</sub>') + ', ' + kh('hiệu suất cả quá trình', True) + ' là ' +
          sang('d-cho', '80%') + '. Khối lượng quặng pyrite cần dùng là m tấn. ' + span('d-hoi', 'Giá trị của m là'))
    sd = """<div class="sd"><div class="dau"><span class="goc">m tấn</span><span class="ct">FeS<sub>2</sub></span><span class="so-nho">60%</span></div>
<div class="mui-dai"><span class="mui-nhan">H = 80%</span><span class="mui-duoi">bảo toàn S</span></div>
<div class="cuoi"><span class="ct">2 H<sub>2</sub>SO<sub>4</sub></span><span class="hoi">1 tấn · 98%</span></div></div>"""
    thuas = [('10⁶', '', '1 tấn dung dịch = 10⁶ gam'),
             ('98/100', '', '<b>gam H<sub>2</sub>SO<sub>4</sub></b> (dung dịch 98%)'),
             ('1/98', '', '<b>mol H<sub>2</sub>SO<sub>4</sub></b> (chia M = 98)'),
             ('1/2', '', '<b>mol FeS<sub>2</sub></b> (bảo toàn S: 2 H<sub>2</sub>SO<sub>4</sub> cần 1 FeS<sub>2</sub>)'),
             ('120', '', '<b>gam FeS<sub>2</sub></b> (nhân M = 120)'),
             ('100/60', '', '<b>gam quặng</b> theo lí thuyết (quặng chỉ chứa 60% FeS<sub>2</sub>)'),
             ('100/80', '', '<b>gam quặng thực tế cần</b> (tính ngược: × 100/H)'),
             ('10⁻⁶', '', '<b>tấn quặng</b> (đề hỏi theo tấn)')]
    bong = 'Em đang chạm <b>100/80</b>. Đây là bước <b>tính ngược</b> (từ sản phẩm về nguyên liệu) nên nhân <b>100/H</b>: hiệu suất chỉ 80% thì phải lấy <b>nhiều quặng hơn</b> lí thuyết.'
    noi = 'Đề cho sản phẩm (H<sub>2</sub>SO<sub>4</sub>), hỏi nguyên liệu (quặng) ⇒ <b>tính ngược</b>. Theo dấu nguyên tố S từ H<sub>2</sub>SO<sub>4</sub> về FeS<sub>2</sub>.'
    return bai_chuoi(de, 'Phần III · Trả lời ngắn', sd, thuas, 6, bong, noi, 'nguoc')
