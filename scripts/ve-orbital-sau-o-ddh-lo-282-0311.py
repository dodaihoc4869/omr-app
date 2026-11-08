"""Nguồn943: giữ nguyên sáu ô và mười một mũi tên của đề."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='aa4dddc3a72b29416cd87d801d05724ed31ff49deabd1edb7cffb446956d5485';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
b=line('M49 46H106V99H49Z M192 45H248V99H192Z M281 45H451V99H281Z M338 45V99 M394 45V99 M559 44H615V98H559Z',1.7)
for x in [68,210,299,355,414,586]:b+=line(f'M{x} 83V55 M{x-7} 63L{x} 55L{x+7} 63',2.1)
for x in [87,229,318,375,434]:b+=line(f'M{x} 55V83 M{x-7} 75L{x} 83L{x+7} 75',2.1)
for x,y,t in [(76,137,'1s'),(220,137,'2s'),(367,137,'2p'),(586,135,'3s')]:b+=F.label(x,y,t,32,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="651" height="184" viewBox="0 0 651 184"><title>Sơ đồ ô orbital theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='orbital-sau-o-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=943,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='6boxes/11arrowsfirst5UPDOWNlast3sONLYUP/2p3adjacentcells/11openVheads/4actualdamlabels1s2s2p3s/noaddedsecond3selectron-exponent-element-caption-answer.')
(K/'cau-truc-orbital-sau-o-ddh-lo-282-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
