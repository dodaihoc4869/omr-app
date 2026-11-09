"""Nguồn1329: hai vòng ba nét đôi và OCOCH3 đúng bản gốc, không alias176."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='f0f650c989ecb1b369e6c1de99ad425b2595ff90b5478f652582434c416d9d73';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=2):return f'<path d="{d}" fill="none" stroke="#111" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round"/>'
def label(x,y,t,z=26,anchor='middle'):return F.label(x,y,t,z,anchor=anchor,fill='#111')
def first(x,y,t,z=26):return label(x-F.advance(t[0],z)/2,y,t,z,'start')
b=''
for off in [0,484]:
 b+=path(f'M{8+off} 85L{46+off} 62L{86+off} 85V130L{46+off} 151L{8+off} 130Z M{18+off} 86L{43+off} 72 M{78+off} 92V122 M{18+off} 127L{44+off} 142 M{46+off} 62V30 M{86+off} 85L{109+off} 71')
 b+=first(46+off,24,'COOH')
b+=first(124,70,'OCOCH₃')+first(609,70,'OH')
b+=label(225,116,'+',25)+label(283,116,'H₂O',26,'start')+label(662,116,'+',25)+label(703,116,'CH₃COOH',26,'start')
# Hai nửa đầu mũi tên đặc, hướng trên sang phải và dưới sang trái.
b+=path('M363 99H451 M451 110H363',1.9)
b+='<path d="M451 99L436 94L438 99Z M363 110L378 115L376 110Z" fill="#111"/>'
b+=label(56,186,'Aspirin',31)+label(540,186,'Salicylic acid',31)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="834" height="198" viewBox="0 0 834 198"><title>Phản ứng aspirin theo nguồn1329</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='aspirin-thuy-phan-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1329,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2Ph6innerdouble/18C10Ototal/2COOHtop-OCOCH3left-OHrightliteral/2oppositefilledHALFheads/2plus-H2O-CH3COOH/2regularcaptionsAspirin-Salicylic acid/noaddedconditions-charges-coeff-answer/noalias176')
(K/'cau-truc-aspirin-thuy-phan-ddh-lo-306-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
