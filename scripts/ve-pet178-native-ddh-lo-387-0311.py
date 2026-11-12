"""Sơ đồ PET nguồn178; ba vòng đọc riêng, giữ hai đầu HO…H theo native."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-pet178-lo-387.json').read_text());g=p['geometry'];h=p['hash'];b=''
def line(v,w=2):
 global b
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+f'" fill="none" stroke="#303030" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=26,weight='de',anchor='start'):
 global b
 b+=F.label(x,y,t,z,weight=weight,anchor=anchor,fill='#303030')
def chem(x,y,t,z=26):
 xx=x
 for c in t:
  sub=c in '₂₃';char={'₂':'2','₃':'3'}.get(c,c);size=z*.7 if sub else z
  lab(xx,y+6 if sub else y,char,size);xx+=F.advance(char,size)
for key in ['xylene','TPA','polymer']:
 r=g[key];line(r['ringVertices']+[r['ringVertices'][0]])
 for v in r['innerDoubleRays']:line(v)
for key in ['xylene','TPA']:
 for r in g[key]['labels']:line(r['bond'])
chem(53,88,'CH₃');chem(53,249,'CH₃')
lab(390,70,'COOH',23);lab(390,252,'COOH',23)
r=g['polymer']
for v in r['singleBonds']:line(v)
for pair in r['COdoubleRays']:
 for v in pair:line(v)
chem(823,164,'HO');lab(907,164,'C',26,anchor='middle');lab(907,128,'O',26,anchor='middle')
lab(1073,164,'C',26,anchor='middle');lab(1073,128,'O',26,anchor='middle');lab(1118,164,'O',26,anchor='middle')
chem(1151,164,'CH₂');chem(1211,164,'CH₂');lab(1284,164,'O',26,anchor='middle');lab(1313,164,'H')
b+='<path d="M891 91 C867 121 867 168 892 199 M1285 92 C1309 120 1309 168 1285 195" fill="none" stroke="#303030" stroke-width="2"/>'
lab(1304,202,'n',24)
for ar in g['arrows']:
 line(ar['shaft'],1.3)
 for v in ar['openV']:line(v,1.3)
for x,t in [(16,'p-xylene'),(289,'Terephthalic acid (TPA)'),(868,'Poly (ethylene terephthalate) (PET)')]:lab(x,30,t,24)
# Điều kiện nhỏ riêng; o là chữ o trên cao, không thay bằng ký hiệu nhiệt độ.
chem(159,15,'+O₂, xt, t',16);lab(235,8,'o',10)
lab(625,15,'+Ethylene glycol (EG), xt, t',15);lab(829,8,'o',10)
lab(166,40,'H = 85%',16,weight='dam');lab(690,40,'H =90%',16,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1372" height="254" viewBox="0 0 1372 254"><title>Sơ đồ tổng hợp PET theo nguồn178</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pet178-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=178,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='26C9OstructuresEXCLconditions/3Ph9innerCCdouble-XyleneupperLEFTlowerLEFTverticalRIGHT-TPAopposite-Producthorizontal/2explicitCOverticalraysWHITEgapbeforeCglyph/2OPENVheads/ONLY2HpercentTRUEdam-othersregularUPRIGHT/SUB23-tSUPo-nSUB/EXACTp-xylene-Terephthalic acid (TPA)-Poly (ethylene terephthalate) (PET)/HOlastO-CH3firstC-COOHfirstC/terminalHOoutsideLEFT-HoutsideRIGHT/NOtheorynormalize-addedH2O-formula-answer-alias')
(K/'cau-truc-pet178-native-ddh-lo-387-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
