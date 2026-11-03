"""Dựng hình chiếu từ dữ liệu trái/phải đã đọc nguồn; không suy diễn đồng phân."""
from pathlib import Path
import json,hashlib,html
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem'
A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda x:x['hash'])
# R/L là phía OH trong đúng hàng nguồn, tuyệt đối không quay/lật hình.
groups=[([61,412,670,1383],'CH₂OH','KLRL'),([94,922,1415],'CHO','RLRR'),([100,173,236,1026,1077,1300],'CH₂OH','KLRR'),([511,682,993,1205],'CH₂OH','KRLR'),([17,513],'CHO','LLRR'),([536,589,616,1258],'CH₂OH','KRRL'),([733,809],'CHO','RLLR')]
def render(top,pattern,numbered=False):
 x=170;ys=[110+76*i for i in range(len(pattern))];bottom=ys[-1]+88;height=bottom+48
 b=[]
 def line(a,c,d,e):b.append(f'<path d="M{a} {c}L{d} {e}" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round"/>')
 def text(a,c,s,anchor='start',size=32):b.append(f'<text x="{a}" y="{c}" text-anchor="{anchor}" font-family="DejaVu Sans,Arial,sans-serif" font-size="{size}" fill="#252440">{html.escape(s)}</text>')
 text(x-11,50,top);text(x-11,bottom,'CH₂OH');line(x,64,x,bottom-32)
 for y,k in zip(ys,pattern):
  if k=='K':
   line(x,y-4,263,y-4);line(x,y+4,263,y+4);text(275,y+11,'O')
  else:
   left,right=('H','OH')if k=='R'else('HO','H')
   text(65,y+11,left,'end');text(275,y+11,right);line(77,y,x,y);line(x,y,263,y)
 if numbered:
  for n,y in enumerate([39]+ys+[bottom-11],1):text(x-24,y-12,str(n),'end',16)
 return f'<svg xmlns="http://www.w3.org/2000/svg" width="360" height="{height}" viewBox="0 0 360 {height}"><title>Hình chiếu Fischer theo nguồn</title>'+''.join(b)+'</svg>'
out=M/'cau-truc-lo-6-ban-dung.json'
old={(r['hash'],r['hashSvg']):r for r in json.loads(out.read_text())}if out.exists()else{}
rows=[]
for indices,top,pattern in groups:
 for i in indices:
  a=A[i];svg=render(top,pattern,i==922).encode();digest=hashlib.sha256(svg).hexdigest();fn='cau-truc-fischer-'+digest+'.svg';(M/fn).write_bytes(svg)
  rows.append({'i':i,'hash':a['hash'],'fileNguon':a['file'],'top':top,'bottom':'CH₂OH','rows':pattern,'carbonNumbers':list(range(1,7))if i==922 else [],'svg':fn,'hashSvg':digest,'byteSvg':len(svg),'trangThai':'cho-soat-doc-lap','xuLyNhanPhuongAn':'Bỏ nhãn phương án PDF cũ bị cắt; app đã có nhãn ngoài ảnh, giữ nguyên qid/vị trí/thứ tự.'if i in [17,733,1415,173]else None})
# Nguồn1331 dùng biểu diễn khung: H ẩn, không thêm nhánh H vào hình.
a=A[1331]
svg='<svg xmlns="http://www.w3.org/2000/svg" width="310" height="450" viewBox="0 0 310 450"><title>Công thức khung mạch hở theo nguồn</title><g fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M150 95V355L192 386M150 95L184 61M157 98L191 64M150 148H186M150 200H114M150 252H186M150 304H186"/></g><g font-family="DejaVu Sans,Arial,sans-serif" font-size="32" fill="#252440"><text x="191" y="62">O</text><text x="197" y="159">OH</text><text x="103" y="211" text-anchor="end">HO</text><text x="197" y="263">OH</text><text x="197" y="315">OH</text><text x="196" y="410">OH</text></g></svg>'
b=svg.encode();digest=hashlib.sha256(b).hexdigest();fn='cau-truc-fischer-'+digest+'.svg';(M/fn).write_bytes(b)
rows.append({'i':1331,'hash':a['hash'],'fileNguon':a['file'],'kind':'khung-mach-ho-H-an','OH':'RLRR','svg':fn,'hashSvg':digest,'byteSvg':len(b),'trangThai':'cho-soat-doc-lap'})
for r in rows:
 previous=old.get((r['hash'],r['hashSvg']),{})
 if previous.get('trangThai')=='da-soat-doc-lap':
  for key in ['trangThai','hashSvgDaSoat','nguoiSoat']:r[key]=previous[key]
(M/'cau-truc-lo-6-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng',len(rows),'nguồn; chưa tính đạt trước soát độc lập.')
