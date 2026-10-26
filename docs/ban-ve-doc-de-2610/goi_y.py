# Gợi ý 3 tầng viết RIÊNG cho từng câu (thầy 26/10: «phần gợi ý phải có ý nghĩa thực sự cho bài đó … đẹp hơn doligo»).
def span(cls, chu):
    return f'<span class="cham-duoc {cls}">{chu}</span>'

def kh(chu, sang=False):
    """cụm chữ then chốt: bình thường không tô, chỉ SÁNG khi gợi ý nói tới"""
    return f'<span class="cham-duoc d-chat{" sang" if sang else ""}" style="text-decoration:none;font-weight:inherit">{chu}</span>'

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
<div class="cau-dau"><span class="chip">Phần I · Trắc nghiệm</span><span class="day"></span><span class="chip sao"><i data-i="bulb" class="nho"></i>Đang xem gợi ý</span></div>
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
