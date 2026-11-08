"""Nguồn915: dựng riêng ba quỹ đạo và mười ba chấm theo tọa độ ảnh nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a7118b78945b807e8d7273423417bd1390c623a8d5819040f32893a0a5851ca8';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
for r in [53,91,132]:b+=f'<circle cx="177" cy="179" r="{r}" fill="none" stroke="#b77a37" stroke-width="1.5"/>'
b+='<circle cx="175" cy="179" r="29" fill="#9ebaff"/>'+F.label(175,187,'+13',21,fill='#916f4c',weight='dam')
for x,y in [(176,128),(178,231),(140,98),(221,101),(263,144),(263,211),(228,253),(146,261),(99,223),(91,151),(178,47),(46,183),(179,310)]:b+=f'<circle cx="{x}" cy="{y}" r="8" fill="#ef8a3b"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="352" height="352" viewBox="0 0 352 352"><title>Mô hình nguyên tử theo nguồn915</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bohr-aluminium915-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=915,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='RIÊNGsource915notalias540352/3continuousorbits13orangedots2-8-3literalcoords/outerTOPLEFTBOTTOMnoRIGHT/1bluecore+13brownactualdam/noaddedlayernums-KLM-name-arrow-answer.')
(K/'cau-truc-bohr-aluminium915-ddh-lo-279-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
