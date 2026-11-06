"""Nguồn481: đoạn polymer với ngoặc lặp và hai đầu mạch lượn sóng."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='588ebd641abba8772dcc2dade968bb242325e070d2caec0dd33bac6cdfe02ca6';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=30):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def wave(x1,y1,x2,y2):
 def p(t):return (x1+(x2-x1)*t,y1+(y2-y1)*t+6*math.sin(8*math.pi*t))
 def v(t):return (x2-x1,y2-y1+48*math.pi*math.cos(8*math.pi*t))
 d=f'M{x1} {y1}';dt=1/16
 for i in range(16):
  t=i*dt;u=(i+1)*dt;a=p(t);b=p(u);va=v(t);vb=v(u)
  d+=f'C{a[0]+va[0]*dt/3:.4f} {a[1]+va[1]*dt/3:.4f} {b[0]-vb[0]*dt/3:.4f} {b[1]-vb[1]*dt/3:.4f} {b[0]:.4f} {b[1]:.4f}'
 return line(d,1.8)
b=line('M193 123H215M247 123H301M368 123H415M447 123H522M591 123H616M648 119H673M648 127H673M729 123H742M811 123H827M895 123H912')
for x,t in [(145,'CH₂'),(232,'C'),(318,'CH₂'),(431,'C'),(541,'CH₂'),(631,'C'),(688,'CH'),(759,'CH₂'),(843,'CH₂'),(927,'C')]:b+=first(x,132,t)
for x,top in [(232,64),(431,64),(927,69)]:
 b+=line(f'M{x} 106V{top+6}M{x} 140V167')+first(x,top,'CH₃')+first(x,195,'CH₃')
b+=line('M631 139V166')+first(631,195,'CH₃')
b+=line('M289 64Q255 124 289 185M487 65Q516 125 487 186',1.5)+F.label(503,184,'n',20)
b+=wave(35,124,128,123)+wave(944,125,1036,125)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1073" height="241" viewBox="0 0 1073 241"><title>Đoạn mạch polymer theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='butyl-polymer-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=481,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='17printedCtokens5CH2+1CH+4C+7CH3/1C=C/1parenthesespaironlyCH2-C(CH3)2+n/2waves4crests4troughsEACH/noarrowheads-addedH-caption-answerXY/DDHpath.')
(K/'cau-truc-butyl-polymer-ddh-lo-233-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
