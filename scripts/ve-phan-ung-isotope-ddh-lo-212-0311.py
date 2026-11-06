"""Nguồn152: phản ứng gắn nhãn đồng vị literal; không giải biến x/y hay sản phẩm A."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1a9e6fce0562ad626bdbc6a6d1b34666e05326955d98a8d7471880d36595a0cb';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=28,a='middle',dam=False):return F.label(x,y,t,z,a,weight='dam'if dam else'de')
def first(x,y,t,z=28):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def taper(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;return f'<path d="M{x} {y}L{u+nx*3} {v+ny*3}L{u-nx*3} {v-ny*3}Z" fill="#252440"/>'
b=path('M65 133L132 81H220M246 91L302 134')+label(232,91,'O')+taper((65,133),(132,184))+path('M132 184H232',5.5)+taper((302,134),(232,184))
b+=path('M132 81V60M132 81V108M65 133V112M65 133V156M132 184V163M132 184V211M232 184V164M232 184V211M302 134V115M302 134V156')
b+=first(132,55,'CH₂OH')+label(132,127,'H')+label(65,108,'H')+first(65,179,'OH')+first(132,157,'OH')+label(132,234,'H')+label(232,158,'H')+first(232,234,'OH')+label(302,111,'H')+first(302,179,'OH')
b+=label(386,143,'+')+label(435,143,'H₃C',28,'start')+path('M489 134H505M545 134H557')+label(516,125,'18',17)+label(533,143,'O')+label(571,143,'H')
b+=path('M622 134H767M757 130L767 134L757 138',1.8)+label(681,117,'HCl khan',24)
# x/y thiếu glyph subscript riêng trong app: dùng Latin nhỏ và hạ baseline bằng path DDH.
x=798
for t,sub,dam in [('A',False,True),(' (C',False,False),('7',True,False),('H',False,False),('x',True,False),('O',False,False),('y',True,False),(')',False,False)]:
 z=19 if sub else 28;wt='dam'if dam else'de';b+=F.label(x,150 if sub else 143,t,z,'start',weight=wt);x+=F.advance(t,z,weight=wt)
b+=label(974,143,'+')+label(1006,145,'H₂O',28,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="301" viewBox="0 0 1100 301"><title>Phản ứng đồng vị theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='phan-ung-isotope-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=152,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Haworth6C5H/CH2OH-Cfirst/allOH/2TAPER1horizontalbold/+H3C-18O-H/HClkhan/RIGHTarrow/A(C7HxOy)+H2O/x-yLatinDDHsubbaseline/noanswer/DDHpath.');(K/'cau-truc-phan-ung-isotope-ddh-lo-212-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
