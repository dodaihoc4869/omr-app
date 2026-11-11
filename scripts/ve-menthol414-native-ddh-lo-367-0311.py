"""Sơ đồ menthol nguồn414: giữ vòng phẳng, nhánh và hai chân carbonyl riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-menthol414-lo-367.json').read_text());h=p['hash'];g=p['geometry'];b=''
def line(a):
 (x,y),(u,v)=a
 return f'<path d="M{x} {y}L{u} {v}" stroke="#252525" stroke-width="2" fill="none"/>'
def text(x,y,t,z=24,anchor='middle'):return F.label(x,y,t,z,anchor=anchor,fill='#252525')
for name in ['left','right']:
 a=g[name];v=a['ring']
 for pair in list(zip(v,v[1:]+v[:1]))+[a['topMethyl']]+a['isopropyl']['bonds']:b+=line(pair)
 cap=a['caption'];bb=cap['bbox'];b+=text((bb[0]+bb[2])/2,219,cap['text'],24)
b+=line(g['left']['OH']['bond'])+text(122-F.advance('O',22)/2,124,'OH',22,'start')
co=g['right']['carbonyl'];b+=line(co['upperRay'])+line(co['lowerRay'])+text(408,124,'O',22)
a=g['arrow'];b+=line(a['shaft']);b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in a['headTriangle'])+'Z" fill="#252525"/>'
parts=[('K',20,0),('2',14,5),('Cr',20,0),('2',14,5),('O',20,0),('7',14,5),('/H',20,0),('+',14,-7)];left=209-sum(F.advance(t,z)for t,z,dy in parts)/2
for t,z,dy in parts:b+=text(left,70+dy,t,z,'start');left+=F.advance(t,z)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="422" height="227" viewBox="0 0 422 227"><title>Sơ đồ menthol theo nguồn414</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='menthol414-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=414,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='20C2O/2sixrings10Ceach/8branchC4each/0CCdouble1COdouble2splitfeetCONTACTverticalRIGHTedge-lowerLEFTslope/nativeWHITEwedgeNOTgap/1FILLEDrighthead/ALLregularUPRIGHT/Menthol-Menthone/EXACTK2Cr2O7/HplusSUB227-SUPplus/OHfirstOanchor/0stereo0standaloneH/noaddedwater-yield-condition-answer')
(K/'cau-truc-menthol414-native-ddh-lo-367-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
