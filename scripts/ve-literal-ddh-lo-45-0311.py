"""Ion literal và hai alkylbenzene sulfonate, đếm từng carbon."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
b='<path d="M190 90L260 50L330 90L400 50" fill="none" stroke="#252440" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'+F.label(180,105,'H₃N',36,'end')+F.label(410,60,'COO⁻',36,'start')
save(848,590,165,b,'GiữliteralH3Nkhôngdấucộng,2CH2ẩn/COO−;khôngtựsửaphươngán/khôngthêmđiệntíchN.')
def ring(cx):
 return f'<path d="M{cx} 180L{cx+50} 210V270L{cx} 300L{cx-50} 270V210ZM{cx+4} 191L{cx+40} 213M{cx+40} 266L{cx+4} 289M{cx-40} 263V217M{cx} 300V365" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'+F.label(cx-F.advance('S',36)/2,410,'SO₃Na',36,'start')
b=ring(160)+'<path d="M160 180L160 120'+''.join(f'L{160+50*k} {90 if k%2 else 120}'for k in range(1,12))+'" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
save(876,800,445,b,'Alkylthẳng12C+vòngbenzene6C,paraSO3Na;3đôiluânphiênkhôngcircle;khôngtáchion/thêmcharge/tênchất.')
b=ring(190)+'<path d="M70 120L130 85L190 120L250 85L310 120L370 85L430 120L490 85M130 85V40M250 85V40M370 85V40M430 120V165M190 120V180" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
save(910,560,445,b,'Alkyl12C=8Cngang+4methylC2/4/6/7,vònggắnC3,paraSO3Na;3đôivòng;khôngtựchuẩnhoáhình/thêmcharge.')
(M/'cau-truc-literal-ddh-lo-45-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
