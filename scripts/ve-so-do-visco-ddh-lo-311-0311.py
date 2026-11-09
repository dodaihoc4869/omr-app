"""Nguồn1365: giữ nguyên công thức và caption xangtogenate của bản in."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='f69d64a883c74f76f3601e081c8d169d71ce896e349de72f1f6f0f8adbc591b1';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def label(x,y,t,z=26,anchor='middle'):return F.label(x,y,t,z,anchor=anchor,fill='#111')
def path(d,w=2):return f'<path d="{d}" fill="none" stroke="#111" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def italic(x,y,t):return f'<g transform="translate({x} {y}) skewX(-10)">'+label(0,0,t,28)+'</g>'
b=''
for x in [6,1034]:
 t='[C₆H₇O₂(OH)₃]';b+=label(x,45,t,26,'start');b+=label(x+F.advance(t,26)+1,51,'n',18,'start')
b+=label(403,40,'[C₆H₇O₂(OH)₂-O',26,'start')
b+=path('M616 30H632 M660 30H681 M642 47V63 M649 47V63')
b+=label(645,40,'C',28)+label(686,40,'SNa]',26,'start');b+=label(686+F.advance('SNa]',26)+2,46,'n',18,'start')+label(645,89,'S',27)
for start,end,y in [(217,388,36),(771,1016,35)]:
 b+=path(f'M{start} {y}H{end-10}',2)
 b+=f'<path d="M{end} {y}L{end-17} {y-5}L{end-13} {y}L{end-17} {y+5}Z" fill="#111"/>'
b+=label(301,28,'1. NaOH',27)+label(287,70,'2. CS₂',27)+label(893,24,'+ H₂SO₄ (loãng)',26)
b+=italic(102,112,'Cellulose')+italic(599,120,'Cellulose xangtogenate')+italic(1127,100,'Tơ visco')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1239" height="131" viewBox="0 0 1239 131"><title>Sơ đồ theo nguồn1365</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='so-do-visco-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1365,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3squarepairs3nSUB/LEFT-RIGHT[C6H7O2(OH)3]n/MID[C6H7O2(OH)2-O-C-SNa]n-C=Sdown/2filledRIGHT/1.NaOH-2.CS2/+H2SO4(loãng)/3regularITALICcaptionsCellulose-Cellulose xangtogenate-Tơ visco/noaddedcharges-byproducts-temp-answer')
(K/'cau-truc-so-do-visco-ddh-lo-311-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
