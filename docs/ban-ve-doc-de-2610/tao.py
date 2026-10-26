# Sinh 5 màn bản vẽ «Chạm để hiểu đề» (26/10). Đề mẫu tự soạn, số khớp: 8,8 g ethyl acetate (M = 88) = 0,1 mol; NaOH 0,1 L × 1,5 M = 0,15 mol.
DAU = '''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>HS · {tieu}</title><link rel="stylesheet" href="../ban-ve-trong-2610/trong.css"><link rel="stylesheet" href="doc-de.css"></head>
<body data-app="hs" data-khung="man-con" data-ve="Hôm nay" data-tieu="Chặng học của em" data-phu="Bài 4 · Chặng 1" data-ai="khong"
  data-nut-dau='<span class="nut trong an-dt">Nghỉ và về Hôm nay</span>'>
<main class="khung cot tap-trung" style="gap:18px">
<!-- {ghi} -->
<div class="hang giua" style="gap:16px"><span class="dam">Câu 2<span class="mo" style="font-weight:500">/6</span></span>
<div class="chang" style="flex:1" role="img" aria-label="Chặng 1: câu 1 đã làm, đang làm câu 2"><i class="xong"></i><i class="dang"></i><i></i><i></i><i></i><i></i></div></div>
'''
CUOI = '''</main>
<script src="../ban-ve-trong-2610/khung.js"></script>
</body></html>
'''
CHU_GIAI = '''<div class="chu-giai"><span class="dam" style="color:var(--chu-2)">Chạm chữ tô màu để hiểu đề</span>
<span class="mau"><i class="m-cho"></i>Đề cho</span><span class="mau"><i class="m-hoi"></i>Đề hỏi</span><span class="mau"><i class="m-chat"></i>Chất</span><span class="mau"><b style="color:var(--chu)">in đậm</b>Từ then chốt</span></div>'''

def span(cls, chu, them='', bong=''):
    s = f'<span class="cham-duoc {cls}{" dang-cham" if them else ""}">{chu}</span>'
    return f'<span class="neo">{s}{bong}</span>' if bong else s

def cau_tinh(cham=None):
    """cham: None | 'm' (1,5 M) | 'chat' (ethyl acetate)"""
    b_m = '''<span class="phu-mo-nhat"></span><span class="bong" role="dialog" aria-label="Giải thích đơn vị M">
<span class="keo"></span>
<span class="b-dau"><span class="o-icon tin"><i data-i="info" class="nho"></i></span><span class="b-ten">M · nồng độ mol</span><span class="chip tin b-loai">Đơn vị</span></span>
<span class="b-doan"><b>1,5 M</b> đọc là «1,5 mol trên lít»: cứ <b>1 lít</b> dung dịch có <b>1,5 mol</b> chất tan.</span>
<span class="cong-thuc" style="display:block">n = C<sub>M</sub> × V<span class="mo" style="font-weight:500"> (V tính bằng lít)</span></span>
<span class="nho-chu" style="display:block">Nhớ đổi: 1000 mL = 1 L</span>
<span class="b-cuoi"><span class="nut nhe">Đã hiểu</span></span>
</span>'''
    b_chat = '''<span class="phu-mo-nhat"></span><span class="bong" role="dialog" aria-label="Giải thích tên chất">
<span class="keo"></span>
<span class="b-dau"><span class="o-icon"><i data-i="book" class="nho"></i></span><span class="b-ten">ethyl acetate</span><span class="chip chinh b-loai">Ester</span></span>
<span class="b-doan">Tên cũ: etyl axetat</span>
<span class="cong-thuc" style="display:block">CH<sub>3</sub>COOC<sub>2</sub>H<sub>5</sub> · M = 88 g/mol</span>
<span class="nho-chu" style="display:block">M tính từ nguyên tử khối C = 12, H = 1, O = 16 (4·12 + 8·1 + 2·16 = 88)</span>
<span class="b-cuoi"><span class="nut nhe">Đã hiểu</span></span>
</span>'''
    b_naoh = """<span class="phu-mo-nhat"></span><span class="bong" role="dialog" aria-label="Tên chất từ công thức">
<span class="keo"></span>
<span class="b-dau"><span class="o-icon"><i data-i="book" class="nho"></i></span><span class="b-ten">NaOH</span><span class="chip chinh b-loai">Base mạnh</span></span>
<span class="b-doan"><b>sodium hydroxide</b> · tên cũ: natri hiđroxit (xút ăn da)</span>
<span class="cong-thuc" style="display:block">M = 40 g/mol</span>
<span class="nho-chu" style="display:block">Na = 23, O = 16, H = 1 (23 + 16 + 1 = 40)</span>
<span class="b-cuoi"><span class="nut nhe">Đã hiểu</span></span>
</span>"""
    b_cocan = """<span class="phu-mo-nhat"></span><span class="bong" role="dialog" aria-label="Giải nghĩa từ then chốt">
<span class="keo"></span>
<span class="b-dau"><span class="o-icon chu-y"><i data-i="flag" class="nho"></i></span><span class="b-ten">Cô cạn</span><span class="chip b-loai">Từ then chốt</span></span>
<span class="b-doan">Đun cho <b>nước và chất dễ bay hơi</b> (như ethanol) bay hết. Thứ còn lại là <b>chất rắn khan</b>: các muối và base, acid rắn còn dư.</span>
<span class="nho-chu" style="display:block">Gặp «cô cạn» ⇒ tự hỏi: chất nào bay đi, chất nào ở lại?</span>
<span class="b-cuoi"><span class="nut nhe">Đã hiểu</span></span>
</span>"""
    k = lambda chu, ten=None, bong='': span('d-khoa', chu, cham == ten and ten is not None, bong)
    de = ('Thuỷ phân ' + k('hoàn toàn') + ' ' + span('d-cho', '8,8 gam') + ' ' +
          span('d-chat', 'ethyl acetate', cham == 'chat', b_chat if cham == 'chat' else '') +
          ' bằng ' + span('d-cho', '100 mL') + ' dung dịch ' + span('d-chat', 'NaOH', cham == 'naoh', b_naoh if cham == 'naoh' else '') + ' ' +
          span('d-cho', '1,5 M', cham == 'm', b_m if cham == 'm' else '') +
          ', ' + k('đun nóng') + '. ' + k('Cô cạn', 'cocan', b_cocan if cham == 'cocan' else '') + ' dung dịch sau phản ứng, thu được m gam ' + k('chất rắn khan') + '. ' + span('d-hoi', 'Giá trị của m là'))
    lc = ''.join(f'<div class="lua-chon"><b>{k}</b><span>{v}</span></div>' for k, v in [('A', '8,2.'), ('B', '10,2.'), ('C', '12,2.'), ('D', '14,2.')])
    return f'''<section class="the cau" aria-label="Câu 2">
<div class="cau-dau"><span class="chip">Phần I · Trắc nghiệm</span><span class="day"></span><span class="nut nhe"><i data-i="bulb" class="nho"></i>Bắt đầu từ đâu?</span></div>
{CHU_GIAI}
<p class="cau-de">{de}</p>
<div class="lua-chon-ds">{lc}</div>
<div class="hanh-dong"><span class="nut trong">Chưa làm được? Học cách giải</span><span class="nut chinh lon">Nộp câu <i data-i="arrow"></i></span></div>
</section>
'''

TAM = '''<div class="phu-mo day-duoi"><div class="hop tam" role="dialog" aria-label="Bắt đầu từ đâu">
<span class="keo" style="display:block" ></span>
<div class="hang giua" style="gap:10px;margin-bottom:6px"><span class="o-icon chu-y"><i data-i="bulb" class="nho"></i></span><span class="h2" style="margin:0">Bắt đầu từ đâu?</span><span class="day"></span><span class="nut vuong trong" aria-label="Đóng"><i data-i="x"></i></span></div>
<div class="buoc"><span class="so-b">1</span><div><div class="ten-b">Đề cho</div><div class="chips">
<span class="chip tin">8,8 gam ethyl acetate</span><span class="chip tin">100 mL dung dịch NaOH</span><span class="chip tin">1,5 M</span></div></div></div>
<div class="buoc"><span class="so-b">2</span><div><div class="ten-b">Đề hỏi</div><div class="chips"><span class="chip chu-y">m: khối lượng chất rắn khan (gam)</span></div>
<p class="mo" style="margin:8px 0 0;font-size:13.5px">Chất rắn sau khi cô cạn có thể gồm muối và NaOH còn dư.</p></div></div>
<div class="buoc"><span class="so-b">3</span><div><div class="ten-b">Bước đầu tiên: đổi dữ kiện ra mol</div><div class="phep">
<div><b>ethyl acetate</b><span>n = m : M = 8,8 : 88</span></div>
<div><b>NaOH</b><span>n = C<sub>M</sub> × V = 1,5 × 0,1</span><span class="chip">100 mL = 0,1 L</span></div></div></div></div>
<div class="ghi-chu chu-y" style="margin-top:6px"><i data-i="info" class="nho"></i><span>Đây là gợi ý: câu này sẽ tính là có trợ giúp. Tự làm đúng ở lần sau mới tính là đã tự sửa.</span></div>
<div class="hang" style="gap:10px;margin-top:16px"><span class="day"></span><span class="nut chinh">Em tự làm tiếp</span></div>
</div></div>'''

def cau_ly_thuyet(cham=False):
    b = '''<span class="phu-mo-nhat"></span><span class="bong" role="dialog" aria-label="Đề hỏi gì">
<span class="keo"></span>
<span class="b-dau"><span class="o-icon chu-y"><i data-i="alert" class="nho"></i></span><span class="b-ten">Đề hỏi phát biểu SAI</span></span>
<span class="b-doan">Đọc từng phương án và tự hỏi «đúng hay sai?». Phương án <b>sai</b> là đáp án; ba phương án còn lại đều đúng.</span>
<span class="nho-chu" style="display:block">Bẫy hay gặp: đọc nhanh rồi chọn phương án đúng đầu tiên.</span>
<span class="b-cuoi"><span class="nut nhe">Đã hiểu</span></span>
</span>'''
    de = ('Phát biểu nào sau đây ' + span('d-hoi', 'không đúng', cham, b if cham else '') +
          '?<span class="nhan-bay"><i data-i="alert" class="nho"></i>đề hỏi câu sai</span>')
    lc = [('A', 'Nitrogen chiếm khoảng 78% thể tích không khí.'),
          ('B', 'Ở điều kiện thường, nitrogen là chất khí không màu, không mùi.'),
          ('C', 'Phân tử N<sub>2</sub> có liên kết ba bền nên nitrogen khá trơ ở nhiệt độ thường.'),
          ('D', 'Nitrogen tan rất tốt trong nước.')]
    lcs = ''.join(f'<div class="lua-chon"><b>{k}</b><span>{v}</span></div>' for k, v in lc)
    return f'''<section class="the cau" aria-label="Câu 2">
<div class="cau-dau"><span class="chip">Phần I · Trắc nghiệm</span><span class="day"></span><span class="nut nhe"><i data-i="bulb" class="nho"></i>Bắt đầu từ đâu?</span></div>
{CHU_GIAI.replace('<span class="mau"><i class="m-chat"></i>Tên chất</span>', '')}
<p class="cau-de">{de}</p>
<div class="lua-chon-ds">{lcs}</div>
<div class="hanh-dong"><span class="nut trong">Chưa làm được? Học cách giải</span><span class="nut chinh lon">Nộp câu <i data-i="arrow"></i></span></div>
</section>
'''

from goi_y import cau_goi_y, ly_thuyet_goi_y
MAN = [
  ('doc-de-1-cau', 'Đề có tô màu', 'MÀN 1: câu tính toán lúc mới mở — số liệu + đơn vị tô chàm (Đề cho), câu hỏi tô hổ phách (Đề hỏi), tên chất gạch chấm. Không tô phương án A–D.', cau_tinh()),
  ('doc-de-2-don-vi', 'Chạm đơn vị', 'MÀN 2: chạm «1,5 M» ⇒ thẻ giải thích đơn vị (máy tính: thẻ nổi neo dưới chữ; điện thoại dọc: tấm trượt từ đáy). Công thức chung, không tính hộ.', cau_tinh('m')),
  ('doc-de-3b-cong-thuc', 'Chạm công thức', 'MÀN 3b: chạm công thức «NaOH» ⇒ hiện TÊN chất (IUPAC + tên cũ) + loại chất + M tính bằng máy.', cau_tinh('naoh')),
  ('doc-de-3c-tu-then-chot', 'Chạm từ then chốt', 'MÀN 3c: từ then chốt của bài in đậm (hoàn toàn · đun nóng · cô cạn · chất rắn khan); chạm «Cô cạn» ⇒ giải nghĩa ngắn + câu tự hỏi.', cau_tinh('cocan')),
  ('doc-de-3-chat', 'Chạm tên chất', 'MÀN 3: chạm «ethyl acetate» ⇒ tên IUPAC + tên cũ + công thức + M tính bằng máy từ bảng nguyên tử khối.', cau_tinh('chat')),
  ('doc-de-4-goi-y-1', 'Gợi ý 1 · Đề nói gì', 'MÀN 4: bấm «Bắt đầu từ đâu?» (hoặc chạm «Giá trị của m là») ⇒ gợi ý 1 viết riêng cho câu: đề đang nói gì + sơ đồ phản ứng; đề mờ, chữ gợi ý nhắc tới SÁNG lên. Gợi ý 2, 3 còn khoá.', cau_goi_y(1)),
  ('doc-de-4-goi-y-3', 'Gợi ý 3 · Bước đầu', 'MÀN 5: mở đủ 3 gợi ý: Đề nói gì · Chìa khoá (so mol, chất nào dư) · Bước đầu tiên (phép tính đầu với số của bài, không ra kết quả).', cau_goi_y(3)),
  ('doc-de-6-goi-y-ly-thuyet', 'Gợi ý câu lý thuyết', 'MÀN 7: câu lý thuyết — gợi ý riêng: đề nói gì · mảng kiến thức · câu tự hỏi (thu N2 bằng cách đẩy nước). Không tô phương án.', ly_thuyet_goi_y()),
  ('doc-de-5-ly-thuyet', 'Câu lý thuyết', 'MÀN 5: câu lý thuyết — chỉ tô «không đúng» trong câu hỏi + nhãn «đề hỏi câu sai»; «không khí», «không màu» trong phương án KHÔNG tô.', cau_ly_thuyet(True)),
]
for ten, tieu, ghi, than in MAN:
    open(f'{ten}.html', 'w').write(DAU.format(tieu=tieu, ghi=ghi) + than + CUOI)
print('xong', len(MAN))
