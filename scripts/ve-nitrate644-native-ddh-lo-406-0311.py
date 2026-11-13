"""Nguồn644: hai ghế có nét trước liền, từng đoạn đứt và nhãn gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-nitrate644-lo-406.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,fill='none',stroke='#202020',w=1.4):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1.4):path('M'+'L'.join(f'{x} {y}'for x,y in v),w=w)
def lab(x,y,t,z=23,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=23):lab(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
def last(x,y,t,z=23):lab(x+F.advance(t[-1],z)/2,y,t,z,anchor='end')
for side in ['left','right']:
 c=g[side]
 for v in c['thinBackPaths']:line(v)
 # Mỗi đường kín là hợp liền của hai nêm và cạnh trước, không thêm khe nối.
 v=p['rootSourceAudit']['frontIndividualOutlinesApprox'][side]
 path('M'+'L'.join(f'{x} {y}'for x,y in v)+'Z','#202020','none',0)
 line(c['upperBranch']);line(c['rightO']['bond'])
 for key in (['leftHO','lowerOH'] if side=='left' else ['leftGroup','lowerGroup']):line(c[key]['bond'])
 d=c['cutDashes']
 for key in ['leftSegments','rightSegments']:
  for v in d[key]:line(v)
 line(d['leftRingStub'])
lab(203,75,'O');first(126,21,'OH');last(50,135,'HO');first(236,147,'OH');lab(322,96,'O')
lab(897.5,84,'O');first(821,28,'ONO₂');last(745,142,'O₂NO');first(930,161,'ONO₂');lab(1016,105,'O')
line(g['arrow']['shaft'],1)
v=g['arrow']['filledHeadApprox'];path('M'+'L'.join(f'{x} {y}'for x,y in v)+'Z','#202020','none',0)
# Vết nhỏ riêng dưới bên trái đầu trục, không đoán là ký tự hay mũi tên.
path('M398.6 115.5 L399.4 115.5',stroke='#777777',w=0.8)
t='+ HNO₃ (đặc)/xt H₂SO₄ đặc, t';lab(396,95,t,19,anchor='start');lab(396+F.advance(t,19)+1,85,'o',12,anchor='start')
lab(525,145,'- H₂O',21)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="169" viewBox="0 0 1080 169"><title>Công thức theo nguồn644</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nitrate644-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=644,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='12drawnC16O3N-EXCLreagent-water-UNKNOWNouterpolymerC/2CHAIRrings2ringO-2bareCH2branchesNOaddedCH2text/4TAPER2boldfront-as2individualCONTINUOUSfilledoutlines-NOverticaltemplate/LL6incltinyterminaldot-LR5-RL5-RR5individualcutcomponents+2ringstubs/3leftOHorHO-2productONO2-1productO2NO-LASTOanchor-SUB234/1FULLFILLEDrighthead-1tinyLEFTbelowshaftUNKNOWNfleck/EXACT+ HNO₃ (đặc)/xt H₂SO₄ đặc, tSUPsmallLatin_o-EXACT- H₂O/ALLregularUPRIGHT/NOadded3coeff-H-charge-n-bracket-caption-answer-alias')
(K/'cau-truc-nitrate644-native-ddh-lo-406-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
