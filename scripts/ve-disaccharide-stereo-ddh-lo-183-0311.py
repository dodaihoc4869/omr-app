"""Nguồn1213: hai vòng và stereo đọc từ ảnh, H ẩn giữ nguyên."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='dc2bd40b294b55feffd71e7fe84b43722490ce97bc2610310388b15eb75f2830';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def wedge(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;return '<path d="M'+f'{x} {y}L{u+nx*3.8} {v+ny*3.8}L{u-nx*3.8} {v-ny*3.8}Z" fill="#252440"/>'
def hatch(p,q,n=5):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;b=''
 for i in range(1,n+1):
  t=i/(n+1);a=x+(u-x)*t;c=y+(v-y)*t;w=.5+3*t;b+=line(f'M{a-nx*w} {c-ny*w}L{a+nx*w} {c+ny*w}',1.25)
 return b
b=line('M170 135V160L136 180L103 160V121L136 102L155 113')+F.label(169,130,'O',26)
b+=wedge((136,102),(136,64))+line('M136 64L111 56')+F.label(108,62,'HO',26,'end')
b+=hatch((103,121),(79,108),5)+F.label(78,110,'HO',26,'end')+wedge((103,160),(79,168))+F.label(75,179,'HO',26,'end')+hatch((136,180),(137,207),5)+F.label(146,229,'OH',26)
b+=hatch((170,160),(191,173),5)+F.label(203,189,'O',26)+line('M219 171L238 160L258 171M284 164L299 147L280 113L241 121L238 160')+F.label(268,185,'O',26)
b+=wedge((241,121),(242,94))+F.label(250,91,'OH',26)+hatch((280,113),(289,91),5)+F.label(305,87,'OH',26)
b+=hatch((238,160),(208,143),5)+line('M208 143V114')+F.label(217,109,'OH',26)+wedge((299,147),(337,151))+line('M337 151L351 130')+F.label(366,127,'OH',26)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="430" height="265" viewBox="0 0 430 265"><title>Disaccharide stereo theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='disaccharide-stereo-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=1213,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='6ring+5ring/2ringO+bridgeO/8HO-OH/4solidwedges+5hashedbonds/implicitCbranches/noHadded/nonumbers/noCIP/geometrysource.');(K/'cau-truc-disaccharide-stereo-ddh-lo-183-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
