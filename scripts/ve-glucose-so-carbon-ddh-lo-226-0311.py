"""Nguồn372: Haworth đánh số carbon, giữ đầu nhánh C6 không ghi CH2."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='41cb593a84e8e1100620ff47828d3bcbe46d3150d0ca44fdda95b72e102aa439';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.5):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}"/>'
def first(x,y,t,z=24):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def taper(p,q):
 dx=q[0]-p[0];dy=q[1]-p[1];n=math.hypot(dx,dy);ux=-dy/n;uy=dx/n
 pts=[(p[0]+ux*.7,p[1]+uy*.7),(q[0]+ux*3.5,q[1]+uy*3.5),(q[0]-ux*3.5,q[1]-uy*3.5),(p[0]-ux*.7,p[1]-uy*.7)]
 return '<path d="M'+'L'.join(f'{a:.3f} {b:.3f}'for a,b in pts)+'Z" fill="#252440"/>'
b=line('M48 161L110 115H191M215 124L269 161M110 115V77L137 58M48 161V198M108 207V169M202 207V246M269 161V207')
b+=taper((48,161),(108,207))+taper((269,161),(202,207))+line('M108 207H202',7)
b+=F.label(202,123,'O',24)
for x,y in [(147,55),(48,220),(108,164),(202,270),(256,227)]:b+=first(x,y,'OH')
for x,y,t in [(275,154,'1'),(187,237,'2'),(111,240,'3'),(36,162,'4'),(93,115,'5'),(98,77,'6')]:b+=F.label(x,y,t,24)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="324" height="312" viewBox="0 0 324 312"><title>Công thức vòng glucose theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-so-carbon-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=372,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='singleHaworth/nums1..6/5OH+ringO/0H-0CH2OH/2taper1bold/C6bentbareendpoint-OH/keepallsourcepositions/DDHpath.')
(K/'cau-truc-glucose-so-carbon-ddh-lo-226-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
