"""Ba vòng và mũi tên chỉ liên kết nguồn424; giữ từng đầu lượn không đều."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-poly424-lo-383.json').read_text());g=p['geometry'];h=p['hash'];b=''
def line(v,w=2):
 global b
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+f'" fill="none" stroke="#202020" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def oxygen(x,y):
 global b
 b+=F.label(x,y,'O',30,fill='#202020')
def wave(v):
 global b
 d=f'M{v[0][0]} {v[0][1]}'
 for (x,y),(xx,yy) in zip(v,v[1:]):
  dx=(xx-x)*.5;d+=f'C{x+dx} {y} {xx-dx} {yy} {xx} {yy}'
 b+=f'<path d="{d}" fill="none" stroke="#202020" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
for r in g['rings']:
 for key in ['thinPath','OtoC','frontPath']:line(r[key])
for r in g['bridges']:
 for v in r['bonds']:line(v)
line(g['terminalO']['bond'])
for x,y in [(181.5,37),(358.5,37),(540.5,37),(237.5,103),(417.5,108),(600.5,108)]:oxygen(x,y)
for key in ['leftCap','rightCap']:wave(g[key]['orderedTurns'])
line(g['leftCap']['connectionToRing'])
line(g['leader']['shaft'])
b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in g['leader']['filledTriangle'])+'Z" fill="#202020"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="671" height="121" viewBox="0 0 671 121"><title>Ba vòng với mũi tên chỉ liên kết theo nguồn424</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='poly424-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=424,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='15visiblebareC6O-3ringO2bridgeO1terminalO/3sixringsALLthinUNIFORM/2cutwavecapsLEFT6crests6troughs-RIGHT5crests5troughs-individualnonperiodicturns/1FULLFILLEDleaderDOWNLEFTtip40067FREEabovebond/ALL6OregularUPRIGHT/0H-OH-CH2OH-TAPER-stereo-caption/UNKNOWNoutsidepolymerC-NOaddedlinkagename-answer-alias')
(K/'cau-truc-poly424-native-ddh-lo-383-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
