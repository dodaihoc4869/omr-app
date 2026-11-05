"""Nguồn43: amylose ba vòng và dấu tiếp diễn, giữ mọi H/OH literal."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='0922fb276b31d180cdfd51c1e4fd4b3922deeb98fbcf351003369052c308d510';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,size=25):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def wedge(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;return '<path d="M'+f'{x} {y}L{u+nx*4} {v+ny*4}L{u-nx*4} {v-ny*4}Z" fill="#252440"/>'
b=''
for dx in [0,226,452]:
 b+=f'<g transform="translate({dx} 0)">'+line('M69 122L111 85H169M194 94L224 122')+F.label(182,96,'O',25)+wedge((69,122),(111,158))+line('M111 158H182',6)+wedge((224,122),(182,158))
 b+=line('M111 85V66M111 85V107M69 122V101M111 158V141M111 158V178M182 158V138M182 158V178M224 122V101')+first(111,62,'CH₂OH',28)+F.label(69,96,'H',25)+first(111,132,'OH')+F.label(111,203,'H',25)+F.label(182,132,'H',25)+first(182,203,'OH')+F.label(224,96,'H',25)+'</g>'
# C5 có nét hướng vào vòng nhưng không có nhãn H riêng trong nguồn.
b+=line('M69 122V143')+first(69,167,'OH')+F.label(42,167,'…',25)
for x in [224,450]:b+=line(f'M{x} 122L{x+24} 145M{x+49} 145L{x+71} 122')+F.label(x+36,166,'O',25)
b+=line('M676 122V143')+F.label(679,167,'O',25)+F.label(704,167,'…',25)+F.label(379,239,'Phân tử amylose',26)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="740" height="270" viewBox="0 0 740 270"><title>Phân tử amylose theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='amylose-ba-vong-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=43,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3sixrings/allsourceH-OH/3CH2OH-Cfirst/2glycosidicO+terminalO/ellipsis2ends/captionPhântửamylose/6taper3horizontalbold/C5inwardstubNOaddedH/noCnumbers/nrepeat. Printcorner-rightlineexcludednonsourcefigure.');(K/'cau-truc-amylose-ba-vong-ddh-lo-195-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
