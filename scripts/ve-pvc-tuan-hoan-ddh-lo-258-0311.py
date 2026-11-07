"""Nguồn726: sơ đồ PVC có nhánh hồi HCl, giữ nguyên mọi điều kiện in nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='5bd4cc64541874682e78f567ab7abdda233a3af621d116db593f3daef68b2b2d'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.4):return f'<path d="{d}" stroke="#252440" stroke-width="{w}" fill="none" stroke-linejoin="round"/>'
b=''
for x,y,t in [(110,96,'CH₂=CH₂'),(239,96,'+ Cl₂'),(490,99,'CH₂—CH₂'),(429,149,'Cl'),(517,149,'Cl'),(642,76,'t°'),(763,99,'HCl'),(827,99,'+'),(959,99,'CH₂=CH—Cl'),(1118,78,'xt, t°'),(1304,99,'CH₂—CH'),(1341,149,'Cl'),(1407,132,'n'),(477,191,'+ O₂, t°'),(483,236,'- H₂O')]:b+=F.label(x,y,t,28 if t!='n' else 22)
b+=line('M429 105V123 M517 105V123 M1341 105V123 M764 115V200H248V113 M1186 87H1231 M1378 87H1414 M1218 51C1202 77 1207 105 1218 125 M1388 51C1403 77 1401 105 1389 126')
for x1,x2,y in [(292,410,90),(583,716,88),(1073,1169,89)]:b+=line(f'M{x1} {y}H{x2-14}')+f'<path d="M{x2-19} {y-6}L{x2} {y}L{x2-19} {y+6}L{x2-15} {y}Z" fill="#252440"/>'
b+='<path d="M242 133L248 113L254 133L248 128Z" fill="#252440"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1459" height="289" viewBox="0 0 1459 289"><title>Sơ đồ phản ứng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pvc-tuan-hoan-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=726,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3RIGHTarrows1UPfeedback/HClreturnUtoCl2/+O2,t°abovebottomline/-H2Obelow/3verticalClbonds/1roundpair+nsub/literalCH2=CH2+Cl2→CH2CH2→HCl+CH2=CHCl→polymer/noextra coeff-answer.')
(K/'cau-truc-pvc-tuan-hoan-ddh-lo-258-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
