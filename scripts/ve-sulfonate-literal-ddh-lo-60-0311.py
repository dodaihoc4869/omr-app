"""Sulfonate giữ nhóm CH3(CH2)10CH2 và cách ghi expanded sulfonyl."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
b='<path d="M500 160L560 195V265L500 300L440 265V195ZM450 200L500 172M550 203V257M450 263L500 288M440 265L380 300M560 195L609 166M641 155H685M620 130V90M630 130V90M620 178V220M630 178V220" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
b+=F.label(365,320,'CH₃(CH₂)₁₀CH₂',36,'end')+F.label(625,168,'S',36)+F.label(625,80,'O',36)+F.label(625,260,'O',36)+F.label(715-F.advance('O',36)/2,168,'ONa',36,'start')
save(438,900,390,b,'GiữCH3(CH2)10CH2literal/12C,benzenepara3đôi/S(=O)2ONaexpanded;khôngkhaitriểnmấtchỉsố10,khôngcharge/nhãnmới.')
(M/'cau-truc-sulfonate-literal-ddh-lo-60-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
