"""Giữ từng dây nối, cực, nhãn và chi tiết vắng trong ba nguồn điện."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-dien-hoa-lo-127.json').read_text())};rows=[]
def line(x,y,xx,yy,w=1,color='#252440'):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="{color}" stroke-width="{w}"/>'
def lab(x,y,t,size=12,anchor='middle'):return F.label(x,y,t,size,anchor)
for i in[266,1090,1399]:
 b=''
 if i==266:
  w,h=1200,700;b='<g transform="translate(30 30) scale(3)"><rect x="46" y="98" width="258" height="86" fill="#e3e3e3"/><path d="M45 69V185H305V69" fill="none" stroke="#252440" stroke-width="4"/>'
  for x,y,ww,hh in[bar['bounds']for bar in a[i]['bars']]:b+=f'<rect x="{x}" y="{y}" width="{ww}" height="{hh}" fill="#fff" stroke="#686772" stroke-width="3"/>'
  b+='<path d="M67 52C39 43 25 32 8 11M278 50C313 44 335 30 359 6" fill="none" stroke="#686772" stroke-width="1.5"/>'
  b+=lab(67,29,'(+)',17)+lab(276,29,'(−)',17)+lab(175,149,'dung dịch X',16)
 elif i==1090:
  w,h=940,900;b='<g transform="translate(50 35) scale(3)">'
  for x,y,ww,hh in[beaker['mouthApprox']for beaker in a[i]['beakers']]:
   left=x+9;right=x+ww-3;cx=(left+right)/2;b+=f'<ellipse cx="{x+ww/2}" cy="{y+hh/2}" rx="{ww/2}" ry="{hh/2}" fill="none" stroke="#252440" stroke-width=".9"/><path d="M{x} {y+hh/2}L{left} {y+hh}V205Q{cx} 223 {right} 205V{y+hh}L{x+ww} {y+hh/2}" fill="none" stroke="#252440" stroke-width=".9"/>'
  for x,y,ww,hh in[beaker['liquidEllipse']for beaker in a[i]['beakers']]:b+=f'<ellipse cx="{x+ww/2}" cy="{y+hh/2}" rx="{ww/2}" ry="{hh/2}" fill="none" stroke="#252440" stroke-width=".8"/>'
  b+='<path d="M69 65V33H109M133 33H179V65" fill="none" stroke="#252440" stroke-width="1"/><circle cx="121" cy="33" r="12" fill="none" stroke="#252440" stroke-width="1"/>'+line(113,25,129,41)+line(113,41,129,25)
  for x,y,ww,hh in[bar['bounds']for bar in a[i]['bars']]:b+=f'<rect x="{x}" y="{y}" width="{ww}" height="{hh}" fill="#fff" stroke="#252440" stroke-width="1"/>'
  for x,y,t,size in[(120,15,'Bóng đèn',12),(121,65,'Dây',12),(121,80,'dẫn điện',12),(31,56,'Thanh Zn',11),(215,56,'Thanh Cu',11),(70,235,'Dung dịch',11),(70,250,'ZnSO₄ 1,0 M',11),(182,235,'Dung dịch',11),(182,250,'CuSO₄ 1,0 M',11)]:b+=lab(x,y,t,size)
 else:
  w,h=1200,760;b='<g transform="translate(40 35) scale(3)"><rect x="76" y="42" width="236" height="60" rx="30" fill="#fff0ab" stroke="#686772" stroke-width="1.2"/>'
  for wire in a[i]['wires']:
   points=[wire['from']]+wire['via']+[wire['to']];d='M'+'L'.join(f'{x} {y}'for x,y in points);b+=f'<path d="{d}" stroke="#686772" stroke-width="1.3" fill="none"/>'
  for yy in[65,71,78]:b+=line(122,yy,267,yy,.8,'#b09a54')+f'<path d="M267 {yy}L263 {yy-1.3}V{yy+1.3}Z" fill="#b09a54"/>'
  b+=line(118,52,118,92,1.5,'#827344')+line(272,52,272,92,1.5,'#827344')+'<rect x="171" y="168" width="45" height="24" fill="#a9383c" stroke="#686772" stroke-width="1"/>'
  for ll in a[i]['labels']:
   x,y=ll['at'];b+=lab(x,y,ll['text'],12 if len(ll['text'])>1 else 18)
   if ll.get('leader'):
    p,q=ll['leader'];b+=line(*p,*q,.7,'#999')
  b+=F.label(184,185,'−',17,fill='#fff')+F.label(203,185,'+',17,fill='#fff')
 b+='</g>';raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Sơ đồ điện theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dien-hoa-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='266+left−right/nosourcebox;1090ZnleftCuright/1,0M/LAMPCIRCLEX/KHÔNGsaltbridgegốc;1399−left+right/3raysright/sourcehighVkhôngsố;khôngtựsửađiệnhóanguồn.'))
(M/'cau-truc-dien-hoa-ddh-lo-128-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
