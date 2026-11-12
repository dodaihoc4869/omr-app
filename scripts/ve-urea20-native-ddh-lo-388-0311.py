"""Sơ đồ PET nguồn178; ba vòng đọc riêng, giữ hai đầu HO…H theo native."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-urea20-lo-388.json').read_text());g=p['geometry'];h=p['hash'];b=''
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
# Từng nét nguồn riêng; hai chân trái đầu có khe trắng, hai chân sau nối thật.
for v in g['mainBonds']:line(v,1.6)
for c in g['mainCarbonyls']:
 rays=c['rays']
 # Chân nối tính từ giao điểm với hai cánh xiên; khe đầu giữ rõ một hàng native.
 x=c['C'][0]
 if x in (103,247):rays[0][1][1]=53
 else:rays[0][1][1]=54+(x-rays[0][0][0])*9/16
 rays[1][1][1]=54+(rays[1][0][0]-x)*7/(11 if x==608 else 12)
 for v in rays:line(v,1.6)
 lab(x,20,'O',25,anchor='middle')
for x in [47,119,191,263,335,407,551,623]:lab(x,83,'NH',25)
lab(489,83,'N',25)
r=g['sideBranch']
for key in ['NtoCO','COupperRay','COinnerParallel','COtoNH','NHtoCH2','CH2toOH']:line(r[key],1.6)
lab(454,146,'O',25);lab(515,146,'NH',25);lab(599,146,'OH',25)
for key in ['leftEndDashes','rightEndDashes']:
 for v in g[key]:line(v,1.6)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="754" height="151" viewBox="0 0 754 151"><title>Đoạn mạch theo nguồn20</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='urea20-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=20,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='10C10N6O/9NH1N/4mainCO1branchCO-4mainCH2-1branchCH2/CO1CO2LEFTwhitegap-CO3CO4LEFTcontact-ALLRIGHTcontact/branchinnerUPPERRIGHTfreegapKEEP/2shortdashesEACHend/ALLregularUPRIGHT-NHliteral-OHfirstO/0ring-arrow-caption-charge/NOaddedH-n-name-formula-answer-noalias9661358')
(K/'cau-truc-urea20-native-ddh-lo-388-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
