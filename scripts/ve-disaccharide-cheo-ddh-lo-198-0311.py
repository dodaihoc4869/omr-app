"""Nguồn48: hai vòng Haworth nối chéo, không thêm tên chất/H/chỉ số."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='0a0d6fd649673af842fbff8328fceae1a8447858a2a03e08f845356037c3b443';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,size=23):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def wedge(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;return '<path d="M'+f'{x} {y}L{u+nx*3.8} {v+ny*3.8}L{u-nx*3.8} {v-ny*3.8}Z" fill="#252440"/>'
b=line('M48 201L81 167H121M143 176L167 201M168 125L203 89H242M264 98L288 125')+F.label(132,177,'O',23)+F.label(253,99,'O',23)
b+=wedge((48,201),(81,238))+line('M81 238H132',5)+wedge((167,201),(132,238))+wedge((168,125),(203,160))+line('M203 160H253',5)+wedge((288,125),(253,160))
b+=line('M48 201V178M81 238V212M132 238V266M81 167V142M167 201V177M168 125V151M203 89V64M203 160V136M253 160V187M288 125V101')
b+=first(48,173,'OH')+first(81,208,'OH')+first(132,286,'OH')+first(81,137,'CH₂OH')+F.label(167,174,'O',23)+first(203,60,'CH₂OH')+first(203,131,'OH')+first(253,208,'OH')+first(288,95,'OH')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="370" height="325" viewBox="0 0 370 325"><title>Hai vòng đường nối chéo theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='disaccharide-cheo-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=48,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2sixringsdiagonal/12C11O/2ringO+verticalbridgeO/6OH+2CH2OH/noHnumberscaptionadded/4taper2horizontalbold/rightprintlinedetachedexcluded/DDHpath.');(K/'cau-truc-disaccharide-cheo-ddh-lo-198-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
