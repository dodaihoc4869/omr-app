"""Nguồn1270: giữ cực+/−, tuyếnxuấtphát và vị trí B/A/C, không thêm pH/điện tích chất."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);a=A[1270]
b='<rect x="160" y="40" width="600" height="125" fill="none" stroke="#252440" stroke-width="2"/><path d="M460 48V165" fill="none" stroke="#77718f" stroke-width="2" stroke-dasharray="8 6"/>'
for x,label in[(230,'B'),(460,'A'),(730,'C')]:b+=f'<circle cx="{x}" cy="105" r="8" fill="#087f8e"/>'+F.label(x-18 if label=='A'else x,148,label,28)
for x,circle,sign in[(45,117,'+'),(817,891,'−')]:b+=F.label(x,111,'Cực',27)+f'<circle cx="{circle}" cy="102" r="16" fill="white" stroke="#252440" stroke-width="1.8"/>'+F.label(circle,110,sign,26)
b+=F.label(460,214,'Tuyến xuất phát',28)
svg=('<svg xmlns="http://www.w3.org/2000/svg" width="940" height="240" viewBox="0 0 940 240"><title>Vị trí các điểm theo hình nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(svg).hexdigest();fn='dien-di-ddh-'+h+'.svg';(M/fn).write_bytes(svg);r=dict(i=1270,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=h,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu='Cực+trái/cực−phải;Btrái/Atrêntuyến/Cphải;khôngthêmpH/tênchất/điệntíchphântử/mũitên.')
(M/'cau-truc-dien-di-ddh-lo-28-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2));print('Đã dựng1270, chờsoát.')
