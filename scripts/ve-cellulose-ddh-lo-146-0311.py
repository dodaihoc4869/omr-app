"""Giữ đơn vị polymer dạng ghế, ba nhóm thế và bốn đầu nối đứt như nguồn."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
s=importlib.util.spec_from_file_location('haworth',G/'scripts/haworth-ddh-0311.py');H=importlib.util.module_from_spec(s);s.loader.exec_module(H)
r=next(r for r in json.loads((M/'doc-chi-tiet-con-lai-lo-144.json').read_text())if r['i']==1309)
def line(p,q,w=1.5,dash=False):return f'<path d="M{p[0]} {p[1]}L{q[0]} {q[1]}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round"'+(' stroke-dasharray="4 4"'if dash else'')+'/>'
b='<g transform="translate(30 30) scale(2)">'
for u in r['geometry']['units']:
 v=u['ringVertices'];c4,c3,c2,c1=[v[k]for k in['C4','C3','C2','C1']]
 b+=H.wedge(c4,c3,1.5,6)+line(c3,c2,6)+H.wedge(c2,c1,6,1.5)+line(v['C5'],c4)
 for carbon in['C1','C5']:
  p=v[carbon];q=v['ringO'];d=math.dist(p,q);end=[q[z]+(p[z]-q[z])*13/d for z in[0,1]];b+=line(p,end)
 b+=F.label(v['ringO'][0],v['ringO'][1]+8,'O',22)
 for sub in u['substituents'].values():
  ps=sub.get('bonds',sub.get('bond'))
  for p,q in zip(ps,ps[1:]):b+=line(p,q)
  x,y=sub['textAnchor'];b+=F.label(x,y+7,sub['text'],22)
 links=u['polymerLinks']
 for nm in['previousUnit','nextUnit']:
  z=links[nm];b+=line(z['from'],z['to'],1.4,True)
 z=links['glycosidicO'];b+=line(z['from'],z['to'])+F.label(z['atomAnchor'][0],z['atomAnchor'][1]+8,'O',22)
z=r['geometry']['reactionArrow'];b+=line(z['from'],z['to'],1.6);x,y=z['to'];b+=f'<path d="M{x} {y}L{x-14} {y-4}L{x-11} {y}L{x-14} {y+4}Z" fill="#252440"/>'
b+=F.label(*z['overAnchor'],z['over'],20)+F.label(*z['underAnchor'],z['under'],20)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="2520" height="450" viewBox="0 0 2520 450"><title>Phản ứng đơn vị cellulose dạng ghế theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='cellulose-chair-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='2chairpolymer/3OH→3nitrateđúngO2NOleft-ONO2top/lower/giữringO+glycosidicO/4dashedstubs;ALLsingle3frontdepthkhôngCIP;KHÔNGnrepeat/ngoặc/sốC/hệsố3/H-Cextra/charges/finiteSMILES. Arrow+HNO3(đặc)/xtH2SO4đặc,t°;−H2Onguyênvăn.')
(M/'cau-truc-cellulose-ddh-lo-146-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
