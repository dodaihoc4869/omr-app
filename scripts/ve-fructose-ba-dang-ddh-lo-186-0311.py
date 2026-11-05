"""Nguồn251: ba dạng fructose, nhánh carbon khai triển không H riêng."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='2b076b46a2a1a894b0d272bf060cb90a2c0f71a77947113916c0e7259a78f74a';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.4):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,size=18):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def wedge(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;return '<path d="M'+f'{x} {y}L{u+nx*4} {v+ny*4}L{u-nx*4} {v-ny*4}Z" fill="#252440"/>'
b='<g transform="translate(12 12)">'
for dx,beta in [(0,False),(347,True)]:
 b+=f'<g transform="translate({dx} 0)">'+line('M23 99L77 83M93 83L147 99')+F.label(85,87,'O',18)+wedge((23,99),(47,122))+line('M47 122H124',4.2)+wedge((147,99),(124,122))
 b+=line('M23 99V70L39 60M47 122V143M124 122V90')+first(46,62,'OH')+first(47,156,'OH')+first(124,84,'OH')
 if beta:b+=line('M147 99V76M147 99V132L163 142')+first(147,69,'OH')+first(172,148,'OH')+F.label(143,140,'1',10)
 else:b+=line('M147 99V70L162 60M147 99V120')+first(171,62,'OH')+first(147,136,'OH')+F.label(147,64,'1',10)
 for x,y,t in [(153,101,'2'),(121,136,'3'),(37,131,'4'),(15,99,'5'),(18,68,'6')]:b+=F.label(x,y,t,10)
 b+=F.label(84,180,'β-fructose'if beta else'α-fructose',18)+'</g>'
b+=line('M259 29V166M259 29L275 19M259 166L275 176M259 53H279M259 57H279M239 84H259M259 112H280M259 138H280')+first(283,20,'OH')+first(283,186,'OH')+F.label(286,61,'O',18)+F.label(237,89,'HO',18,'end')+first(286,118,'OH')+first(286,144,'OH')
for x,y,t in [(253,27,'1'),(253,59,'2'),(253,82,'3'),(253,116,'4'),(253,143,'5'),(253,166,'6')]:b+=F.label(x,y,t,10)
for x1,x2 in [(168,204),(314,350)]:b+=line(f'M{x1} 98H{x2}m-5 -2l5 2M{x2} 102H{x1}m5 2l-5 -2',.9)
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="580" height="220" viewBox="0 0 580 220"><title>Ba dạng fructose theo nguồn251</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='fructose-ba-dang-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=251,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3formsα/open/β/18numbers/8OH+2ringO/implicitCbranches/noexplicitH/3frontboldmỗivòng/2equilibriumpairs/2captionssource. Khôngalias1046.');(K/'cau-truc-fructose-ba-dang-ddh-lo-186-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
