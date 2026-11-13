"""Bốn phương trình nguồn324; giữ chữ và từng đoạn trục rời của bản gốc."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='38527cecdc63db07ca16d066598477221df84b71d0ad57c4a0c9c510df890b7a';b=''
def path(d,w=1.3):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#303030" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1.3):path('M'+'L'.join(f'{x} {y}'for x,y in v),w)
def lab(x,y,t,z=29,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#303030')
def first(x,y,t,z=29):lab(x-F.advance(t[0],z)/2,y,t,z,'start')
def italic(x,y,t,z):
 global b
 b+=f'<g transform="translate({x} {y}) skewX(-10)">'+F.label(0,0,t,z,anchor='middle',fill='#303030')+'</g>'
def arrow(x1,x2,y):
 line([[x1,y],[x2,y]],1.4);path(f'M{x2-6} {y-6} Q{x2-3} {y-1} {x2} {y} Q{x2-3} {y+1} {x2-6} {y+6}',1.4)
lab(33,51,'(1)',30);lab(33,105,'(2)',30);lab(33,225,'(3)',30);lab(33,343,'(4)',30)
lab(134,33,'(C₆H₁₀O₅)',31);lab(211,45,'n',17);lab(360,33,'6nC + 5nH₂O',31,'start')
for a,z in [(230,250),(264,283),(299,317)]:line([[a,24],[z,24]],1.5)
arrow(324,349,24);lab(285,17,'H₂SO₄',17)
lab(61,106,'Cao su thiên nhiên',28,'start');lab(415,106,'Cao su lưu hóa',28,'start')
line([[329,90],[348,90]],1.5);arrow(365,394,90);italic(363,84,'S',18)
# Dòng ba: nhãn C6H5 đặt theo C đầu; nét dọc tự do phía dưới chữ CH.
first(113,151,'CH₂',31);first(208,151,'CH',31)
line([[66,144],[103,144]]);line([[259,144],[286,144]]);line([[174,141],[183,141]],1.6)
lab(294,165,'n',17);path('M80 122 Q64 134 80 154',2);path('M273 122 Q289 134 273 154',2)
line([[210,172],[210,189]],1);first(210,212,'C₆H₅',29)
lab(405,151,'n',31,'start');first(432,151,'CH₂',31);first(531,151,'CH',31)
line([[498,135],[517,135]],1.6);line([[498,143],[517,143]],1.6)
line([[535,165],[535,183]],1);first(535,205,'C₆H₅',29)
line([[313,141],[331,141]],1.5);arrow(347,393,141);lab(353,137,'Na',17)
# Dòng bốn có nhãn Na trong nguồn; không thay bằng điều kiện suy luận.
first(126,270,'CH₂',31);first(220,270,'CH',31)
line([[80,264],[115,264]]);line([[271,264],[299,264]]);line([[185,261],[194,261]],1.6)
path('M94 244 Q78 256 94 275',2);path('M286 244 Q302 256 286 275',2);lab(303,284,'n',17)
line([[210,291],[210,308]],1);first(210,330,'OCOCH₃',29)
lab(328,270,'+ nNaOH',30,'start');line([[471,261],[489,261]],1.5);arrow(507,549,261);lab(509,256,'Na',17)
first(609,270,'CH₂',31);first(702,270,'CH',31)
line([[563,264],[598,264]]);line([[742,264],[782,264]]);line([[663,261],[672,261]],1.6)
path('M577 244 Q561 256 577 275',2);path('M769 244 Q785 256 769 275',2);lab(786,284,'n',17)
line([[699,291],[699,308]],1);first(699,330,'OH',29)
lab(797,270,'+ nCH₃COONa',30,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1054" height="346" viewBox="0 0 1054 346"><title>Bốn phương trình theo nguồn324</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='poly324-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='4literalreactions-UNKNOWNnTotal/4RIGHTOPENVheads-splitshaftsROW1threeisolateddashes-ROWS234oneleftdashEACH/EXACT(C6H10O5)n→6nC+5nH2O-H2SO4/Cao su thiên nhiên→Cao su lưu hóa-SITALIC/PS→nCH2=CH(C6H5)-Na/PVAc+nNaOH→PVA+nCH3COONa-NaKEEP/3ROUNDpairs3nSUB-othernBASELINE/2C6H5FIRSTCanchors-freeverticalstemsbelowCH/row4OCOCH3NOTCOOCH3-OH/ALLregularUPRIGHTexceptSregularITALIC/4nums(4)nativeBOTTOMcropKEEP/NOtheoryfix-addedconditions-name-answer-alias/nativeapproxNOTsubpixel'
r=dict(i=324,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-poly324-native-ddh-lo-409-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-poly324-lo-409.json').write_text(json.dumps(dict(hash=h,native=[1054,346],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL2x/3arrowmacros8x; OPENVheads independentconfirmed. Individual dashpieces and freebranchstems/nativeBOTTOMcrop retained. NativeapproxNOTsubpixel.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
