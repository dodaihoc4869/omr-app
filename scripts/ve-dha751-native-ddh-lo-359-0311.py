"""DHA và oleic acid nguồn751: dựng riêng theo native và literal hai chú thích."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-dha751-lo-359.json').read_text());h=p['hash'];g=p['geometry'];b=''
def line(a):
 (x,y),(u,v)=a
 return f'<path d="M{x} {y}L{u} {v}" stroke="#202020" stroke-width="1" fill="none"/>'
for vertices in [g['top']['bareVertices'],g['bottom']['vertices']]:
 for v,u in zip(vertices,vertices[1:]):b+=line([v,u])
for name in ['top','bottom']:
 for a in g[name]['innerCCdoubleRays']:b+=line(a)
b+=line(g['top']['condensedCOOH']['bond'])
b+=F.label(361-F.advance('C',16)/2,60,'COOH',16,anchor='start',fill='#202020')
a=g['bottom']['carbonyl']
for pair in a['rays']+[a['shortNativeFootJoin'],g['bottom']['OH']['bond']]:b+=line(pair)
b+=F.label(394,165,'O',16,fill='#202020')+F.label(417-F.advance('O',16)/2,205,'OH',16,anchor='start',fill='#202020')
def caption(x,y,prefix):
 parts=[(prefix,18,0),('o',11.7,-5),('C)',18,0)];left=-sum(F.advance(t,z,'dam')for t,z,dy in parts)/2;out=''
 for t,z,dy in parts:
  out+=F.label(left,dy,t,z,anchor='start',weight='dam',fill='#000000');left+=F.advance(t,z,'dam')
 return f'<g transform="translate({x} {y}) skewX(-12)">'+out+'</g>'
b+=caption(229,133,'DHA (nhiệt độ nóng chảy -44')+caption(228,269,'Oleic acid (nhiệt độ nóng chảy 14')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="543" height="274" viewBox="0 0 543 274"><title>Hai cấu trúc theo nguồn751</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dha751-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=751,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='TOP21bareC+COOHfirstC22C6CCdouble/BOTTOM18C1CCdouble1COdouble2raysCONTACT+nativeSHORTfootjoin/4Ototal/COOH-O-OHregularUPRIGHT/2TRUEdamITALICcaptionsEXACTDHA(nhiệtđộnóngchảy-44sup_oC)-Oleicacid(nhiệtđộnóngchảy14sup_oC)/NOspaceafterminus/0arrows0stereo/noextraC35544-expandedtopCOOH-H-formula-answer-noalias1385-811-1145')
(K/'cau-truc-dha751-native-ddh-lo-359-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
