"""Nguồn253: giữ mạch cô đặc literal và tất cả nhóm OH/HO của ester."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='2b641494d128f5f4f987ab878d47ee7c4de1e7519e579853d13942ea45710b31';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.5):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=20):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=20):return F.label(x+F.advance(t[-1],z)/2,y,t,z,'end')
def taper(p,q):
 dx=q[0]-p[0];dy=q[1]-p[1];n=math.hypot(dx,dy);ux=-dy/n;uy=dx/n
 pts=[(p[0]+ux*.7,p[1]+uy*.7),(q[0]+ux*2.6,q[1]+uy*2.6),(q[0]-ux*2.6,q[1]-uy*2.6),(p[0]-ux*.7,p[1]-uy*.7)]
 return '<path d="M'+'L'.join(f'{a:.3f} {b:.3f}'for a,b in pts)+'Z" fill="#252440"/>'
b=last(135,72,'H₃C(H₂C)₉H₂C')+F.label(162,26,'O',20)+F.label(189,72,'O',20)
b+=line('M145 58L162 48L178 57M160 29V47M164 29V47M200 65L220 69V95M200 122L220 95H250M273 106L283 122M283 122L301 148M318 148L332 122M332 122V96L321 90M332 122L362 107M385 109L414 122M414 122V158L430 169M200 122V152M220 149V133M263 149V173M349 154V177M398 154V140')
b+=taper((200,122),(220,149))+line('M220 149H263',5)+taper((283,122),(263,149))
b+=taper((332,122),(349,154))+line('M349 154H398',5)+taper((414,122),(398,154))
b+=F.label(262,104,'O',20)+F.label(308,168,'O',20)+F.label(374,111,'O',20)
b+=last(200,174,'HO')+first(220,127,'OH')+first(263,193,'OH')+last(309,92,'HO')+first(349,198,'OH')+last(398,137,'HO')+first(442,184,'OH')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="471" height="213" viewBox="0 0 471 213"><title>Cấu tạo ester theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='monolaurate-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=253,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='H3C(H2C)9H2C literal/ester2O/sixring+five/7OH-HO/4TAPER2horizontalbold/fiveRing2CH2OHimplicit+sixRingesterifiedCH2/noextraH-stereo-caption/DDHpath.')
(K/'cau-truc-monolaurate-ddh-lo-220-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
