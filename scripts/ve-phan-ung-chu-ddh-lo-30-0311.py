"""Hai chuỗi công thức chữ, giữ hệ số/ẩn/điều kiện nguyên văn nguồn."""
from pathlib import Path
import json,re,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);src=json.loads((M/'doc-phan-ung-10-nguon-0311.json').read_text());rows=[];sub=str.maketrans('0123456789','₀₁₂₃₄₅₆₇₈₉')
def formula(s):return re.sub(r'(?<=[A-Za-z\)])\d+',lambda m:m.group().translate(sub),s)
def arrow(x,y,xx):return f'<path d="M{x:g} {y}H{xx:g}" fill="none" stroke="#252440" stroke-width="2.5"/><path d="M{xx-12:g} {y-6}L{xx:g} {y}L{xx-12:g} {y+6}Z" fill="#252440"/>'
for old in src:
 if old['i']not in[18,78]:continue
 hasCaption=old['i']==78;xs=[170,620,1020]if hasCaption else[160,570,980];font=36;baseline=185;arrowY=173;b='';bounds=[]
 for x,node in zip(xs,old['nodes']):
  value=node['text'];caption=''
  if ' ('in value:value,tail=value.split(' (',1);caption='('+tail
  display=formula(value);w=F.advance(display,font);bounds.append((x-w/2,x+w/2));b+=F.label(x,baseline,display,font)
  if caption:b+=F.label(x,260,caption,26)
 for a in old['arrows']:
  assert a['kind']=='→';left=bounds[a['from']][1]+25;right=bounds[a['to']][0]-25;assert right>left;cx=(left+right)/2
  b+=arrow(left,arrowY,right)+F.label(cx,126,formula(a['above']),27)+F.label(cx,229,formula(a['below']),27)
  if a.get('stepLabel'):b+=F.label(cx,270,a['stepLabel'],24)
 width=1200 if hasCaption else 1140;height=320 if hasCaption else 280;svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}"><title>Chuỗi phản ứng theo hình nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(svg).hexdigest();fn='phan-ung-chu-ddh-'+h+'.svg';(M/fn).write_bytes(svg);r=dict(old);r.update(svg=fn,hashSvg=h,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap');rows.append(r)
(M/'cau-truc-phan-ung-chu-ddh-lo-30-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng',len(rows),'chuỗi phảnứng, chờsoát hệsố/điềukiện.')
