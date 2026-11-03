"""Bốn đồ thị phương án [P]–thời gian, giữ hình dạng riêng theo nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-95.json').read_text())};rows=[]
for i,ox,oy,xx,yt,d in[(300,30,147,165,7,'M30 147L162 17'),(427,34,147,168,7,'M34 147L161 126'),(1364,35,152,177,5,'M35 152C72 122 107 94 150 92Q166 91 176 93'),(659,30,156,176,3,'M30 156C74 158 111 150 137 129Q159 111 175 94')]:
 b=f'<g transform="translate(25 25) scale(3)"><path d="M{ox} {yt+7}V{oy}H{xx-7}" stroke="#252440" stroke-width="1.1" fill="none"/><path d="M{ox} {yt}L{ox-3} {yt+9}L{ox+3} {yt+9}ZM{xx} {oy}L{xx-10} {oy-3}L{xx-10} {oy+3}Z" fill="#252440"/><path d="{d}" fill="none" stroke="#252440" stroke-width="1.2"/></g>'
 b+=F.label(35,290,'[P]',32)+F.label(330,565,'Thời gian',34)
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="610" height="610" viewBox="0 0 610 610"><title>Đồ thị sản phẩm theo thời gian trong nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='san-pham-graph-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='KhôngthêmnhãnA/B/C/D,tick/số/guide. Giữthẳngdốclớn/thẳngdốcnhỏ/conglõmxuốngbãohòa/conglõmlên theo từngPNGsource.'))
(M/'cau-truc-do-thi-san-pham-ddh-lo-95-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
