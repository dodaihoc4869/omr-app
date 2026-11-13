"""Nguồn408: bốn vòng tròn thơm, ba C carbonyl in chữ và một đỉnh trần."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-aramid408-lo-403.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,fill='none',stroke='#202020',w=1.8):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1.8):path('M'+'L'.join(f'{x} {y}'for x,y in v),w=w)
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,anchor='end')
for a in g['rings']:
 v=a['vertices'];line(v+[v[0]]);c=a['innerCircle'];x,y=c['center'];r=c['radiusApprox']
 b+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="#202020" stroke-width="1.5"/>'
for key in ['leftArm','rightArm']:line(g['diamine'][key])
last(70,197,'H₂N');first(222,110,'NH₂');lab(72,151,'n',27);lab(268,165,'+',26);lab(350,169,'n',27)
for key in ['lowerLeft','upperRight']:
 a=g['diacidchloride'][key]
 for q in ['ringArm','ClArm']:line(a[q])
 for v in a['CO']:line(v)
lab(357,223,'C');lab(357,267,'O');lab(324,199,'Cl',26,anchor='end')
lab(509,136,'C');lab(509,91,'O');lab(538,157,'Cl',26,anchor='start')
a=g['arrow'];line(a['shaft']);path('M'+'L'.join(f'{x} {y}'for x,y in a['filledHeadApprox'])+'Z','#202020','none',0)
a=g['product']['leftN']
for q in ['NHsingle','leftCutBond','ringArm']:line(a[q])
lab(704,256,'N');lab(704,300,'H')
a=g['product']['middleN']
for q in ['NHsingle','leftArm','rightArm']:line(a[q])
lab(856,168,'N');lab(856,125,'H')
a=g['product']['centralCarbonyl'];line(a['ringArm'])
for v in a['CO']:line(v)
lab(894,191,'C');lab(894,234,'O')
a=g['product']['upperRightCarbonyl'];line(a['rootMainPath'])
for v in a['rootRays']:line(v)
lab(1032.5,40,'O')
for q in ['left','right']:line(g['product']['brackets'][q],1.5)
lab(1061,278,'n',23,anchor='start');lab(1127,173,'+',28);lab(1150,177,'2n HCl',28,anchor='start');lab(1352,178,'(1)',30)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1391" height="314" viewBox="0 0 1391 314"><title>Sơ đồ theo nguồn408</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='aramid408-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=408,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='28C4O4NperdrawnUnitsEXCLbyproduct-nUNKNOWNtotal/4Ph24bareC4innerCIRCLES-NO3doublepattern/4CO2raysEACH-3explicitCWHITEgaps-1terminalbareCnativecornerLEFTwhitewedgeRIGHTcontactNOaddedcrossbar/2reactNH2-LASTN-FIRSTNanchors-2reactCl/2productN+2SEPARATEHleftDOWNmiddleUP/1SQUAREpair+nSUB-2nBASELINEcoefficients-EXACT2n HCl/1FULLFILLEDrighthead-EXACT(1)farRIGHT/ALLregularUPRIGHT/individualringvertices-circles/0stereo-conditions-charge/NOaddedH-polymername-formula-answer-alias')
(K/'cau-truc-aramid408-native-ddh-lo-403-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
