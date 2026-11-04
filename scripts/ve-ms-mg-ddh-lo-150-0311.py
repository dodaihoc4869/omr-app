"""Ba cột phổ theo pixel nguồn và nhãn nguyên văn, không chuẩn hoá lại chiều cao."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-molecule-lo-149.json').read_text())if r['i']==1207)
b='<g transform="translate(20 20) scale(2)"><rect x="172" y="70" width="545" height="485" fill="none" stroke="#252440" stroke-width="2"/>'
for y,t in[(70,'100'),(167,'80'),(265,'60'),(363,'40'),(460,'20'),(555,'0')]:
 b+=F.label(151,y+10,t,30,'end')
 if t not in['100','0']:b+=f'<path d="M156 {y}H172" stroke="#252440" stroke-width="2"/>'
for x in[249,327,404,482,558,633]:b+=f'<path d="M{x} 555V570" stroke="#252440" stroke-width="2"/>'
for x,y,label,labelx,by in[(404,168,'80%',418,156),(482,503,'10%',492,491),(558,503,'10%',570,491)]:b+=f'<rect x="{x-3.5}" y="{y}" width="7" height="{555-y}" fill="#696969" stroke="#252440" stroke-width="1.4"/>'+F.label(labelx,by,label,29)
for x,t in[(408,'24'),(486,'25'),(560,'26')]:b+=F.label(x,603,t,30)
b+=F.label(717,603,'m/z',30,'end')+'<g transform="translate(92 314) rotate(-90)">'+F.label(0,0,r['yLabel'],29)+'</g></g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1640" height="1350" viewBox="0 0 1640 1350"><title>Phổ ba đồng vị theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms-mg-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='3bar24/25/26ở404/482/558,top168/503/503bottom555;80%/10%/10%nguyênvăn,KHÔNGchuẩnhoáy10%.6XticksCHỈ3số/6Ylabels/4Ytickmarks/box4cạnh/noarrow-grid/isotopetextthêm.')
(M/'cau-truc-ms-mg-ddh-lo-150-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
