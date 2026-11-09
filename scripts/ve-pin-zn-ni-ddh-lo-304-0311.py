"""Pin Zn–Ni: giữ nhãn ion, cầu muối và dây như nguồn; không thêm cực tính."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ed89d7d068ebbfd36aad594a335e4f1e4265d510614b17378e3ad2504d12712d';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='''<path d="M47 247H218V370Q218 396 191 396H73Q47 396 47 370Z" fill="#e3e3e3"/>
<path d="M313 247H483V370Q483 396 456 396H339Q313 396 313 370Z" fill="#c9c9c9"/>
<path d="M129 116V60H239 M292 60H397V116" fill="none" stroke="#151515" stroke-width="1.8"/>
<circle cx="265.5" cy="59" r="26.5" fill="#fff" stroke="#151515" stroke-width="1.8"/>
<path d="M42 176Q47 180 47 188V370Q47 396 73 396H191Q218 396 218 370V188Q218 180 222 176 M307 176Q313 180 313 188V370Q313 396 339 396H456Q483 396 483 370V188Q483 180 488 176" fill="none" stroke="#151515" stroke-width="1.8"/>
<path d="M194 304V158H335V306H323V171H207V304Z" fill="#c8c8c8" stroke="#151515" stroke-width="1.8" stroke-linejoin="miter"/>
<path d="M121 116H137V338H121Z M389 116H405V338H389Z" fill="#ababab" stroke="#151515" stroke-width="1.8"/>
'''
for x,y,t,z in [(265.5,70,'V',29),(99,180,'Zn',28),(429,183,'Ni',28),(262,154,'Cầu muối',28)]:b+=F.label(x,y,t,z,fill='#151515')
# Chỉ số điện tích dùng glyph DDH nhỏ trên baseline riêng, không thay bằng chữ thường.
for x,y,t in [(74,377,'Zn'),(357,377,'Ni')]:
 b+=F.label(x,y,t,28,anchor='start',fill='#151515');pos=x+F.advance(t,28)
 b+=F.label(pos,y-12,'2+',17,anchor='start',fill='#151515');pos+=F.advance('2+',17)+8
 b+=F.label(pos,y,'1M',28,anchor='start',fill='#151515')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="526" height="429" viewBox="0 0 526 429"><title>Pin Zn–Ni theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pin-zn-ni-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1313,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2openbeakers2grayfills2grayrods/1rectangularUbridge/1circleV2wires/regularDDH/Zn-Ni-Cầu muối-Zn2+1M-Ni2+1M/noaddedpolarity-arrows-electrons-bubbles-answer')
(K/'cau-truc-pin-zn-ni-ddh-lo-304-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
