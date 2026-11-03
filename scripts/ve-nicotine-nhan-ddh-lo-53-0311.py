"""Hai sơ đồ nicotine giữ nhãn nitrogen và cách ghi methyl nguồn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
for i in[1141,1227]:
 b='<path d="M100 225V155L160 120L220 155V225L179 249M141 249L100 225M110 219V161M160 133L210 162M210 213L179 236M220 155L300 135L315 65L390 55L420 120L366 177M333 177L300 135M350 213V258" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
 b+=F.label(160,273,'N',36)+F.label(350,203,'N',36)
 if i==1141:b+=F.label(350,155,'(1)',30)+F.label(350-F.advance('C',36)/2,298,'CH₃',36,'start')
 else:b+=F.label(392,203,'(1)',28)+F.label(203,278,'(2)',28)
 save(i,500,340,b,'Pyridinenitrogenvịtrí1,nhánhpyrrolidinegắnvịtrí3,vòng5N-methyl;giữ(1)trongvòng5vàCH3tườngminh.'if i==1141 else'GiữN(1)pyrrolidine/N(2)pyridine;N-methylẩnđầunétthẳng,khôngtựthêmCH3text;khôngstereo.')
(M/'cau-truc-nicotine-nhan-ddh-lo-53-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
