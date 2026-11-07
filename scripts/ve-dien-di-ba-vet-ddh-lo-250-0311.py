"""Nguồn657: điện di ba vệt tròn, giữ dấu cực và thứ tự XYZ nguyên văn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='7a348047068e0dfdf03e6175616c860a866ce3c11c28b5e9a5ca06c1567c5785'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M220 45H553V166H220Z M211 105H220 M553 105H561" fill="none" stroke="#252440" stroke-width="3"/>'
for x,t in [(268,'X'),(386,'Y'),(504,'Z')]:b+=f'<circle cx="{x}" cy="105" r="27" fill="#252440"/>'+F.label(x,117,t,31,fill='#fff',weight='dam')
for x in [192,580]:b+=f'<circle cx="{x}" cy="105" r="19" fill="none" stroke="#252440" stroke-width="3"/>'
b+='<path d="M181 105H203 M192 94V116 M569 105H591" fill="none" stroke="#252440" stroke-width="3"/>'
b+=F.label(20,118,'Cực dương',27,'start',weight='dam')+F.label(608,118,'Cực âm',27,'start',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="734" height="212" viewBox="0 0 734 212"><title>Sơ đồ điện di theo nguồn</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='dien-di-ba-vet-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=657,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3solidblackcirclesXYZwhitebold/outerrect/2terminalcirclesPLUSLEFTMINUSRIGHT/2shortwires/Cực dương-Cực âm/noextra dash-startline-arrow-pH-answer/DDHpath.')
(K/'cau-truc-dien-di-ba-vet-ddh-lo-250-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
