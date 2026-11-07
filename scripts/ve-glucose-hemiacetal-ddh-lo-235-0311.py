"""Nguồn473: ba dạng glucose với hai nhãn OH hemiacetal đầy đủ."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='56a556ea35abc49f2798711fa29eb36c1ae7308d36f11c39708f5a70682c5d72';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=24):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=24):return F.label(x+F.advance(t[-1],z)/2,y,t,z,'end')
def taper(p,q):
 dx=q[0]-p[0];dy=q[1]-p[1];n=math.hypot(dx,dy);ux=-dy/n;uy=dx/n
 pts=[(p[0]+ux*.7,p[1]+uy*.7),(q[0]+ux*2.8,q[1]+uy*2.8),(q[0]-ux*2.8,q[1]-uy*2.8),(p[0]-ux*.7,p[1]-uy*.7)]
 return '<path d="M'+'L'.join(f'{a:.3f} {b:.3f}'for a,b in pts)+'Z" fill="#252440"/>'
b=line('M78 173L127 134H196M220 140L264 173M127 134V116M127 134V144M78 173V152M78 173V194M128 208V192M128 208V230M210 208V194M210 208V231M264 173V146M264 173V188')
b+=taper((78,173),(128,208))+taper((264,173),(210,208))+line('M128 208H210',5.6)
b+=F.label(208,143,'O',24)+first(127,110,'CH₂OH')
for x,y in [(127,166),(77,148),(128,257),(210,190),(264,143)]:b+=F.label(x,y,'H',24)
for x,y in [(77,219),(128,189),(210,255),(264,211)]:b+=first(x,y,'OH')
for x,y,t in [(129,86,'6'),(119,132,'5'),(66,179,'4'),(139,228,'3'),(220,225,'2'),(276,180,'1')]:b+=F.label(x,y,t,18)
b+=line('M597 170L648 128H718M742 134L785 170M648 128V109M648 128V136M597 170V145M597 170V190M648 202V187M648 202V224M731 202V186M731 202V225M785 170V142M785 170V186')
b+=taper((597,170),(648,202))+taper((785,170),(731,202))+line('M648 202H731',5.6)
b+=F.label(730,137,'O',24)+first(648,103,'CH₂OH')
for x,y in [(648,159),(597,141),(648,249),(731,183),(785,211)]:b+=F.label(x,y,'H',24)
for x,y in [(597,214),(648,184),(731,250),(785,138)]:b+=first(x,y,'OH')
for x,y,t in [(650,75,'6'),(637,127,'5'),(585,171,'4'),(655,224,'3'),(743,220,'2'),(797,174,'1')]:b+=F.label(x,y,t,18)
b+=line('M423 82V220M399 101H447M399 134H447M399 167H447M399 200H447')+first(423,74,'CHO')+first(423,253,'CH₂OH')
for i,y in enumerate([101,134,167,200]):
 if i==1:b+=last(383,y+12,'HO')+F.label(460,y+12,'H',24)
 else:b+=F.label(383,y+12,'H',24)+first(460,y+12,'OH')
for x,y,t in [(426,50,'1'),(412,96,'2'),(412,129,'3'),(412,162,'4'),(412,195,'5'),(411,226,'6')]:b+=F.label(x,y,t,18)
for x,z in [(290,347),(511,570)]:b+=line(f'M{x} 164H{z}l-5-5M{z} 170H{x}l5 5',1.5)
for x,y,w,he in [(248,185,59,36),(767,111,62,36)]:b+=f'<rect x="{x}" y="{y}" width="{w}" height="{he}" rx="6" fill="none" stroke="#252440" stroke-width="1.4" stroke-dasharray="2.5 2.5"/>'
b+=line('M303 256L280 225M280 225L281 234M280 225L288 229M773 61L794 103M794 103L785 98M794 103L794 94',1.4)
b+=F.label(252,282,'OH hemiacetal',22,'start')+F.label(704,53,'OH hemiacetal',22,'start')
for x,y,t in [(153,301,'α-glucose'),(704,299,'β-glucose')]:b+=f'<g transform="translate({math.tan(math.radians(10))*y:.5f} 0) skewX(-10)">'+F.label(x,y,t,24)+'</g>'
b+=F.label(455,306,'glucose',24)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="895" height="340" viewBox="0 0 895 340"><title>Ba dạng glucose và OH hemiacetal theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-hemiacetal-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=473,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='alpha-open-beta/18nums14H/3CH2OH+CHOcondensed/RLRR/4TAPER2bold/2equilibriumpairs/2roundedDOTboxes2openheadleaders/2EXACTOHhemiacetalWITHl/3lowercaseGreekcaptions/DDHpath/noextraaldehydeH-caption.')
(K/'cau-truc-glucose-hemiacetal-ddh-lo-235-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
