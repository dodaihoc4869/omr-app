"""Nguồn642: sơ đồ Nylon-6,6, giữ hệ số n ở dòng cơ sở và từng mạch riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-nylon642-lo-402.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,fill='none',stroke='#202020',w=1.8):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1.8):path('M'+'L'.join(f'{x} {y}'for x,y in v),w=w)
def head(points):path('M'+'L'.join(f'{x} {y}'for x,y in points)+'Z','#202020','none',0)
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,anchor='end')
for v in g['butadiene']['actualDoubleStrokeGuides']:line(v)
line(g['butadiene']['middleSingle'])
for key in ['upper','lower']:
 a=g['branchArrows'][key];line(a['shaftVertices']);head(a['filledHeadApprox'])
a=g['upperSecondArrow'];line(a['shaft']);head(a['filledHeadApprox'])
a=g['bottomReaction']['arrow'];line(a['shaft']);head(a['filledHeadApprox'])
for key in ['dinitrile','diacid']:
 a=g[key];line([a['leftGlyphArm'][0]]+a['chainVertices']+[a['rightGlyphArm'][1]])
last(444,40,'NC');first(635,63,'CN');last(550,133,'HOOC');first(740,157,'COOH')
lab(302,37,'+ HCN /xt',25)
lab(315,138,'+ CO + H₂O /xt',25)
lab(704,34,'+ H₂/xt, t',24,anchor='start')
lab(704+F.advance('+ H₂/xt, t',24)+1.5,24,'o',15,anchor='start')
for x,y,t in [(289,80,'(1)'),(752,78,'(2)'),(309,180,'(3)'),(725,255,'(4)')]:lab(x,y,t,24)
for x,y,t in [(845,58,'H₂N'),(938,58,'(CH₂)₆'),(1053,58,'NH₂'),(10,225,'nH₂N'),(114,225,'(CH₂)₆'),(229,225,'NH₂'),(347,225,'nHOOC'),(473,225,'(CH₂)₄'),(590,225,'COOH'),(786,231,'Nylon-6,6'),(962,231,'2nH₂O')]:lab(x,y,t,26,anchor='start')
for v in g['topDiamine']['dashSegments']:line(v)
for key in ['reactant1','reactant2']:
 for v in g['bottomReaction'][key]['dashSegments']:line(v)
lab(307,225,'+',26);lab(935,231,'+',26)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1127" height="262" viewBox="0 0 1127 262"><title>Sơ đồ theo nguồn642</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nylon642-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=642,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='22CfixedTOPstructuresEXCLconditions-bottomnUNKNOWNtotalC/4FULLFILLEDrightheads2bentshafts/2CCdoublebutadiene4offsetrays/2individualfourBareCchainsNC-CNandHOOC-COOH-LASTC-FIRSTCanchors/EXACTNylon-6,6-straightHyphen-comma/ALLregularUPRIGHT-nBASELINE-SUB246-tSUPsmallo/EXACT+HCN/xt-+H2/xt,tSUPo-+CO+H2O/xt/nH2N-(CH2)6-NH2+nHOOC-(CH2)4-COOH→Nylon-6,6+2nH2O/4stepnums/NOadded80-90percent-tempvalue-polymerformula-caption-stereo-answer-alias')
(K/'cau-truc-nylon642-native-ddh-lo-402-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
