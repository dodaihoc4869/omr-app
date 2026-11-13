"""Đoạn mạch polymer nguồn722: giữ từng nhóm chữ và hướng bốn nhánh."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='87294414104b6383d4b8e1f3772442edb5c53b8cb51c588903d8b4c4dbc484a4';b=''
def path(d,w=1.5):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt"/>'
def lab(x,y,t,z=32,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def first(x,y,t,z=32):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
# Tám nhóm chữ riêng: không tự thêm liên kết giữa các nhóm chữ trên mạch.
for x,t in [(121,'CH₂'),(179,'CH'),(221,'CH'),(273,'CH₂'),(332,'CH₂'),(389,'CH'),(437,'CH₂'),(491,'CH')]:first(x,136,t)
# Bốn nhánh, neo theo C đầu; hướng xuống-lên-xuống-lên đúng bản gốc.
path('M179 141V166 M220 84V109 M389 141V165 M491 83V108')
first(179,193,'CH₃');first(221,80,'CH₃');first(389,193,'CH₃');first(491,80,'CH₃')
# Hai nét tự do và đúng ba chấm mỗi phía, không dùng glyph dấu ba chấm.
path('M80 126H104 M530 125H554')
for x,y in [(58,126),(67,126),(76,126),(560,125),(569,125),(577,125)]:
 b+=f'<circle cx="{x}" cy="{y}" r="1.8" fill="#000000"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="632" height="251" viewBox="0 0 632 251"><title>Đoạn mạch polymer theo nguồn722</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='poly722-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='12C24Hliteral/8backboneCH2-CH-CH-CH2-CH2-CH-CH2-CH/4CH3branches2DOWN3UP6DOWN8UP/FIRSTCanchors-SUB23/ALLregularUPRIGHTBLACK/0internalhorizontalbonds-2freeends-2ellipsis3dotsEACH/0bracket-n-caption-name-answer/NOalias714874/nativeapproxNOTsubpixel'
r=dict(i=722,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-poly722-native-ddh-lo-425-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-poly722-lo-425.json').write_text(json.dumps(dict(hash=h,native=[632,251],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL1x2x/all1publicde12-KT-C1234-D1-I-14. 8backboneC4CH3=12C24Hliteral. 4individualbranches2down3up6down8up; NOinternalhorizontalbonds. 2freeends6dots. Noalias714874/noanswer.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
