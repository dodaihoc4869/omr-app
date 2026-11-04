"""Nguồn1416: ba dạng glucose, nhãn OH hemiacetal nguyên nguồn."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=dict(next(x for x in json.loads((M/'doc-molecule-lo-169.json').read_text())if x['i']==1416));r.pop('chiLaDuLieuDungChuaSoatRender',None)
def line(d,w=1.7):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,size=32):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def ho(x,y):return F.label(x-F.advance('H',32)-F.advance('O',32)/2,y,'HO',32,'start')
def wedge(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;pts=[(x+nx*.8,y+ny*.8),(u+nx*3.5,v+ny*3.5),(u-nx*3.5,v-ny*3.5),(x-nx*.8,y-ny*.8)];return '<path d="M'+'L'.join(f'{a} {b}'for a,b in pts)+'Z" fill="#252440"/>'
b='<g transform="translate(15 15)">'
for dx,beta in [(0,False),(646,True)]:
 b+=f'<g transform="translate({dx} 0)">'+line('M40 166L107 118H190M231 131L275 166')+F.label(208,130,'O',32)+wedge((40,166),(107,214))+line('M107 214H208',7)+wedge((275,166),(208,214))
 b+=line('M107 118V91M107 118V140M40 166V140M40 166V192M107 214V194M107 214V241M208 214V191M208 214V243M275 166V138M275 166V184')
 b+=first(107,86,'CH₂OH')+F.label(107,158,'H',32)+F.label(40,133,'H',32)+(first(40,224,'OH')if beta else ho(40,224))+first(107,190,'OH')+F.label(107,272,'H',32)+F.label(208,186,'H',32)+first(208,272,'OH')
 b+=(first(275,132,'OH')+F.label(275,222,'H',32))if beta else(F.label(275,132,'H',32)+first(275,222,'OH'))
 for x,y,t in [(287,174,'1'),(221,235,'2'),(120,235,'3'),(28,172,'4'),(94,116,'5'),(107,54,'6')]:b+=F.label(x,y,t,18)
 b+=F.label(179 if beta else 139,328,'β-glucose'if beta else'α-glucose',28)+'</g>'
b+=line('M471 63V238')+first(471,52,'CHO')+first(471,267,'CH₂OH')
for y,l,rr in [(82,'H','OH'),(124,'HO','H'),(166,'H','OH'),(208,'H','OH')]:b+=line(f'M437 {y}H505')+F.label(433,y+11,l,32,'end')+F.label(508,y+11,rr,32,'start')
for x,y,t in [(471,19,'1'),(461,77,'2'),(461,119,'3'),(461,161,'4'),(461,203,'5'),(458,238,'6')]:b+=F.label(x,y,t,18)
b+=F.label(532,331,'glucose',29)
for x1,x2 in [(306,382),(576,651)]:b+=line(f'M{x1} 160H{x2}m-11 -5l11 5M{x2} 169H{x1}m11 5l-11 -5',1.7)
for x,y,w,h in [(254,186,73,42),(901,100,75,45)]:b+=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="none" stroke="#252440" stroke-width="2" stroke-dasharray="4.5 4"/>'
b+=line('M332 281Q304 270 297 236M900 39Q925 55 933 93')+'<path d="M297 234L294 254L306 248Z M933 93L919 80L931 76Z" fill="#252440"/>'+F.label(360,306,'OH hemiacetal',28)+F.label(921,32,'OH hemiacetal',28)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="390" viewBox="0 0 1100 390"><title>Ba dạng glucose theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-ba-dang-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='3forms/18numbers/allringH/2dashedOHboxes/2curvedleaders/2OHhemiacetal/2equilibriumpairs. AlphaC4HOdown,betaC4OHdown theo glyph nguồn, sửa ghi chú đọc cũ betaHO. No conditions added.');(M/'cau-truc-glucose-ba-dang-ddh-lo-177-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
