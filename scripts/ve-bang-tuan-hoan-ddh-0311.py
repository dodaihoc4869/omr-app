"""Hai bảng vị trí nguyên tố: giữ đúng ô/nhãn nguồn, phông app tự chứa."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';spec=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(spec);spec.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash'])
def line(x,y,xx,yy):return f'<path d="M{x} {y}L{xx} {yy}" stroke="#252440" stroke-width="2" fill="none"/>'
b='<rect x="40" y="130" width="704" height="320" fill="none" stroke="#252440" stroke-width="2"/>'
for k in range(1,8):b+=line(40+88*k,130,40+88*k,450)
for k in range(1,4):b+=line(40,130+80*k,744,130+80*k)
for col,name in enumerate(['IA','IIA','IIIA','IVA','VA','VIA','VIIA','VIIIA']):
 x=40+88*col
 if col in[0,7]:b+=f'<rect x="{x}" y="50" width="88" height="80" fill="none" stroke="#252440" stroke-width="2"/>'
 b+=F.label(x+44,36 if col in[0,7]else 110,name,24)
for row,col,name in [(0,0,'Y'),(0,1,'E'),(0,3,'X'),(0,6,'T'),(1,6,'Z'),(2,6,'Q')]:b+=F.label(40+col*88+44,130+row*80+52,name,32)
svg=('<svg xmlns="http://www.w3.org/2000/svg" width="790" height="490" viewBox="0 0 790 490"><title>Vị trí các ký hiệu trong bảng theo nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(svg).hexdigest();fn='bang-ddh-'+h+'.svg';(M/fn).write_bytes(svg);rows=[]
for i in[77,1350]:
 a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=h,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu='Hàngtrên chỉ2ôIA/VIIIA;bên dưới4hàngđủ8ô;Y,E,X,T/Z/Qđúngvịtrí;khôngthêmtênnguyêntố.'))
(M/'cau-truc-bang-ddh-lo-16-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng2nguồn bảng, chờsoátđộc lập.')
