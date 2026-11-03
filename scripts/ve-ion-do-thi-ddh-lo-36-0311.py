"""Hai hình ion và đồ thị nồng độ theo đúng nguồn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
b='<path d="M188 92L280 150L374 94" fill="none" stroke="#252440" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
b+=F.label(180,90,'H₃N⁺',36,'end')+F.label(381,96,'COO⁻',36,'start')
save(879,550,200,b,'Một carbon ẩn ở đỉnh chữV;H3N+ trái vàCOO− phải; không thêm tên chất/số carbon.')
b='<path d="M95 40V420H625M85 58L95 35L105 58M603 410L630 420L603 430" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
b+='<path d="M95 420C200 225 325 130 465 130H613M115 50C150 235 225 385 405 385H611" fill="none" stroke="#252440" stroke-width="2.8" stroke-linecap="round"/>'
b+=F.label(356,465,'Thời gian',31)+F.label(48,240,'Nồng độ',31,extra='transform="rotate(-90 48 240)"')+F.label(496,106,'HI',32)+F.label(471,365,'H₂ + I₂',32)
save(1160,670,490,b,'Hai đường nồng độ định tính:HI tăng,H2+I2 giảm;đoạn cân bằng hữu hạn,không thêm tick hoặc số liệu.')
(M/'cau-truc-ion-do-thi-ddh-lo-36-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
