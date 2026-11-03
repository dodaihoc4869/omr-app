"""Ba đồ thị phương án: giữ đúng mức dương hoặc không tại plateau."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
def axes():
 return '<path d="M95 38V240H355M85 58L95 35L105 58M335 230L360 240L335 250" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'+F.label(78,269,'0',26)+F.label(119,55,'n',28)+F.label(350,219,'t',28)
b=axes()+'<path d="M95 100H235" fill="none" stroke="#77718f" stroke-width="2" stroke-dasharray="2 5"/><path d="M95 240L235 100H325" fill="none" stroke="#252440" stroke-width="2.8"/>'+F.label(82,108,'0,1',27,'end')
save(484,400,290,b,'Đường tăng thẳng từ0 đến0,1 rồi ngang hữu hạn; gióng ngang chấm,không đơnvị/tickthờigian/caption.')
b=axes()+'<path d="M95 200H325" fill="none" stroke="#77718f" stroke-width="2" stroke-dasharray="2 5"/><path d="M95 85C109 160 146 200 195 200H325" fill="none" stroke="#252440" stroke-width="2.8"/>'+F.label(82,93,'0,1',27,'end')
save(1286,400,290,b,'Giảm từ0,1 về plateau DƯƠNG không ghi số; có gióng chấm;không suy giátrị cân bằng.')
b=axes()+'<path d="M95 85C108 162 154 221 210 240H325" fill="none" stroke="#252440" stroke-width="2.8"/>'+F.label(82,93,'0,1',27,'end')
save(353,400,290,b,'Giảm từ0,1 về0 trên trụct,sauđó ngang hữu hạn,khôngcaption/đơnvị/tick/sốmới.')
(M/'cau-truc-do-thi-ddh-lo-39-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
