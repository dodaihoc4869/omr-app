"""Hai amino acid giữ nêm lập thể và nhãn nhóm chức."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
def atom(x,y,label):return F.label(x-F.advance(label[0],36)/2,y,label,36,'start')
b='<path d="M105 130L160 100L230 140L300 100L370 140L440 100L495 130M160 100V59M170 94V59M440 100V59M450 106V59" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M368 140H372L382 210H358Z" fill="#252440"/>'
b+=F.label(95,150,'HO',36,'end')+atom(160,52,'O')+atom(440,52,'O')+F.label(505,150,'OH',36,'start')+atom(370,245,'NH₂')+F.label(75,220,'(1)',30)+F.label(520,220,'(2)',30)
save(276,660,290,b,'HOOC–2CH2–CH(NH2)–COOH;2carbonylup,NH2nêmđặcxuống;nhãn(1)COOHtrái/(2)COOHphải,khôngđiệntích.')
b='<path d="M110 130L160 100L211 130M248 130L300 100L370 140L440 100L510 140L580 100L635 130M160 100V65M170 106V65M580 100V59M590 106V59" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M508 140H512L522 210H498Z" fill="#252440"/>'
b+=F.label(100,150,'H₂N',36,'end')+atom(160,52,'NH')+F.label(230,153,'N',36)+F.label(230,185,'H',30)+atom(580,52,'O')+F.label(645,150,'OH',36,'start')+atom(510,245,'NH₂')+F.label(75,220,'(1)',30)+F.label(457,245,'(2)',30)
save(278,790,290,b,'H2N–C(=NH)–NH–3CH2–CH(NH2)–COOH;NH2nêmđặcxuống;nhãn(1)H2Nguanidine/(2)NH2alpha,khôngđiệntích.')
(M/'cau-truc-amino-nem-ddh-lo-47-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
