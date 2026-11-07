"""Nguồn485: giữ cả ba công thức, tên in Agr và câu chữ công khai trong ảnh."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='5a037dd77f8feec5c44f5006b12ec8b7f87fb29610e7a16a38372923dddfc25c';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.3):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=26):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=26):return F.label(x+F.advance(t[-1],z)/2,y,t,z,'end')
b=line('M254 148L300 123L354 154L409 123L464 154L519 123L563 148M296 75V123M303 75V123M515 75V123M523 75V123M464 154V205')
b+=last(244,160,'HO')+F.label(299,66,'O',26)+F.label(519,66,'O',26)+first(574,160,'OH')+first(464,223,'NH₂')
b+=line('M740 143L782 167L837 135L880 159M833 86V136M841 86V136')+last(725,141,'H₂N')+F.label(837,78,'O',26)+first(892,172,'OH')
b+=line('M999 123L1037 100L1075 123V167L1037 189L999 167ZM1004 128V163M1037 106L1070 125M1037 183L1070 164M1075 123L1114 100L1152 123L1191 100L1218 116M1152 123V152M1188 70V100M1194 70V100')
b+=F.label(1191,62,'O',26)+first(1229,128,'OH')+first(1152,172,'NH₂')
for x,t in [(403,'Glu (pI = 3,1)'),(797,'Gly (pI = 6,0)'),(1121,'Agr (pI = 10,8)')]:b+=F.label(x,268,t,24)
b+=F.label(28,310,'Tiến hành phương pháp điện di dung dịch gồm ba amino acid trên tại giá trị pH = 6,0 thu được kết quả',27.5,'start')
b+=line('M378 366H1097V494H378ZM753 366V371M753 385V399M753 415V429M753 445V458M753 474V480M753 487V493',2.1)
for x in [465,753,1029]:b+=f'<circle cx="{x}" cy="433" r="8.4" fill="#252440"/>'
for x,t in [(465,'Y'),(733,'X'),(1029,'Z')]:b+=F.label(x,482,t,26)
b+=F.label(268,437,'Cực',26,'start')+F.label(1120,437,'Cực',26,'start')
for x,t in [(341,'+'),(1189,'−')]:b+=f'<circle cx="{x}" cy="430" r="14" fill="none" stroke="#252440" stroke-width="2.1"/>'+F.label(x,438,t,23)
b+=line('M751 538V518',1.8)+'<path d="M751 508L745 522L751 518L757 522Z" fill="#252440"/>'
b+=f'<g transform="translate({math.tan(math.radians(10))*561:.5f} 0) skewX(-10)">'+F.label(752,561,'Tuyến xuất phát',26)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1481" height="595" viewBox="0 0 1481 595"><title>Các công thức và sơ đồ điện di theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pi-dien-di-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=485,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3molecules5+2+9C/8O3N/1phenyl3CCdouble+4COdouble/HO-OH-NH2-H2Nliteral/EXACTAgrcaption-pIdecimalcomma/printedfullsentence/plusLEFTminusRIGHT/3dotsY-X-Z/6dashcomponents/UParrow-Tuyếnxuấtphátnghiêng/NOanswer-noaddedcharges/DDHpath.')
(K/'cau-truc-pi-dien-di-ddh-lo-234-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
