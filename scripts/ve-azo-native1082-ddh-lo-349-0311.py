"""Sơ đồ azo nguồn1082: giữ điện tích ngoài ngoặc và nhãn nguyên văn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-azo1082-lo-349.json').read_text());g=p['geometry'];h=p['hash']
def line(pts):return '<path d="M'+'L'.join(f'{x} {y}' for x,y in pts)+'" fill="none" stroke="#252440" stroke-width="1" stroke-linejoin="round"/>'
def ring(r):
 v=r['vertices'];return line(v+[v[0]])+''.join(line(v)for v in r['innerDoubleRays'])
def first(x,y,t,size=15):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def boxlabel(a,size=14):
 x0,y0,x1,y1=a['bbox'];return F.label((x0+x1)/2,y1-2,a['text'],size)
b=''
for a in [g['aniline'],g['diazonium'],g['phenolAboveArrow2']]:b+=ring(a['ring'])+line(a['branchBond'])
b+=first(34,42,'NH₂')+first(225,39,'N₂')+first(349,15,'OH')
a=g['diazonium'];b+=line(a['leftBracket'])+line(a['rightBracket'])+F.label(257.5,30,'+',10)+F.label(262,41,'Cl',15,'start')+F.label(281,29,'−',11)
b+=boxlabel(g['phenolAboveArrow2']['plusToLeft'],15)
a=g['azoProduct']
for r in a['rings']:b+=ring(r)
for ps in [a['leftArm'],a['rightArm'],a['OHbond']]+a['azoDoubleRays']:b+=line(ps)
b+=boxlabel(a['Nleft'],15)+boxlabel(a['Nright'],15)+first(578.5,29,'OH')+boxlabel(a['caption'],14)
for a in g['arrows']:
 b+=line(a['shaft'])+'<path d="M'+'L'.join(f'{x} {y}' for x,y in a['filledHeadTriangle'])+'Z" fill="#252440"/>'
 if 'above'in a:b+=boxlabel(a['above'],14)
 below=a['below'];below=below if isinstance(below,list)else[below]
 for label in below:b+=boxlabel(label,14)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="602" height="115" viewBox="0 0 602 115"><title>Sơ đồ azo theo nguồn1082</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='azo-native1082-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=1082,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='30C5N2O1Cl/5Ph15innerCCdouble1NNdouble2separatedslopingrays/N2insideSQUAREplusSUPoutsideRIGHT-ClminusSUP/NH2-OHfirstanchors/ALLregularUPRIGHT/2FILLEDrightheads/+HNO2+HCl/(1)0 - 5°C/(2)/(màu cam)/productrightarmLOWERLEFTphenyl/noaddedNaNO2-yield-water-NH-answer')
(K/'cau-truc-azo-native1082-ddh-lo-349-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
