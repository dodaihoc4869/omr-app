"""Thủy phân aspirin: giữ OOCCH3 nguyên văn và X chưa biết, không sửa theo lý thuyết."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-aspirin451-lo-369.json').read_text());h=p['hash'];g=p['geometry'];b=''
def line(pair,width=2):
 (x,y),(u,v)=pair
 return f'<path d="M{x} {y}L{u} {v}" stroke="#202020" stroke-width="{width}" fill="none"/>'
def text(x,y,t,z=28,anchor='middle',weight='de'):return F.label(x,y,t,z,anchor=anchor,fill='#202020',weight=weight)
def first(x,y,t,z=28):return text(x-F.advance(t[0],z)/2,y,t,z,'start')
for name in ['left','right']:
 d=g[name];v=d['ringVertices'];b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+'Z" stroke="#202020" stroke-width="2" fill="none"/>'
 for ray in d['innerDoubleRays']:b+=line(ray)
 branch=d['topBranch']if name=='left'else d['topOH'];b+=line(branch['bond'])+line(d['COOH']['bond'])
 cx=59 if name=='left'else 704
 if name=='left':
  left=cx-F.advance('O',28)/2;b+=text(left,26,'OOCCH',28,'start');b+=text(left+F.advance('OOCCH',28),32,'3',19.6,'start')
 else:b+=first(cx,26,'OH')
 b+=first(160 if name=='left'else 805,84,'COOH')
 caption=d['caption']['text'];center=59 if name=='left'else 713
 b+=f'<g transform="translate({center} 237) skewX(-12)">'+text(0,0,caption,30)+'</g>'
b+=text(307,143,'+',27)+text(920,143,'+',27)
left=338;b+=text(left,143,'H',30,'start');left+=F.advance('H',30);b+=text(left,150,'2',21,'start');left+=F.advance('2',21);b+=text(left,143,'O',30,'start')
b+=text(983,141,'X',36,weight='dam')
b+=line(g['arrow']['shaft'],2.5)
for ray in g['arrow']['headLegs']:b+=line(ray,2.5)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1001" height="249" viewBox="0 0 1001 249"><title>Thủy phân aspirin theo nguồn451</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='aspirin451-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=451,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='16knownC8OincludingwaterEXCLUDINGunknownX/2Ph6innerCCdouble/0expandedCOdouble/EXACTcondensedOOCCH3-NOTtheoryOCOCH3/2COOHfirstCanchors/OOCCH3-OHfirstOanchors/1OPENVrighthead-NOfilledtriangle/ALLchemicalregularUPRIGHT-XtrueDAMUPRIGHT/2regularITALICcaptionsaspirin-salicylicacid/SUB3-2/0stereocharge/noXanswer-addedcondition-yield-expandedCO-H')
(K/'cau-truc-aspirin451-native-ddh-lo-369-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
