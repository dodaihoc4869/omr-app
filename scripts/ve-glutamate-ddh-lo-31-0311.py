"""Nguồn1229: hai CH2 trong ngoặc2, NH3+/COO− đúng nguyên văn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);a=A[1229]
b='<path d="M175 130L250 95L350 155L440 110M350 155V238M232 60H225V150H232M278 60H285V150H278" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
b+=F.label(164,146,'HOOC',36,'end')+F.label(450,120,'COO⁻',36,'start')+F.label(350-F.advance('N',36)/2,270,'NH₃⁺',36,'start')+F.label(299,165,'2',25,'start')
svg=('<svg xmlns="http://www.w3.org/2000/svg" width="660" height="320" viewBox="0 0 660 320"><title>Công thức cấu tạo theo nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(svg).hexdigest();fn='ion-ddh-'+h+'.svg';(M/fn).write_bytes(svg);r=dict(i=1229,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=h,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu='HOOC–[CH2]2–CH(NH3+)–COO−;CH2/CHẩn nhưnguồn,giữ2ngoặc/2điệntích,khôngthêmnêm/tênchất.')
(M/'cau-truc-glutamate-ddh-lo-31-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2));print('Đã dựng1229, chờsoát sốlặp/điệntích.')
