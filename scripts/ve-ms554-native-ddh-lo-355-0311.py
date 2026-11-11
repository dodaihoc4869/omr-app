"""Phổ nguồn554: bốn peak và hai vòng tròn trong cấu trúc native."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-ms554-lo-355.json').read_text());h=p['hash'];g=p['geometry'];b=''
def line(pair,color,width=2):
 (x0,y0),(x1,y1)=pair
 return f'<path d="M{x0} {y0}L{x1} {y1}" stroke="{color}" stroke-width="{width}" fill="none"/>'
for a in g['peaks']:
 b+=line(a['shaft'],'#911763',a['strokeWidth']);box=a['labelBBox'];b+=F.label((box[0]+box[2])/2,box[3]-1,a['label'],24,fill='#000000')
for a in g['axes'].values():
 if isinstance(a,list):b+=line(a,'#228fa6')
for a in g['xTicks']:
 b+=line(a['stem'],'#228fa6');b+=F.label(a['centerX'],420,a['text'],24,fill='#000000')
for a in g['yTicks']:
 b+=line(a['stem'],'#228fa6');b+=F.label(81,a['centerY']+9,a['text'],24,anchor='end',fill='#000000')
s=g['fusedStructure'];edges=set()
for ring in [s['leftHex'],s['rightHex']]:
 for j,v in enumerate(ring):
  pair=tuple(sorted((tuple(v),tuple(ring[(j+1)%len(ring)]))))
  if pair not in edges:b+=line(pair,'#000000');edges.add(pair)
for o in s['innerCircles']:
 x,y=o['center'];b+=f'<ellipse cx="{x}" cy="{y}" rx="{o["rx"]}" ry="{o["ry"]}" stroke="#000000" stroke-width="2" fill="none"/>'
b+='<g transform="translate(33 181.5) rotate(-90)">'+F.label(0,0,'Cường độ tương đối (%)',24,fill='#000000')+'</g>'
b+='<g transform="translate(808 418) skewX(-12)">'+F.label(0,0,'m/z',24,fill='#000000')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="835" height="431" viewBox="0 0 835 431"><title>Phổ khối lượng theo nguồn554</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms554-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=554,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4MAGENTApeaks51-64-102-128/64width3others2native/7X6Y13ticks/BLUEaxesOVERpeaks-YTOPcroppednative0/2fusedhex10bareC2innercirclesONEsharededge/regularUPRIGHTnums-rotYlabel-mzREGULARITALIC/0H0heads0grid/noalternatingdouble-names-formula-answer-intensityinference')
(K/'cau-truc-ms554-native-ddh-lo-355-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
