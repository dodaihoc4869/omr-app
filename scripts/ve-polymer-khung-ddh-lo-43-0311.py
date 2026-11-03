"""Hai đơn vị lặp xương và cis, giữ nguyên số carbon và ngoặc."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
b='<path d="M60 195L120 160L180 195L240 160L300 195L360 160L420 195M420 195L461 171M500 171L540 195L600 160L660 195L720 160L780 195L840 160L881 184M920 184L980 150M120 160V93M130 154V93M420 195V250M430 201V250M480 132V93M900 216V250M105 40H90V305H105M925 40H940V305H925" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
for x,y,label in[(120,83,'O'),(420,285,'O'),(480,173,'N'),(480,83,'H'),(900,208,'N'),(900,285,'H')]:b+=F.label(x,y,label,36)
b+=F.label(959,321,'n',30)
save(33,1020,355,b,'Ngoặcvuôngn;CO–4CH2–CO–NH–6CH2–NH;2Ocarbonyl2nét và2HtrênN;khôngthêmendgroup.')
b='<path d="M100 116H195M304 135L350 185M355 175H425M350 185H430M430 185L479 135M583 116H680M350 185L280 245M430 185L500 245M165 55C130 115 130 240 165 315M625 55C660 115 660 240 625 315" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
for x,y,label in[(220,130,'CH₂'),(500,130,'CH₂'),(280,285,'H'),(500,285,'CH₃')]:b+=F.label(x-F.advance(label[0],40)/2,y,label,40,'start')
b+=F.label(665,322,'n',30)
save(1001,730,355,b,'C=CngangẩnC;2CH2cùngphíatrên,Hdướitrái/CH3dướiphải;ngoặctrònbaocảnhánh,nngoài;giữcisnguồn.')
(M/'cau-truc-polymer-khung-ddh-lo-43-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
