"""Giữ chiều ba mũi tên và mã nhựa, đặc biệt03 khác3."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-95.json').read_text())};rows=[]
b='<g fill="none" stroke="#252440" stroke-width="24" stroke-linecap="butt" stroke-linejoin="round"><path d="M180 155L220 85Q250 35 280 85L319 153"/><path d="M350 205L405 300Q423 335 385 335H280"/><path d="M230 335H115Q80 335 97 302L146 211"/></g><g fill="#252440"><path d="M340 190L285 175L340 135Z"/><path d="M250 335L292 302V368Z"/><path d="M165 175L110 191L161 225Z"/></g>'
for i in[1140,792,676,405,1119,1228]:
 num,name=a[i]['text'];body=b+F.label(250,278,num,88,weight='dam')+F.label(250,455,name,65,weight='dam')
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500"><title>Ký hiệu vật liệu theo nguồn</title>'+body+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='tai-che-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',ghiChuDung='3arrowclockwise:tráilên/trênxuốngphải/dướisangtrái. Giữsố5/2/3/4/03/5vàPP/HDPE/PVC/LDPE/PVC/PP;khôngthêm0,1119bắtbuộc03.ChữđậmWOFF2appthật.'))
(M/'cau-truc-ky-hieu-tai-che-ddh-lo-98-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
