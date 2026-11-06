"""Nguồn343: kiểu cạnh bất đối xứng và các khoảng hở literal của vòng giữa."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='3cf43c1fcf1288ca1441eb285f0293df19520bde0d4a2ae1684b50096bf712a4';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=3):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=24):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def taper(p,q):
 dx=q[0]-p[0];dy=q[1]-p[1];n=math.hypot(dx,dy);ux=-dy/n;uy=dx/n
 pts=[(p[0]+ux*.75,p[1]+uy*.75),(q[0]+ux*5,q[1]+uy*5),(q[0]-ux*5,q[1]-uy*5),(p[0]-ux*.75,p[1]-uy*.75)]
 return '<path d="M'+'L'.join(f'{a:.3f} {b:.3f}'for a,b in pts)+'Z" fill="#252440"/>'
b=line('M80 172L100 149L132 100H184M210 114L232 150M201 197L232 150M132 100V70M137 197V176M201 197V227')
b+=line('M335 149L367 104H418M443 120L462 150M434 202L462 158M367 104V74M370 202V181M434 202V232')
b+=line('M539 152L573 102H625M650 117L673 152M642 200L673 152M573 102V72M578 200V179M642 200V230')
for p,q in [((100,149),(137,197)),((337,158),(370,202)),((539,152),(578,200))]:b+=taper(p,q)
for x,y,x2 in [(137,197,201),(370,202,434),(578,200,642)]:b+=line(f'M{x} {y}H{x2}',10)
b+=line('M232 150L274 182M299 181L333 155M466 155L496 176M520 175L539 152M673 152L714 183')
for x,y in [(197,111),(431,115),(638,113),(286,202),(508,197),(727,203)]:b+=F.label(x,y,'O',24)
for x,y in [(132,64),(367,68),(573,66)]:b+=first(x,y,'CH₂OH')
for x,y in [(137,174),(201,255),(370,179),(434,260),(578,177),(642,258)]:b+=first(x,y,'OH')
b+=F.label(218,156,'1',16)+F.label(319,155,'4',16)
for x,y in [(45,181),(55,181),(66,181),(748,201),(759,201),(770,201)]:b+=F.label(x,y,'.',40,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="810" height="305" viewBox="0 0 810 305"><title>Đoạn polymer theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='chair-polymer-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=343,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3rings/3CH2OH6OH0H/3LEFTtaper3horizontalbold3RIGHTthinUNIFORM/middleC4+C1literal3strokeGAPS/ONLYnums1-4/left3dotsNOO/rightO+3dots/noextraH-caption-brackets/DDHpath.')
(K/'cau-truc-chair-polymer-ddh-lo-225-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
