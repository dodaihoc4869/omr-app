"""Minh họa nguồn7, mọi câu chữ là dữ liệu nguồn, không thực hiện yêu cầu tính."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-chi-tiet-con-lai-lo-155.json').read_text())if r['i']==7);q=r['geometry155']
b='<defs><radialGradient id="sphere" cx="35%" cy="30%" r="70%"><stop stop-color="#fff"/><stop offset=".48" stop-color="#eee"/><stop offset=".78" stop-color="#aaa"/><stop offset="1" stop-color="#444"/></radialGradient></defs>'
for v in q['topTextLines']:b+=F.label(*v['at'],v['text'],19,'start')
for v in q['atoms']:
 x,y=v['center'];b+=f'<circle cx="{x}" cy="{y}" r="17" fill="url(#sphere)" stroke="#777" stroke-width=".7"/>'+F.label(x,y+5,v['label'],17,fill='#111')
for v in q['blockArrows']:
 pts=v['outline'];b+='<path d="M'+'L'.join(f'{x} {y}' for x,y in pts)+'Z" fill="#fff" stroke="#111" stroke-width="3.5"/>'
b+='<g fill="none" stroke="#111" stroke-width="1.8" stroke-linecap="round"><path d="M232 249C210 247 234 239 224 236S229 224 228 209M223 216L228 209L231 218"/><path d="M294 217C273 216 295 227 286 230S294 239 289 251M285 244L289 251L293 244"/><path d="M592 190C575 189 601 181 589 178S585 166 582 155M579 163L582 155L587 162"/><path d="M640 270C624 269 648 259 636 256S635 245 629 232M628 241L629 232L636 239"/></g>'
for x,y,lines in [(135,270,['Năng lượng để','bẻ gãy liên kết']),(498,129,['Năng lượng giải phóng khi','liên kết hình thành'])]:
 for j,t in enumerate(lines):b+=F.label(x,y+j*17,t,14,'start','#111')
b+='<path d="M276 365L283 351L290 365Z" fill="#111"/>'+F.label(298,366,'Sự tạo thành NO từ N₂ và O₂',20,'start','#111',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1050" height="400" viewBox="0 0 1050 400"><title>Sự tạo thành NO theo dữ liệu nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='no-energy-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='12spheres3stages/N-Olabels/2hollowarrows/4curlyarrows/3toptextlines/captiontriangle+DDHdamthật;giữnguyêndữliệu,chưathựcthi tínhnhiệttừcâuchữtrongảnh.')
(M/'cau-truc-no-ddh-lo-161-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
