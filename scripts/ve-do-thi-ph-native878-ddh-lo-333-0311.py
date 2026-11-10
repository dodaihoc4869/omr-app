"""Đồ thị nguồn878: giữ tọa độ native, không suy đáp án X/Y."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9f90c5790adef287e08a1907a70ddc58734511fc8bf9fbbaf0b3bd310df5e6c3';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='';C='#194f68'
def path(d,w=2.6):
 global b
 b+=f'<path d="{d}" fill="none" stroke="{C}" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,size=17,anchor='middle'):
 global b
 b+=F.label(x,y,t,size,anchor=anchor,fill=C)
path('M57 10H516V401H57Z')
for y,t in [(24,'14'),(75,'12'),(127,'10'),(178,'8'),(229,'6'),(281,'4'),(332,'2'),(383,'0')]:
 path(f'M46 {y}H57');label(24,y+6,t)
for x,t in [(75,'0'),(158,'10'),(240,'20'),(322,'30'),(404,'40'),(487,'50')]:
 path(f'M{x} 401V412');label(x,434,t)
label(71,37,'pH',18,'start');label(287,387,'Thể tích dung dịch X (mL)',17,'start')
# Hai nhánh theo đường in; đuôi phải hơi hạ, không ép đường tăng đơn điệu.
path('M75 359C91 359 104 359 116 359S143 358 157 356S184 353 199 351S228 347 241 343S251 340 257 336S268 331 273 325C279 316 282 309 282 300L282 120C281 114 280 108 282 101C283 98 285 96 287 94C291 89 298 84 304 81S315 77 322 75C336 71 350 68 363 66S392 63 406 62S434 60 447 60S479 61 492 62L516 63')
markers=[(75,359),(116,359),(157,356),(199,351),(241,343),(257,336),(273,325),(281,206),(287,94),(304,81),(322,75),(363,66),(406,62),(447,60),(492,62)]
for x,y in markers:b+=f'<circle cx="{x}" cy="{y}" r="7.7" fill="{C}"/>'
# Mảnh mực xanh ở mép trái có thật; không đặt tên/khôi phục chữ bị cắt.
path('M0 197H4',1.8)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="531" height="447" viewBox="0 0 531 447"><title>Đồ thị pH theo nguồn878</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='do-thi-ph-native878-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=878,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1bluecurve15solidcirclemarkers/closedframe0heads0grid/8Y6Xnumbers/native0Y383-vsframe401/lastmarker492-vstick50487/regularupright-pH-Thể tích dung dịch X (mL)/tinycroppedLEFTmark0..4y197intentUNKNOWNretained/noaddedXYanswer-equivalence-guide')
(K/'cau-truc-do-thi-ph-native878-ddh-lo-333-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
