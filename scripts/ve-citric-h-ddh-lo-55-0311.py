"""Citric acid giữ cả bốn liên kết O–H và ba carbonyl theo nguồn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
b='<path d="M180 200L265 150L350 200L435 150L520 200M350 200V123M350 200V300M180 200V255M190 206V255M520 200V255M530 206V255M180 200L125 167M58 188L87 168M520 200L575 167M613 166L642 190M332 90L286 61M350 300L286 337M344 288L280 325M350 300L415 337M435 373V409" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
for x,y,label in[(350,113,'O'),(270,65,'H'),(105,168,'O'),(40,213,'H'),(595,168,'O'),(660,213,'H'),(180,293,'O'),(520,293,'O'),(265,363,'O'),(435,363,'O'),(435,443,'H')]:b+=F.label(x,y,label,36)
save(1322,720,480,b,'Citric6C/7O:3COOH+OHtrungtâm,2CH2ẩn;giữcả4nétO–H/Htườngminh,3C=O/khôngnêm/charge/caption.')
(M/'cau-truc-citric-h-ddh-lo-55-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
