"""Nguồn620: ba đường tổng hợp, giữ nhóm cuối mạch và sáu carbonyl riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-pla620-lo-392.json').read_text());g=p['geometry'];h=p['hash'];b=''
def line(v,w=1.5):
 global b
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+f'" fill="none" stroke="#303030" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=20,weight='de',anchor='middle'):
 global b
 b+=F.label(x,y,t,z,weight=weight,anchor=anchor,fill='#303030')
def first(x,y,t,z=20):
 lab(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
def last(x,y,t,z=20):
 lab(x+F.advance(t[-1],z)/2,y,t,z,anchor='end')
def ital(x,y,t,z=27):
 global b
 b+=f'<g transform="translate({x} {y}) skewX(-10)">'+F.label(0,0,t,z,anchor='start',fill='#303030')+'</g>'
def co(apex,left,right,xs,ys):
 # Mỗi chân nằm trên nhánh riêng; không thêm cầu ngang.
 for x,y in zip(xs,ys):
  arm=left if x<apex[0] else right
  yy=apex[1]+(x-apex[0])*(arm[1]-apex[1])/(arm[0]-apex[0])
  line([[x,yy],[x,y]])
for v in g['lactic']['singleBonds']:line(v)
for v in g['lactic']['COdoubleRays']:line(v)
last(60,56,'HO');last(60,104,'H₃C');lab(117,56,'O');first(117,104,'OH')
lab(92,140,'Lactic acid',31)
for v in g['lactide']['ringBonds']:line(v)
for m in g['lactide']['methylLabels']:line(m['bond'])
co([408,41],[383,54],[422,49],[405,410],[24,24]);co([408,95],[394,87],[431,82],[405,410],[113,113])
last(357,47,'H₃C');first(455,102,'CH₃');lab(408,19,'O');lab(431,61,'O');lab(383,89,'O');lab(408,130,'O');lab(414,165,'Lactide',31)
for v in g['PLA']['singleBonds']:line(v)
co([335,383],[311,397],[350,391],[332.5,337.5],[366,366]);co([414,397],[391,383],[428,389],[411.5,416.5],[414,414]);co([492,383],[468,397],[506,391],[489.5,494.5],[366,366])
last(286,389,'HO');first(311,431,'CH₃');lab(335,362,'O');lab(359,404,'O');first(391,362,'CH₃');lab(414,431,'O');lab(438,389,'O');first(468,431,'CH₃');lab(492,362,'O');first(517,404,'OH')
for key in ['left','right']:line(g['PLA']['squareBrackets'][key])
lab(457,417,'n',20);lab(415,471,'PLA',32,weight='dam')
for a in g['arrows']:
 line(a['shaft'],1.4)
 pts=a['filledHead'];tip=pts[0];l,r=pts[1:];mid=[(l[0]+r[0])/2*.75+tip[0]*.25,(l[1]+r[1])/2*.75+tip[1]*.25]
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in [tip,l,mid,r])+'Z" fill="#303030"/>'
for x,y in [[194,67],[419,242],[217,212]]:
 ital(x,y,'xt, t',27);ital(x+62,y-11,'o',17)
lab(221,113,'(1)',29);lab(381,244,'(2)',29);lab(173,228,'(3)',29)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="546" height="485" viewBox="0 0 546 485"><title>Sơ đồ nguồn620</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pla620-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=620,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3structuresLactic acid-Lactide-PLA/18printedC14O-UNKNOWNn/6COdouble2separatedraysEACH-contactrespectivearms/1lactidering/1SQUAREpair+nSUB-terminalHOLEFT-OHRIGHT/3FILLEDheadsRIGHT-DOWN-DOWNRIGHT/3xt,tSUPoREGULARITALIC-3regularnums/chemicalALLregularUPRIGHT-2regularcaptions-PLAonlyTRUEdam/NOaddedH-water-yield-stereo-formula-answer-alias')
(K/'cau-truc-pla620-native-ddh-lo-392-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
