"""Hai thùy: dựng từ mốc viền nguồn, giữ hướng, nhãn và lớp che trục."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
def path(points):
 n=len(points);d=f'M{points[0][0]} {points[0][1]}'
 for k in range(n):
  a,b,c,e=[points[z%n]for z in[k-1,k,k+1,k+2]];p=(b[0]+(c[0]-a[0])/6,b[1]+(c[1]-a[1])/6);q=(c[0]-(e[0]-b[0])/6,c[1]-(e[1]-b[1])/6);d+=f'C{p[0]:.4f} {p[1]:.4f} {q[0]:.4f} {q[1]:.4f} {c[0]} {c[1]}'
 return d+'Z'
def line(p,q,color='#252440'):return f'<path d="M{p[0]} {p[1]}L{q[0]} {q[1]}" fill="none" stroke="{color}" stroke-width="0.85"/>'
rows=[]
for r in json.loads((M/'doc-khep-ao-lo-109.json').read_text()):
 i=r['i'];g=r['geometry'];a=g['axes'];b='<defs><radialGradient id="shade" cx="32%" cy="30%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset="0.25" stop-color="#e2e2e2"/><stop offset="1" stop-color="#626262"/></radialGradient></defs><g transform="translate(25 25) scale(2.3)">'
 b+=line(a['z']['upperTip'],a['z']['lowerEnd'])+line(a['y']['leftEnd'],a['y']['rightTip'],'#252440'if i==593 else'#929292')+line(a['x']['upperRightEnd'],a['x']['lowerLeftTip'],'#686772'if i==593 else'#252440')
 x,y=a['z']['upperTip'];b+=f'<path d="M{x} {y}L{x-2} {y+8}L{x+2} {y+8}Z" fill="#252440"/>'
 x,y=a['y']['rightTip'];b+=f'<path d="M{x} {y}L{x-8} {y-2}L{x-8} {y+2}Z" fill="'+('#252440'if i==593 else'#929292')+'"/>'
 x,y=a['x']['lowerLeftTip'];b+=f'<path d="M{x} {y}L{x+5} {y-8}L{x+9} {y-3}Z" fill="'+('#686772'if i==593 else'#252440')+'"/>'
 for k,lobe in enumerate(g['lobes']):b+=f'<path d="{path(lobe["outlineAnchorsApprox"])}" fill="'+('#fff'if k==0 else'url(#shade)')+'" stroke="#686772" stroke-width="1.1"/>'
 for x,y,t in([(133,30,'z'),(225,86,'x'),(246,154,'y')]if i==593 else[(139,36,'z'),(232,91,'x'),(253,159,'y')]):b+=F.label(x,y,t,14)
 b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="700" height="680" viewBox="0 0 700 680"><title>Hình orbital theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ao-hai-thuy-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='2thùytrắng/xámtheođúngviền/hướngsource;3trụclớpsau,bịthùyche,khôngthêmphase+/−/caption/tênAO.'))
(M/'cau-truc-ao-hai-thuy-ddh-lo-109-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
