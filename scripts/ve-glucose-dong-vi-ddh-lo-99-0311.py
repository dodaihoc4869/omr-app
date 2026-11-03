"""Giữ isotope18O và biếnx/y trong sản phẩm, không suy đáp án."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('haworth',G/'scripts/haworth-ddh-0311.py');H=importlib.util.module_from_spec(s);s.loader.exec_module(H);F=H.F
r=next(r for r in json.loads((M/'doc-molecule-lo-95.json').read_text())if r['i']==1222)
branches={c:{'up':v['up'],'down':v['down']}for c,v in r['haworth'].items()if c!='ring'}
b='<g transform="translate(20 0)">'+H.body(branches)+'</g>'+F.label(655,270,'+',42)+F.label(755,270,'H₃C–¹⁸O–H',42,'start')
b+='<path d="M1100 255H1330" stroke="#252440" stroke-width="3"/><path d="M1350 255L1327 247V263Z" fill="#252440"/>'+F.label(1225,215,'HCl khan',34)
b+=F.label(1410,270,'A',42,'start',weight='dam')+F.label(1460,270,'(C',42,'start')+F.label(1505,282,'7',28,'start')+F.label(1525,270,'H',42,'start')+F.label(1558,282,'x',28,'start')+F.label(1578,270,'O',42,'start')+F.label(1613,282,'y',28,'start')+F.label(1633,270,')',42,'start')+F.label(1720,270,'+',42)+F.label(1795,270,'H₂O',42,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1960" height="470" viewBox="0 0 1960 470"><title>Phản ứng với methanol đồng vị theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-dong-vi-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
row=dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',ghiChuDung='GiữmọiH/OHhướngvòngtheosource;18suptrướcO/không18C;C7HxOygiữx/ybiếnpathLatinởvịtrísubscript,khôngfallbackglyphsubx/y;AđậmWOFF2thật.')
(M/'cau-truc-glucose-dong-vi-ddh-lo-99-ban-dung.json').write_text(json.dumps([row],ensure_ascii=False,indent=2))
