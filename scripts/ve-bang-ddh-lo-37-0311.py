"""Bảng số liệu sinh học: giữ nguyên mọi số và đơn vị nguồn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
b='<rect x="20" y="20" width="1440" height="270" rx="8" fill="white" stroke="#77718f" stroke-width="1.5"/><path d="M20 90H1460M20 170H1460M510 20V290M985 20V290" fill="none" stroke="#77718f" stroke-width="1.5"/>'
for x,y,label,size in [(265,64,'Nhóm người',30),(747,64,'Nồng độ Dopamine trung bình',28),(1222,64,'Nồng độ DOPAC trung bình',28),(265,139,'Nhóm bệnh nhân Parkinson',29),(747,139,'20,10 ± 3,52 pg/mL',30),(1222,139,'3,75 ± 3,00 pg/mL',30),(265,218,'Nhóm chứng (không bị bệnh',28),(265,260,'Parkinson)',28),(747,240,'31,85 ± 12,56 pg/mL',30),(1222,240,'7,03 ± 4,14 ng/mL',30)]:b+=F.label(x,y,label,size)
save(1353,1480,310,b,'Giữ nguyên dấu phẩy,± và đơn vị ng/mL ở ô DOPAC nhóm chứng (khác pg/mL ở các ô kia); không tự sửa số liệu nguồn.')
(M/'cau-truc-bang-ddh-lo-37-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
