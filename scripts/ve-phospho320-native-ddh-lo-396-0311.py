"""Nguồn320: hai hàng phospholipid và hai ngoặc chú thích đọc riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-phospho320-lo-396.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,fill='none',stroke='#303030',w=2):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=2):path('M'+'L'.join(f'{x} {y}'for x,y in v),w=w)
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,anchor='end')
def italic(x,y,t,z=30):
 global b
 b+=f'<g transform="translate({x} {y}) skewX(-10)">'+F.label(0,0,t,z,anchor='middle',fill='#202020')+'</g>'
# Hai hàng công thức và nhánh phosphate giữ đúng bản nguồn.
lab(0,20,'CH₃–[CH₂]₁₄–COO–',26,anchor='start');first(248,20,'CH₂')
lab(0,65,'CH₃–[CH₂]₁₆–COO–',26,anchor='start');first(248,65,'CH');first(303,65,'CH₂')
for x in [365,430]:lab(x,65,'O')
lab(399,65,'P');lab(399,18,'O');lab(399,107,'O')
first(466,65,'CH₂CH₂NH₃',25.5)
lab(600,48,'+',17);lab(417,9,'−',17)
for v in g['singleBonds']:line(v,1.4)
for v in g['phosphateDoubleRays']:line(v,1.4)
for v in g['underbraces']:path(v,stroke='#202020',w=1.3)
lab(172,150,'“Đuôi” không phân cực',21);lab(480,150,'“Đầu” phân cực',21)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="606" height="155" viewBox="0 0 606 155"><title>Công thức theo nguồn320</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='phospho320-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=320,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='39C8O1N1Pfromliteral14and16/2condensedrowsCH3-[CH2]14-COO-CH2andCH3-[CH2]16-COO-CH-CH2-O-P-O-CH2CH2NH3plus/2SQUAREpairsSUB1416/1PdoubleOdown2rays-OminusUP-NH3plusRIGHT/ALLregularUPRIGHT/2individualnonperiodicunderbraces/EXACTcurlyquotes“Đuôi”khôngphâncực-“Đầu”phâncực/topnativecropKEEP/0arrows-stereo/NOaddedH-charge-label-name-answer-alias')
(K/'cau-truc-phospho320-native-ddh-lo-396-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
