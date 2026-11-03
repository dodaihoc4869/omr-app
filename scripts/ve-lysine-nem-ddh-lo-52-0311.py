"""Hai nguồn lysine giữ nêm NH2 và bốn nhóm CH2."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
b='<path d="M110 135L160 160L230 120L300 160L370 120L440 160L510 120L568 153M510 120V75M520 114V75" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M438 160H442L452 230H428Z" fill="#252440"/>'
b+=F.label(100,150,'H₂N',36,'end')+F.label(510,65,'O',36)+F.label(580,180,'OH',36,'start')+F.label(440-F.advance('N',36)/2,265,'NH₂',36,'start')
for i in[904,1078]:save(i,730,310,b,'H2N–4CH2–CH(NH2)–COOH;alphaNH2nêmđặcxuống/COOHtrênphải/chuỗitrêntrái,giữSnguồn;carbonylup,trunghòa,khôngthêmmã/tênchất.')
(M/'cau-truc-lysine-nem-ddh-lo-52-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
