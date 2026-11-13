"""Vẽ riêng bốn cấu trúc lysine và hai cặp bán mũi tên theo nguồn650."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='793876c6f084e746755178f89a7909a5094af2b8aadeb3ea5e88fd3893ae722d';b=''
def path(d,fill='none',w=2):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="#202020" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v):path('M'+'L'.join(f'{x} {y}'for x,y in v))
def lab(x,y,t,z=25,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=25):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=25):lab(x+F.advance(t[-1],z)/2,y,t,z,'end')
chains=[[[55,91],[79,76],[115,97],[152,76],[188,97],[224,76],[249,91]],[[604,89],[628,74],[665,95],[701,74],[737,95],[773,74],[798,89]],[[57,246],[83,230],[120,252],[158,230],[196,252],[233,230],[260,246]],[[603,242],[630,228],[667,250],[705,228],[742,250],[779,228],[806,244]]]
for v in chains:line(v)
for v in [[[224,76],[224,48]],[[773,74],[773,46]],[[233,230],[233,203]],[[779,228],[779,201]]]:line(v)
last(42,108,'H₂N');first(224,44,'NH₃');lab(224,20,'+',20);first(261,108,'COO');lab(313,92,'−',19)
last(590,105,'H₃N');lab(592,84,'+',20);first(773,42,'NH₃');lab(773,18,'+',20);first(810,105,'COO');lab(862,90,'−',19)
last(43,263,'H₃N');lab(44,240,'+',20);first(233,198,'NH₂');first(272,263,'COO');lab(324,248,'−',19)
last(590,259,'H₃N');lab(592,239,'+',20);first(779,197,'NH₃');lab(779,173,'+',20);first(818,260,'COO');lab(870,244,'−',19)
lab(354,97,'+',24);lab(410,96,'H₂O',25);lab(896,104,'+',24);lab(944,106,'OH',25);lab(969,91,'−',19)
lab(360,252,'+',24);lab(416,250,'H₂O',25);lab(906,258,'+',24);lab(952,259,'OH',25);lab(978,244,'−',19)
for x1,x2,y in [(451,537,83),(456,538,237)]:
 line([[x1,y],[x2,y]])
 path(f'M{x2} {y} L{x2-17} {y-6} L{x2-14} {y} Z','#202020',0)
 line([[x1,y+6],[x2,y+6]])
 path(f'M{x1} {y+6} L{x1+18} {y+12} L{x1+14} {y+6} Z','#202020',0)
for x,y,t in [(162,146,'Dạng (I)'),(699,145,'Dạng (III)'),(167,295,'Dạng (II)'),(718,294,'Dạng (III)')]:lab(x,y,t,22)
# Mảnh rất nhỏ tại mép trên giữ nguyên vùng cắt, không đoán thành ký tự.
b+='<path d="M200 0 L207 0 M677 0 L680 0" fill="none" stroke="#bbbbbb" stroke-width="0.6"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="990" height="300" viewBox="0 0 990 300"><title>Cân bằng theo nguồn650</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='lysine650-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='4lysine24C8N8O-EXCL2water2OH/4individual5bareCchains+4COO/3NH3UP1NH2UP-3H3NLEFT1H2NLEFT/6Nplus4COOminus2OHminus/2HALFharpoonpairsUPRIGHTABOVE-LOWLEFTBELOW/ALLregularUPRIGHT-SUB23/EXACTDạng(I)-Dạng(III)-Dạng(II)-Dạng(III)/TOPtinycropUNKNOWNretain/NOaddedH-answer-alias/nativeapproxNOTsubpixel'
r=dict(i=650,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-lysine650-native-ddh-lo-407-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-lysine650-lo-407.json').write_text(json.dumps(dict(hash=h,native=[990,300],questions=qs,chains=chains,ghiChu=note,rootSourceAudit='Root mở riêng native FULL và FULL2x, đọc toàn1publicde-ref; tọa độ gần đúng, không đo subpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
