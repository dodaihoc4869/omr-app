"""Giữ bốn vùng khoanh khác nhau ở các phương án acid; không sửa phương án sai."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
sources={r['i']:r for r in json.loads((M/'doc-molecule-lo-87.json').read_text())}
def line(x,y,xx,yy):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="3"/>'
b=''
for x,y,t in [(210,250,'C'),(365,250,'C'),(465,150,'O'),(465,350,'O'),(600,350,'H'),(210,120,'H'),(60,250,'H'),(210,380,'H')]:b+=F.label(x,y+15,t,44)
for seg in [(210,148,210,216),(90,250,178,250),(210,282,210,346),(242,250,332,250),(385,222,435,172),(392,229,442,179),(389,277,438,326),(496,350,568,350)]:b+=line(*seg)
rows=[]
for i,cx,cy,rx,ry,rot in [(208,540,350,130,65,0),(95,411,200,145,64,-45),(1052,485,250,212,200,0),(1409,165,250,145,220,0)]:
 ellipse=f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" transform="rotate({rot} {cx} {cy})" fill="none" stroke="#686772" stroke-width="3" stroke-dasharray="1 8" stroke-linecap="round"/>'
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="760" height="500" viewBox="0 0 760 500"><title>Vùng khoanh trong công thức theo nguồn</title>'+b+ellipse+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='acid-khoanh-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(sources[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Đủ3H methyl vàH acid explicit. Giữ vùng khoanh khác nhau từng phương án, không chuẩn hoá thành đáp án. Không thêmA/B/C/D vì nguồn không có và ref đã sau_pa.'))
(M/'cau-truc-acid-khoanh-ddh-lo-88-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
