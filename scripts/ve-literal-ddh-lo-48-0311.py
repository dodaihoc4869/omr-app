"""Lựa chọn công thức literal, giữ nguyên mọi liên kết đọc thấy trong nguồn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
b='<path d="M210 160L145 90M240 160L305 90M210 200L145 270M240 200L305 270M155 55H295M155 295H295M65 180H200M250 180H385" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round"/>'
for x,y,label in[(225,193,'S'),(130,70,'O'),(320,70,'O'),(130,310,'O'),(320,310,'O'),(40,193,'H'),(410,193,'H')]:b+=F.label(x,y,label,36)
save(584,450,360,b,'Giữnguyênlựachọnliteral:S–4Ođơn,2O–Ongang,2Hnốitrực tiếpS;khôngtựsửathànhH2SO4chuẩn. S–Hphải đọc native+zoom thấyvệtnganggầnliêntục,khôngcăncứnêmđứt;dựngnétđơnđọcthấy,khônggánstereo.')
(M/'cau-truc-literal-ddh-lo-48-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
