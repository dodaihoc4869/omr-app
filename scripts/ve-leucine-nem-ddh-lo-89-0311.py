"""Leucine: nêm ở liên kết alphaC–CH2, không chuyển sang NH2."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-87.json').read_text())}
def line(x,y,xx,yy):return f'<path d="M{x} {y}L{xx} {yy}" stroke="#252440" stroke-width="4" stroke-linecap="round"/>'
b=''.join(F.label(x,y,t,44) for x,y,t in [(110,175,'H₃C'),(220,345,'CH₃'),(420,345,'NH₂'),(520,77,'O'),(620,235,'OH')])
for seg in [(164,188,220,220),(220,220,320,160),(220,220,220,291),(420,220,420,291),(420,220,520,160),(513,163,513,99),(527,163,527,99),(520,160,577,194)]:b+=line(*seg)
b+='<path d="M420 220L316 166L324 154Z" fill="#252440"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="740" height="400" viewBox="0 0 740 400"><title>Cấu trúc theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='leucine-nem-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
rows=[dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Nêm đặc hẹp alphaC ở phải/dưới, rộng ởCH2 trái/trên. NH2bond thường xuống,2methyl cóchữ;OH giữH,khôngthêmHalpha/caption.')for i in[504,1015]]
(M/'cau-truc-leucine-nem-ddh-lo-89-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
