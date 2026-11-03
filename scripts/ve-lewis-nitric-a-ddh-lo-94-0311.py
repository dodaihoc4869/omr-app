"""Bản Lewis a): giữ cặp electron và liên kết đơn theo nguồn, không tự thêm charge."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());a=sorted(iv['assets'],key=lambda r:r['hash'])[986]
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
def line(x,y,xx,yy):return f'<path d="M{x} {y}L{xx} {yy}" stroke="#252440" stroke-width="3"/>'
b=''.join(F.label(x,y+16,t,46)for x,y,t in[(65,240,'H'),(180,180,'O'),(365,180,'N'),(530,70,'O'),(530,290,'O')])
for z in[(93,226,149,195),(213,180,332,180),(388,157,495,86),(395,168,502,97),(393,198,492,266)]:b+=line(*z)
for x,y,vert in[(180,125,False),(180,235,False),(530,15,False),(530,125,False),(530,235,False),(585,290,True),(530,345,False)]:
 for d in[-10,10]:b+=f'<circle cx="{x+(0 if vert else d)}" cy="{y+(d if vert else 0)}" r="4.5" fill="#252440"/>'
b+=F.label(315,310,'a)',34)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="650" height="380" viewBox="0 0 650 380"><title>Công thức Lewis theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='lewis-nitric-a-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==a['hash']]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=986,hash=a['hash'],fileNguon=a['file'],questions=qs,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='O-H2cặptựdo,Odouble2cặp,Oterminal3cặp;khôngdotsN/charge. N–Oterminalnétđơnkhôngarrowởa),captiona)giữnguyên.')
(M/'cau-truc-lewis-nitric-a-ddh-lo-94-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
