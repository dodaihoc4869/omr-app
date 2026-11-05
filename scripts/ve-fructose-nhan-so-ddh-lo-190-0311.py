"""Nguồn2: ba dạng fructose giữ H tường minh và nhãn (1)..(3)."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='0069e29920cf864e2d9ee63e924d3e01231d347e00c847bb41dc6a352e961629';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,size=28):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def ho(x,y):return F.label(x-F.advance('H',28)-F.advance('O',28)/2,y,'HO',28,'start')
def wedge(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;return '<path d="M'+f'{x} {y}L{u+nx*6} {v+ny*6}L{u-nx*6} {v-ny*6}Z" fill="#252440"/>'
b=''
for dx,beta in [(0,False),(719,True)]:
 b+=f'<g transform="translate({dx} 0)">'+line('M205 154L291 127M315 127L395 154')+F.label(303,134,'O',28)+wedge((205,154),(248,216))+line('M248 216H351',9)+wedge((395,154),(351,216))
 b+=line('M205 154V124M205 154V214M248 216V177M248 216V249M351 216V178M351 216V249M395 154V133M395 154V187')
 b+=first(205,118,'CH₂OH')+F.label(205,235,'H',28)+F.label(248,172,'H',28)+first(248,276,'OH')+ho(351,173)+F.label(351,270,'H',28)
 if beta:b+=first(395,129,'OH')+first(395,216,'CH₂OH')+F.label(395,240,'1',21)
 else:b+=first(395,128,'CH₂OH')+first(395,213,'OH')+F.label(395,101,'1',21)
 for x,y,t in [(407,165,'2'),(365,239,'3'),(238,244,'4'),(191,164,'5'),(205,91,'6')]:b+=F.label(x,y,t,21)
 b+='</g>'
b+=line('M676 94V267M676 112H706M676 119H706M647 157H706M647 198H706M647 239H706')+F.label(716,128,'O',28)+F.label(643,168,'HO',28,'end')+F.label(709,168,'H',28,'start')+F.label(643,209,'H',28,'end')+F.label(709,209,'OH',28,'start')+F.label(643,250,'H',28,'end')+F.label(709,250,'OH',28,'start')+first(676,86,'CH₂OH')+first(676,291,'CH₂OH')
for x,y,t in [(676,60,'1'),(668,121,'2'),(668,150,'3'),(668,191,'4'),(668,232,'5'),(668,268,'6')]:b+=F.label(x,y,t,21)
for x1,x2,y in [(480,572,179),(787,877,175)]:b+=line(f'M{x1} {y}H{x2}m-15 -6l15 6M{x2} {y+7}H{x1}m15 6l-15 -6',1.8)
for x,t in [(256,'(1)'),(653,'(2)'),(966,'(3)')]:b+=F.label(x,337,t,31,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1255" height="381" viewBox="0 0 1255 381"><title>Ba dạng fructose với nhãn số theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='fructose-nhan-so-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=2,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3forms/18nums/allringHexplicit/CH2OHleftC6textCfirstNOTHOCH2/αC2CH2OHupOHdown/βOHupCH2OHdown/HOupC3/HupC4/4taper2bold/2⇌/captions(1)(2)(3)truebold/noalias1046.');(K/'cau-truc-fructose-nhan-so-ddh-lo-190-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
