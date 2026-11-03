"""Dựng các ô orbital kèm nhãn hình; nhãn bị cắt được đối chiếu cả bộ hình và câu dẫn."""
from pathlib import Path
import json,hashlib,html
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';S=P/'nguon'
A=sorted(json.loads((S/'kiem-ke.json').read_text())['assets'],key=lambda a:a['hash'])
SRC=json.loads((M/'orbital-nhan-nguon.json').read_text());records=[]
INK='#252440';EDGE='#77758e'
def line(x,y,xx,yy):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
def arrow(x,y,d):
 if d=='u':return line(x,y+68,x,y+10)+f'<path d="M{x-7} {y+18}L{x} {y+4}L{x+7} {y+18}Z" fill="{INK}"/>'
 return line(x,y+4,x,y+62)+f'<path d="M{x-7} {y+54}L{x} {y+68}L{x+7} {y+54}Z" fill="{INK}"/>'
for a in SRC:
 p=a['muiTen'];x=66;y=24;width=len(p)*80;b=f'<rect x="{x}" y="{y}" width="{width}" height="86" rx="3" fill="none" stroke="{EDGE}" stroke-width="2.5"/>'
 for i,pat in enumerate(p):
  if i:b+=f'<path d="M{x+i*80} {y}V{y+86}" stroke="{EDGE}" stroke-width="2.5"/>'
  for j,d in enumerate(pat):b+=arrow(x+i*80+(30.4+19.2*j if len(pat)==2 else 40),y+9,d)
 b+=f'<text x="18" y="82" font-family="DejaVu Sans,Arial,sans-serif" font-size="25" fill="{INK}">{html.escape(a["nhan"])}</text>'
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{width+90}" height="134" viewBox="0 0 {width+90} 134" role="img"><title>Biểu diễn ô orbital {html.escape(a["nhan"])}</title>{b}</svg>'
 digest=hashlib.sha256(svg.encode()).hexdigest();fn='orbital-nhan-'+digest+'.svg';(M/fn).write_text(svg)
 records.append({**a,'svg':fn,'hashSvg':digest,'trangThai':'cho-soat-doc-lap'})
(M/'orbital-nhan-ve-thu-cong.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
print('Đã dựng',len(records),'hình kèm nhãn, chờ soát độc lập.')
