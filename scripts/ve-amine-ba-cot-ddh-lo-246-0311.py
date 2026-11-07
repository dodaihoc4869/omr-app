"""Nguồn582: ba cột và các nhãn nguyên văn, không thêm đơn vị hoặc giá trị."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='6cb4208a5afea03cc96dab09c2eaa47e681fc44caff7baa5f9378b97ae032253'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
for x,y,w in [(157,96,59),(320,323,60),(477,299,59)]:b+=f'<path d="M{x} 427V{y}H{x+w}V427Z" fill="#808080"/>'
b+='<path d="M87 53V427H585" fill="none" stroke="#252440" stroke-width="1.6"/><path d="M87 47L82.5 59L87 55L91.5 59Z M592 427L580 422.5L584 427L580 431.5Z" fill="#252440"/>'
for y,x in [(96,216),(299,536),(323,380)]:b+=f'<path d="M92 {y}H{x}" fill="none" stroke="#252440" stroke-width="1.7" stroke-dasharray="3.6 3.6"/>'
for y,t in [(103,'9,40'),(306,'3,37'),(331,'3,23')]:b+=F.label(83,y,t,20,'end')
for x,t in [(186,'Aniline'),(350,'Dimethylamine'),(507,'Ethylamine')]:b+=F.label(x,455,t,18)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="634" height="501" viewBox="0 0 634 501"><title>Đồ thị ba amine theo nguồn</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='amine-ba-cot-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=582,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3graybars/3dashedguides/2axisheads/literal9,40-3,37-3,23/Aniline-Dimethylamine-Ethylamine/noaddedzero-ticks-units-title-answer/DDHpath.')
(K/'cau-truc-amine-ba-cot-ddh-lo-246-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
