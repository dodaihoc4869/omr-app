"""Nguồn1022: ba amino acid, nhãn và các chân nối đôi theo native riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='b7a4c92b16d84f90ce71e4bbacf4745772589f6eac6272272670ea39b7d542b8';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="2.6" stroke-linejoin="round"/>'
def first(x,y,t):return F.label(x-F.advance(t[0],32)/2,y,t,32,'start')
def nlast(x,y):return F.label(x-F.advance('H₂',32)-F.advance('N',32)/2,y,'H₂N',32,'start')
b=line('M106 125L130 111L156 126 M189 125L214 111L255 135L297 111L339 135L380 111L406 126 M339 135V168 M126.5 80V112 M133 80V112 M376.5 80V112 M383 80V112')
b+=nlast(91,148)+first(130,75,'NH')+F.label(173,148,'N',32)+F.label(173,176,'H',32)+first(339,197,'NH₂')+F.label(380,75,'O',32)+first(421,148,'OH')
b+=line('M569 126L596 111L639 135L681 111L723 135L765 111L792 126 M723 135V168 M592.5 80V112 M599 80V112 M761.5 80V112 M768 80V112')
b+=F.label(556+F.advance('O',32)/2,148,'HO',32,'end')+F.label(596,75,'O',32)+F.label(765,75,'O',32)+first(807,148,'OH')+first(723,197,'NH₂')
b+=line('M990 125L1017 110L1059 135V168 M1054.663 132.418L1085 114 M1059 140.214L1089 122')+nlast(976,148)+F.label(1102,123,'O',32)+first(1059,197,'OH')
for x,y,t in [(72,185,'(1)'),(309,197,'(2)'),(546,181,'(1)'),(819,181,'(2)')]:b+=F.label(x,y,t,25)
for x,y,t in [(258,251,'Arginine (Arg)'),(681,251,'Glutamic acid (Glu)'),(1024,251,'Glycine (Gly)')]:b+=F.label(x,y,t,30)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1156" height="295" viewBox="0 0 1156 295"><title>Ba amino acid theo nguồn1022</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ba-amino-acid-native1022-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1022,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3AA13C8O6N/4CO1CNdouble/4NH2-1imineNH-1bridgeNplusHseparate/4OH/ALLregularUPRIGHT/4numbers3captionsliteral/GlyCO2diagonalfeet/0charge0stereo/noaddedN-Hline-answer-noalias711')
(K/'cau-truc-ba-amino-acid-native1022-ddh-lo-346-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
