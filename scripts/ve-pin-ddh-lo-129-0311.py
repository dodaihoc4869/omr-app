"""Dựng pin điện hoá generic, giữ đường dây thấy được, không suy từ lý thuyết."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-dien-hoa-lo-127.json').read_text()) if r['i']==831)
def path(d,w=1,c='#555',fill='none'):return f'<path d="{d}" fill="{fill}" stroke="{c}" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>'
def lab(x,y,t,size=9,anchor='middle'):return F.label(x,y,t,size,anchor,fill='#252440')
b='<g transform="translate(32 30) scale(3.5)">'
# Cốc, mặt nước và đáy; thanh kim loại nghiêng được vẽ đè phía trước.
for x in [116,201]:
 b+=f'<ellipse cx="{x+28}" cy="97" rx="28" ry="4" fill="#f3f3f3" stroke="#777" stroke-width="1"/>'
 b+=path(f'M{x} 97V146Q{x+28} 156 {x+56} 146V97',1,'#777', '#e3e3e3')
 b+=f'<ellipse cx="{x+28}" cy="114" rx="27" ry="5" fill="#fafafa" stroke="#777" stroke-width=".8"/>'
# Cầu muối có hai chân nhúng, viền kép và đầu bịt nhỏ.
b+=path('M158 132V74C158 35 213 35 213 74V132',2,'#888')
b+=path('M165 132V74C165 44 206 44 206 74V132',1.5,'#666')
b+=path('M158 132Q161 137 165 132M206 132Q209 137 213 132',1,'#555')
# Hai thanh và kẹp: âm bên trái sẫm, dương bên phải sáng.
b+=path('M113 25Q116 21 120 24L143 147L135 148Z',.9,'#555','#777')
b+=path('M253 24Q257 21 260 25L236 148L228 148Z',.9,'#555','#d6d6d6')
b+=path('M117 69L125 68L127 78L119 80Z',.8,'#333','#ccc')
b+=path('M245 68L253 70L251 80L243 78Z',.8,'#555','#ddd')
# Viền miệng trước che các vật nhúng như nguồn.
for x in [116,201]:b+=path(f'M{x} 97Q{x+28} 103 {x+56} 97',.9,'#777')
# Đồng hồ xám; bốn nút và hai jack, không thêm đơn vị V.
b+='<rect x="24" y="78" width="51" height="66" rx="5" fill="#bbb" stroke="#555" stroke-width="1"/><rect x="28" y="81" width="44" height="60" rx="3" fill="#f5f5f5" stroke="#777" stroke-width=".7"/><rect x="33" y="84" width="36" height="16" rx="1" fill="#fff" stroke="#777" stroke-width=".7"/>'
b+=lab(51,97,'0.57',12)
b+='<circle cx="51" cy="119" r="15" fill="#ccc" stroke="#666" stroke-width="1"/>'+path('M42 110L60 128M45 108L63 126',1,'#666')
for x,y in [(36,104),(66,104),(36,133),(66,133)]:b+=f'<rect x="{x-3}" y="{y-1.2}" width="6" height="2.4" rx=".7" fill="#aaa" stroke="#666" stroke-width=".5"/>'
for x,y in [(51,139),(61,138)]:b+=f'<ellipse cx="{x}" cy="{y}" rx="2" ry="1.6" fill="#444"/>'
# Hai đường cong tách biệt, không chấm nút tại điểm cắt.
b+=path('M117 24C120 16 126 17 135 29L160 64',.9,'#333')
b+=path('M167 73C180 90 192 108 194 123C195 132 182 138 173 140',.9,'#333')
b+=path('M257 24Q257 12 251 20L213 73',.9,'#333')
b+=path('M205 84C199 93 191 101 185 106C177 113 183 125 184 130Q186 136 173 140',.9,'#333')
b+=path('M51 139C63 145 89 143 116 142M61 138C76 144 94 141 116 141',.9,'#333')
b+=lab(119,12,'−',19)+lab(252,12,'+',19)
# Chú thích riêng từng cốc và các nét dẫn đọc thấy.
b+=lab(73,170,'Thanh kim loại',9)+path('M91 155L134 123',.8,'#555')
b+=lab(137,170,'Dung dịch',9)+path('M140 157L160 143',.8,'#555')
b+=lab(284,128,'Thanh',9)+lab(284,140,'kim loại',9)+path('M266 127L238 125',.8,'#555')
b+=lab(258,170,'Dung dịch',9)+path('M252 157L242 142',.8,'#555')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="680" viewBox="0 0 1160 680"><title>Pin điện hoá với cầu muối và đồng hồ</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pin-generic-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
out=dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Giữ 0.57/chấm;2thanh/2cốc/2chânU nhúng/4nút/2jack/2dây khôngjunction. Mappingjack tại crossing raster không khẳng định. KhôngZnCu/tênmuối/V hayarrow thêm.')
(M/'cau-truc-pin-ddh-lo-129-ban-dung.json').write_text(json.dumps([out],ensure_ascii=False,indent=2))
