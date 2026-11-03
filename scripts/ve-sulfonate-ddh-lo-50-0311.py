"""Ba chất hoạt động bề mặt, giữ nhãn thu gọn và từng carbon nguồn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
def ring(cx):
 return f'<path d="M{cx} 180L{cx+50} 210V270L{cx} 300L{cx-50} 270V210ZM{cx+4} 191L{cx+40} 213M{cx+40} 266L{cx+4} 289M{cx-40} 263V217M{cx} 300V365" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'+F.label(cx-F.advance('S',36)/2,410,'SO₃Na',36,'start')
b='<path d="M60 100'+''.join(f'L{60+50*k} {130 if k%2 else 100}'for k in range(1,12))+'L640 112" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'+F.label(660-F.advance('O',36)/2,113,'OSO₃Na',36,'start')
save(839,950,200,b,'12CalkylthẳngkếtnốiOSO3Na literal,giữOphâncáchalkyl/S,khôngthêmdấuđiệntích/táchnhóm.')
b=ring(190)+'<path d="M130 85L190 120L250 85L310 120L370 85L430 120L490 85L550 120L610 85L670 120M610 85V30M610 85L670 50M190 120V180" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
save(1273,740,445,b,'12Calkyl:CH3–CH(Ar)–6CH2–C(CH3)3;benzeneparaSO3Na/3đôi;nguồnkhôngB.khôngthêmnhãn.')
b=ring(370)+'<path d="M130 120L190 85L250 120L310 85L370 120L430 85L490 120L550 85L610 120L670 85L730 120M670 85V30M370 120V180" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
save(363,800,445,b,'12Calkyl:alphaAr+nBu4C+(CH2)4–CH(CH3)2;3đôivòng/paraSO3Na;nguồnkhôngA.khôngthêmnhãn.')
(M/'cau-truc-sulfonate-ddh-lo-50-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
