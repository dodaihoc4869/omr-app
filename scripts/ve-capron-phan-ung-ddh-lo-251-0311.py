"""Nguồn685: giữ vòng lactam và công thức polymer rút gọn nguyên văn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='7f23bb400331776fade83a314fbf4a97b9018a3c7bc899165813dc5d88b8be9f'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
b=line('M134 98L115 70H76L49 99V130L73 154L120 151L134 129 M113 69L121 57 M117 71L125 59')
b+=F.label(132,57,'O',27)
b+=F.label(138-F.advance('N',27)/2,124,'NH',27,'start')
b+=F.label(35,121,'n',27)
b+=line('M197 115H328',2.5)+'<path d="M337 115L325 109V121Z" fill="#252440"/>'
b+=F.label(264,104,'xúc tác, t°',24)
b+=line('M358 115H383 M613 115H636 M383 91Q359 115 383 141 M609 88Q632 115 609 139')
b+=F.label(385,123,'HN – [CH₂]₅ – CO',26,'start')+F.label(630,139,'n',26)
b+=F.label(722,122,'(1)',28)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="778" height="184" viewBox="0 0 778 184"><title>Phản ứng tạo polymer theo nguồn</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='capron-phan-ung-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=685,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='7memberlactamring-NH-COdouble/coefficientn/1RIGHThead/xúc tác,t°/polymerliteralHN–[CH2]5–CO/2roundparentheses+nsub/(1)right/noextraH2O-conditions-answer/DDHpath.')
(K/'cau-truc-capron-phan-ung-ddh-lo-251-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
