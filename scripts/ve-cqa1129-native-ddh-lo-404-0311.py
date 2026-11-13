"""Nguồn1129: giữ từng nét vòng, chân carbonyl và lập thể của ảnh gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-cqa1129-lo-404.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,fill='none',stroke='#202020',w=1.2):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1.2):path('M'+'L'.join(f'{x} {y}'for x,y in v),w=w)
def lab(x,y,t,z=17,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=17):lab(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
def last(x,y,t,z=17):lab(x+F.advance(t[-1],z)/2,y,t,z,anchor='end')
for v in g['cyclohex']['thinBackBonds']:line(v)
for v in g['cyclohex']['frontTapers']:
 tip=v['tip'];a,c=v['individualObliqueFoot'];path(f'M{tip[0]} {tip[1]} L{a[0]} {a[1]} L{c[0]} {c[1]} Z','#202020','none',0)
line([[62.5,120.5],[102,120.5]],3)
for v in g['cyclohex']['OHbranches']:line(v['bond'])
line([[33,53],[45,59.5],[45,125]])
# Các chân tính trên cánh riêng gần đúng; không gọi là đo dưới pixel.
line([[43.5,58.6875],[58,50]])
line([[45,62.57142857],[60,54]])
line(g['esterBridge']['ringOArm'])
line([[110,45],[122.5,38],[142,49],[163,38],[183.5,49.5]])
line([[120.5,24],[120.5,39.12]])
line([[125,24],[125,39.41025641]])
line(g['alkeneSideChain']['extraDoubleRay'])
v=g['phenyl']['vertices'];line(v+[v[0]])
for v in g['phenyl']['innerRays']:line(v)
for v in g['phenyl']['OHbranches']:line(v['bond'])
last(25,55,'HO');lab(66.5,56,'O');lab(102.5,57,'O');lab(123,21,'O')
first(45,141,'OH');first(102,153,'OH');first(120.5,129,'OH')
first(246,46,'OH');first(246,94,'OH')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="277" height="157" viewBox="0 0 277 157"><title>Công thức theo nguồn1129</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='cqa1129-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=1129,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='16C9O/6OHorHO/2sixRingsNO-ringO-1Ph3innerCCdouble/1outsideCCdouble2offsetrays/2CO2splitraysEACHcontactrespectivearms-NOaddedcrossbar/2TAPERindividualOBLIQUEfeet-overlapfront-NOuprightstep-1boldfront3px/ALLregularUPRIGHT-FIRSTO-LASTOanchors/individualringvertices-rays/0standaloneH-hashstereo-arrows-captions-nums/NOadded5CQA-name-formula-answer-alias')
(K/'cau-truc-cqa1129-native-ddh-lo-404-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
