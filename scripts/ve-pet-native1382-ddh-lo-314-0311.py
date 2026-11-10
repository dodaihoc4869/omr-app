"""Giữ nguyên sơ đồ1382, kể cả HO nối đôi và ngoặc đóng dư của nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='f9634f3aaca7fdb70fe02da4d604396393b69eb82e2618166ee1453024c82b05';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def label(x,y,t,z=28,anchor='middle'):return F.label(x,y,t,z,anchor=anchor,fill='#111',weight='dam')
def path(d):return f'<path d="{d}" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
b=label(45,122,'n',30)
# Hai vòng và các chân carbonyl lấy riêng theo điểm ảnh nguồn.
b+=path('M174 108L197 64H242L266 108L242 152H197Z M202 73H237 M183 112L201 143 M240 143L257 112 M174 108H127L109 78 M130 106L114 75 M127 108L110 137 M266 108H310L327 77 M314 110L333 79 M310 108L329 137')
b+=label(89,71,'HO',32)+label(89,168,'HO',32)+label(339,71,'O',32)+label(350,168,'OH',32)
b+=label(368,122,'+ nHO-[CH₂]₂-OH',22,'start')
b+=path('M592 112H744')+'<path d="M728 106L744 112L728 118L732 112Z" fill="#111"/>'
b+=label(663,101,'2,7 - 5,5 bar',25)+label(664,148,'220 - 260°C',25)
b+=path('M869 98L888 61H927L947 98L927 136H888Z M893 69H922 M878 102L894 128 M924 128L939 102 M869 98H831L816 72 M827 100L811 76 M831 98L817 122 M947 98H986L999 73 M990 101L1005 76 M986 98L999 122')
b+=label(798,70,'HO',28)+label(807,148,'O',28)+label(1009,70,'O',28)+label(1009,148,'O',28)
b+=path('M1024 136H1041')+label(1045,148,'[CH₂]₂]',25,'start')+label(1045+F.advance('[CH₂]₂]',25),155,'n',20,'start')
b+=path('M772 36H763V174H772 M1155 36H1164V174H1155 M753 98H780 M1152 136H1178')+label(1177,183,'n',22)
b+=label(1178,115,'+ (2n - 1)H₂O',28,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1390" height="220" viewBox="0 0 1390 220"><title>Sơ đồ theo nguồn1382</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pet-native1382-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1382,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2Ph6innerdouble/2literalHOupperDOUBLE-leftreactant-and-product/OdownproductSINGLE/1filledRIGHT/2,7-5,5bar-220-260°C/nHO-[CH2]2-OH/product[CH2]2]nEXTRAclosingSQUARE/outerSQUAREnSUB/2crossboundarybonds/+(2n-1)H2O/alltrueDAMuprightDDH/noaddedbalancefix-structures-answer')
(K/'cau-truc-pet-native1382-ddh-lo-314-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
