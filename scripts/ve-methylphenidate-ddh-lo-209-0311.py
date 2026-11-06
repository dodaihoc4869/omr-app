"""Nguồn118: giữ công thức muối literal, không thêm điện tích hay stereo."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1680cc35f202211731150fcc74201d8e974daa186a2b7e7b393b4bcb893b20bb';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.9):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=27):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=27):return F.label(x+F.advance(t[-1],z)/2,y,t,z,'end')
b=path('M126 137L168 113L209 137V185L168 209L126 185Z M136 142L168 123M201 143V180M136 180L168 198')
b+=path('M209 137L247 112L287 137L331 112L374 137V184L331 209L303 192M287 137V160M247 112V73')
b+=first(247,60,'COOCH₃')+last(287,198,'ClH₂N')+F.label(244,254,'Methylphenidate hydrochloride',23,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="299" viewBox="0 0 500 299"><title>Cấu trúc theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='methylphenidate-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=118,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Benzene3double/Nsixring/COOCH3/ClH2Nliteral/nocharges-stereo/branches/captionEnglishdamWOFF2/DDHpath.');(K/'cau-truc-methylphenidate-ddh-lo-209-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
