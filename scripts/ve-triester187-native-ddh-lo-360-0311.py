"""Ba mạch chất béo nguồn187: giữ nguyên công thức thu gọn và các chỉ số."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1ffe7bcaa97292e597941bb434ee8234af6d69197d13f608d6ad26268be40f87';b=''
def formula(parts,right,y,size=12.4):
 x=right-sum(F.advance(t,size*.7 if sub else size)for t,sub in parts);out=''
 for t,sub in parts:
  z=size*.7 if sub else size
  out+=F.label(x,y+(3 if sub else 0),t,z,anchor='start',fill='#202020');x+=F.advance(t,z)
 return out
rows=[ [('CH',0),('3',1),('[CH',0),('2',1),(']',0),('14',1),('COO',0)], [('CH',0),('3',1),('[CH',0),('2',1),(']',0),('7',1),('CH=CH[CH',0),('2',1),(']',0),('7',1),('COO',0)], [('CH',0),('3',1),('[CH',0),('2',1),(']',0),('4',1),('CH=CHCH',0),('2',1),('CH=CH[CH',0),('2',1),(']',0),('7',1),('COO',0)] ]
for parts,y in zip(rows,[14,48,82]):b+=formula(parts,246,y)
for y,sub in [(15,True),(49,False),(83,True)]:
 x=285-F.advance('C',14)/2;b+=F.label(x,y,'CH',14,anchor='start',fill='#202020')
 if sub:b+=F.label(x+F.advance('CH',14),y+3,'2',9.8,anchor='start',fill='#202020')
for x,y,u,v in [(251,9,278,9),(251,43,278,43),(251,77,278,77),(285,17,285,36),(285,51,285,70)]:
 b+=f'<path d="M{x} {y}L{u} {v}" stroke="#202020" stroke-width="1" fill="none"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="308" height="89" viewBox="0 0 308 89"><title>Ba mạch chất béo theo nguồn187</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='triester187-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=187,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3literalcondensedacylCH3[CH2]14COO-CH3[CH2]7CH=CH[CH2]7COO-CH3[CH2]4CH=CHCH2CH=CH[CH2]7COO/ALLregularUPRIGHT/3equals/3horizontal2verticalbondsFIRSTCanchors/CH2-CH-CH2right/SQUAREbracketsSUB2-3-4-7-14/0arrows0stereo/noexpandedCO-H-formula-answer')
(K/'cau-truc-triester187-native-ddh-lo-360-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
