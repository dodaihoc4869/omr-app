"""Mô hình nguồn949: giữ đúng2lớp/7electron và nhãn+7, phôngapp tựchứa."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);a=A[949]
b='<ellipse cx="146" cy="137" rx="106" ry="105" fill="none" stroke="#527aad" stroke-width="2"/><ellipse cx="149" cy="137" rx="75" ry="65" fill="none" stroke="#527aad" stroke-width="2"/><ellipse cx="149" cy="138" rx="33" ry="29" fill="#e63845"/>'
b+=F.label(149,146,'+7',20,fill='white')
for x,y in[(149,72),(149,202),(66,72),(222,63),(236,193),(171,238),(66,204)]:b+=f'<circle cx="{x}" cy="{y}" r="9" fill="#527aad"/>'
b=('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="280" viewBox="0 0 300 280"><title>Mô hình theo nguồn: hai lớp electron</title>'+b+'</svg>').encode();h=hashlib.sha256(b).hexdigest();fn='nguyen-tu-ddh-'+h+'.svg';(M/fn).write_bytes(b);r=dict(i=949,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=h,byteSvg=len(b),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu='Đúng2electron lớp trong/5lớp ngoài,nhãn+7;khôngthêmdấuâm/tênnguyêntố/mũitên.')
(M/'cau-truc-nguyen-tu-ddh-lo-23-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2));print('Đã dựng949, chờsoát.')
a=A[1368];b=''
for cx,cy,rx,ry in[(210,202,134,133),(209,201,105,100),(208,204,76,71)]:b+=f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="#252440" stroke-width="2"/>'
b+='<ellipse cx="208" cy="204" rx="52" ry="46" fill="#ef233c"/>'+F.label(208,212,'+12',20,fill='white')
points=[(210,134),(201,270),(168,109),(238,107),(303,159),(308,226),(243,294),(165,288),(104,203),(112,156),(205,69),(194,328)]
for x,y in points:b+=f'<circle cx="{x}" cy="{y}" r="9" fill="#65a3cf" stroke="#527aad" stroke-width="1"/>'
b=('<svg xmlns="http://www.w3.org/2000/svg" width="432" height="380" viewBox="0 0 432 380"><title>Mô hình nguyên tử theo nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(b).hexdigest();fn='nguyen-tu-ddh-'+h+'.svg';(M/fn).write_bytes(b);r2=dict(i=1368,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=h,byteSvg=len(b),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu='Ba lớp electron2–8–2,nhãn+12;khôngthêmK/L/M,dấuâmhoặctênnguyêntố.')
(M/'cau-truc-nguyen-tu-ddh-lo-23-ban-dung.json').write_text(json.dumps([r,r2],ensure_ascii=False,indent=2));print('Đã dựng thêm1368, cảlô2nguồn chờsoát.')
