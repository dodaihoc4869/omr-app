"""Phổ nguồn719: bốn peak và hai vòng tròn trong cấu trúc native."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-ms719-lo-356.json').read_text());h=p['hash'];g=p['geometry'];b=''
def line(pair,color,width=2):
 (x0,y0),(x1,y1)=pair
 return f'<path d="M{x0} {y0}L{x1} {y1}" stroke="{color}" stroke-width="{width}" fill="none"/>'
for a in g['peaks']:
 b+=line([[a['x'],a['topY']],[a['x'],a['baselineY']]],'#000000',a['width']);box=a['labelBBox'];b+=F.label((box[0]+box[2])/2,box[3]-1,a['label'],20,fill='#000000')
for a in g['axes'].values():
 if isinstance(a,list):b+=line(a,'#000000')
for a in g['xTicks']:
 b+=line(a['stem'],'#000000');b+=F.label(a['x'],391,a['text'],20,fill='#000000')
for a in g['yTicks']:
 b+=line(a['stem'],'#000000');b+=F.label(85,a['y']+7,a['text'],20,anchor='end',fill='#000000')
s=g['structure'];edges=set()
for ring in [s['leftHex'],s['rightHex']]:
 for j,v in enumerate(ring):
  pair=tuple(sorted((tuple(v),tuple(ring[(j+1)%len(ring)]))))
  if pair not in edges:b+=line(pair,'#000000');edges.add(pair)
for o in s['innerCircles']:
 x,y=o['center'];b+=f'<ellipse cx="{x}" cy="{y}" rx="{o["rx"]}" ry="{o["ry"]}" stroke="#000000" stroke-width="2" fill="none"/>'
b+='<g transform="translate(43 175) rotate(-90)">'+F.label(0,0,'Cường độ tương đối (%)',20,weight='dam',fill='#000000')+'</g>'
b+='<g transform="translate(745 390) skewX(-12)">'+F.label(0,0,'m/z',20,fill='#000000')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="770" height="405" viewBox="0 0 770 405"><title>Phổ khối lượng theo nguồn719</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms719-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=719,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4BLACKpeaks51-64-102-128/ALLwidth2native/7X5Y12ticks/BLACKaxes-YTOPmargin15NOTcropped-NOorigin0/2fusedhex10bareC2innercirclesONEsharededge/regularUPRIGHTnums-trueDAMrotYlabel-mzREGULARITALIC/0H0heads0grid/noalternatingdouble-names-formula-answer-intensityinference')
(K/'cau-truc-ms719-native-ddh-lo-356-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
