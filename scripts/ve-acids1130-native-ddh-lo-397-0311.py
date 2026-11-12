"""Nguồn1130: hai mạch acid béo, giữ Arachidomic theo nguyên văn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-acids1130-lo-397.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,fill='none',stroke='#303030',w=2):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=2):path('M'+'L'.join(f'{x} {y}'for x,y in v),w=w)
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,anchor='end')
def italic(x,y,t,z=30):
 global b
 b+=f'<g transform="translate({x} {y}) skewX(-10)">'+F.label(0,0,t,z,anchor='middle',fill='#202020')+'</g>'
# Hai mạch được đọc riêng theo đỉnh gốc; không dựng từ tên acid.
for key,capx,capy in [('left',234,102),('right',675,100)]:
 a=g[key];co=a['carbonyl'];line([a['explicitStart']['bond'][0]]+a['bareVerticesOrderedFromExplicitH3C'],1.4)
 for v in a['CCExtraParallelRays']:line(v,1.3)
 line([co['bareC'],co['verticalOHArm'][-1]],1.4)
 line([co['rootUpperFootCalculated'],co['upperRay'][-1]],1.4);line(co['lowerRay'],1.4)
 last(27 if key=='left' else 463,15 if key=='left' else 12,'H₃C',17)
 lab(393 if key=='left' else 859,15 if key=='left' else 50,'O',17)
 first(368 if key=='left' else 834,60 if key=='left' else 96,'OH',17)
 lab(capx,capy,a['caption']['literal'],18)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="866" height="106" viewBox="0 0 866 106"><title>Hai mạch theo nguồn1130</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='acids1130-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=1130,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='LEFT20C4CCdouble-RIGHT22C6CCdouble/42C4Ototal/2explicitH3C-LASTCanchors-SUB3/2COUPRIGHT2splitraysCONTACTincomingLEFTslopesandRIGHTverticalOHarms/2OH-FIRSTOanchors/ALLchemicaland2captionsregularUPRIGHT/EXACTArachidomic acid (ARA)-mNOTn-Docosahexaenoic acid (DHA)/individualnonperiodicvertices-rays/0stereo-arrows-rings/NOaddedH-omega-number-formula-answer-alias81113851145751')
(K/'cau-truc-acids1130-native-ddh-lo-397-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
