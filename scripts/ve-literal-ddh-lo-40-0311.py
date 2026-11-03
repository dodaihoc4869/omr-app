"""Công thức literal: không tự sửa các phương án hóa trị sai."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
for i,arrow in[(277,True),(1285,False)]:
 b='<path d="M250 130L155 65M250 170L155 235M290 130L385 65M290 170L385 235" fill="none" stroke="#252440" stroke-width="2.8" stroke-linecap="round"/>'
 if arrow:b+='<path d="M385 65L365 72L373 83ZM385 235L365 228L373 217Z" fill="#252440"/>'
 b+=F.label(270,165,'S',36)+F.label(148,65,'HO',34,'end')+F.label(148,253,'HO',34,'end')+F.label(407,62,'O',35)+F.label(407,266,'O',35)
 save(i,510,300,b,'S với2HO bằngliênkếtđơn;2S→O bằngmũitên,khôngđổi thành=O.'if arrow else'S với2HO/2O bằng4liênkếtđơn;giữphươngánnguồndùhóatrịkhôngchuẩn,khôngtựthêmđiệntích/đôiliênkết.')
b='<path d="M130 50L240 120L350 55M240 120V205" fill="none" stroke="#252440" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'+F.label(360,60,'COO⁻',36,'start')+F.label(240-F.advance('N',36)/2,244,'NH₃⁺',36,'start')
save(893,540,280,b,'CH3 ẩnởđầunéttrái,CHalpha ởđỉnh,nhánhNH3+ xuốngdưới/COO−phải;khôngthêmstereo/tênchất/sốcarbon.')
(M/'cau-truc-literal-ddh-lo-40-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
