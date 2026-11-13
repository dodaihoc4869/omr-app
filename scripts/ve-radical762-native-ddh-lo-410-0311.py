"""Ba giai đoạn gốc tự do nguồn762; từng C, H, chấm và ngoặc riêng."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='8db96b4e6d904c93e0be63e12964f4b1c668d38614bd4c2a205d0c5f6231b004';b=''
def path(d,w=1.4):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#202020" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1.4):path('M'+'L'.join(f'{x} {y}'for x,y in v),w)
def lab(x,y,t,z=28,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def dot(x,y,r=4.4):
 global b
 b+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="#202020"/>'
def arrow(x1,x2,y):
 line([[x1,y],[x2,y]],1.8);path(f'M{x2-7} {y-6} L{x2} {y} L{x2-7} {y+6}',1.8)
def atom(x,y,yt,yb,zt=28):
 lab(x,y,'C',28);lab(x,yt,'H',zt);lab(x,yb,'H',zt)
 line([[x,yt+4],[x,y-24]],1.2);line([[x,y+4],[x,yb-24]],1.2)
def chain(xs,y,yt,yb,leftR,rightR=False,radical=False):
 for x in xs:atom(x,y,yt,yb)
 lab(leftR,y,'R');line([[leftR+14,y-9],[xs[0]-14,y-9]],1.7)
 for x1,x2 in zip(xs,xs[1:]):line([[x1+14,y-9],[x2-14,y-9]],1.7)
 if rightR:
  lab(rightR,y,'R');line([[xs[-1]+14,y-9],[rightR-14,y-9]],1.7)
 if radical:dot(xs[-1]+22,y-9)
def square(x1,x2,yt,yb,nx,ny):
 path(f'M{x1+11} {yt} H{x1} V{yb} H{x1+11}',1.8);path(f'M{x2-11} {yt} H{x2} V{yb} H{x2-11}',1.8);lab(nx,ny,'n',23)
lab(2,36,'- Giai đoạn 1: Khơi mào',31,'start');lab(2,213,'- Giai đoạn 2: Phát triển mạch',31,'start');lab(2,402,'- Giai đoạn 3: Tắt mạch',31,'start')
lab(384,121,'R');lab(435,121,'R');line([[398,112],[420,112]]);arrow(454,490,112);lab(500,121,'2R',28,'start');dot(542,111)
lab(618,121,'và',28)
atom(698,121,68,174);atom(750,121,68,174)
line([[713,107],[735,107]]);line([[713,113],[735,113]])
lab(779,121,'+',25);lab(808,121,'R');dot(823,111);arrow(845,881,111)
chain([963,1015],121,68,174,908,radical=True)
# Phát triển mạch: ba chấm thấp là dấu lược, tách khỏi năm chấm gốc tự do ở hai bước trên.
chain([453,503],304,254,356,400,radical=True)
lab(548,304,'+',25);atom(579,304,254,356);atom(629,304,254,356)
line([[593,289],[615,289]]);line([[593,296],[615,296]])
lab(658,304,'+',25)
for x in [683,690,697]:dot(x,299,1.8)
arrow(726,762,295)
chain([838,887,943,1004],303,250,352,785,radical=True);square(862,971,228,356,983,365)
# Tắt mạch: nối thêm R bên phải, không thêm hệ số hoặc đầu mũi tên khác.
chain([427,475,531,591],495,444,545,375,radical=True);square(451,559,422,549,570,558)
lab(638,495,'+',25);lab(669,495,'R');dot(684,485);arrow(707,745,485)
chain([834,882,938,999],492,439,540,782,rightR=1047);square(858,965,416,544,976,553)
# Bốn phần chữ bị cắt tại mép trên, giữ mảnh nhỏ chứ không đoán chữ.
path('M222.5 0 Q224 2.5 229 2.5 Q233 2.5 234.5 0',1.5)
path('M278 0 L278 2 Q282 3 283.5 0',1.5)
path('M456.5 0 Q458 2.5 463 2.5 Q467 2.5 468.5 0',1.5)
dot(552.5,0,1.3)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1255" height="553" viewBox="0 0 1255 553"><title>Ba giai đoạn theo nguồn762</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='radical762-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='4TOPcroppedUNKNOWNfragmentsretain-BOTTOMnCROP/20printedC40explicitH-UNKNOWNnTotal/Runknown/7radicalFILLEDdots+3SEPARATElowellipsisDots/4RIGHTOPENVheads/3SQUAREpairsincludeMIDDLE2C+nSUB/2CCdouble4rays/ALLregularUPRIGHT/EXACT- Giai đoạn 1: Khơi mào- Giai đoạn 2: Phát triển mạch- Giai đoạn 3: Tắt mạch/và/2RBASELINE/individualC-H-C-CstrokesWHITEgaps/terminalRRIGHT/NOaddedRformula-initiator-condition-answer-alias/nativeapproxNOTsubpixel'
r=dict(i=762,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-radical762-native-ddh-lo-410-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-radical762-lo-410.json').write_text(json.dumps(dict(hash=h,native=[1255,553],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL2x/stage2and3macros3x/TOPcrop6x. Individualatoms/7radicaldots vs3lowellipsis/4OPENVheads/3SQUAREpairs. NativeapproxNOTsubpixel/noautomaticgate.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
