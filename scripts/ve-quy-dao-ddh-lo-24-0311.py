"""Nguồn1219: A/B/D nằm trên quỹ đạo, C ở giữa hai quỹ đạo."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);a=A[1219]
b='<defs><radialGradient id="hat" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="white"/><stop offset=".7" stop-color="#f7f6fb"/><stop offset="1" stop-color="#c9c6d6"/></radialGradient></defs>'
for rx,ry in[(323,71),(193,37),(139,23)]:b+=f'<ellipse cx="388" cy="131" rx="{rx}" ry="{ry}" fill="none" stroke="#252440" stroke-width="2"/>'
b+='<circle cx="388" cy="132" r="83" fill="url(#hat)" stroke="#77718f" stroke-width="2"/>'
for rx,ry in[(323,71),(193,37),(139,23)]:b+=f'<path d="M{388-rx} 131A{rx} {ry} 0 0 0 {388+rx} 131" fill="none" stroke="#252440" stroke-width="2"/>'
b+=F.label(388,126,'Hạt nhân',26)
for x,y,name in[(526,134,'A'),(563,117,'B'),(609,152,'C'),(646,88,'D')]:b+=f'<circle cx="{x}" cy="{y}" r="15" fill="white" stroke="#77718f" stroke-width="2"/>'+F.label(x,y+7,name,22)
b=('<svg xmlns="http://www.w3.org/2000/svg" width="775" height="266" viewBox="0 0 775 266"><title>Vị trí các ký hiệu trong mô hình theo nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(b).hexdigest();fn='quy-dao-ddh-'+h+'.svg';(M/fn).write_bytes(b);r=dict(i=1219,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=h,byteSvg=len(b),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu='Baellipseđồngtâm;Atrênvòngtrong,Bvònggiữa,Dvòngngoài;Cgiữgiữavònggiữa/ngoài,khôngkéoC lênquỹđạo.')
(M/'cau-truc-quy-dao-ddh-lo-24-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2));print('Đã dựng1219, chờsoát.')
