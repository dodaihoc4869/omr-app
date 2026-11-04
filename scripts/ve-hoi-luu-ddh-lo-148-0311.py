"""Giữ cấu tạo hồi lưu và hướng các mũi tên theo ảnh, không sửa theo lý thuyết."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-chi-tiet-con-lai-lo-144.json').read_text())if r['i']==926);g=r['geometry']
def path(d,w=1.2,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#252440" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def poly(ps):return 'M'+'L'.join(f'{x} {y}'for x,y in ps)
def arrow(ps):
 b=path(poly(ps));x,y=ps[-1];xx,yy=ps[-2];dd=math.hypot(x-xx,y-yy);ux,uy=(x-xx)/dd,(y-yy)/dd;px,py=-uy,ux
 return b+f'<path d="M{x} {y}L{x-8*ux+2.8*px} {y-8*uy+2.8*py}L{x-8*ux-2.8*px} {y-8*uy-2.8*py}Z" fill="#252440"/>'
b='<g transform="translate(30 30) scale(2)">'+path('M73 327H315V408H73Z',1.5)
# Filled glass silhouette hides the top edge of the bath behind the flask.
d='M202 275A55 55 0 0 1 236 287L254 268L263 277L245 297A56.5 56.5 0 1 1 147 291L119 265L128 257L157 282A55 55 0 0 1 186 275'
b+=f'<path d="{d}Z" fill="#fff"/>'
b+=path(d,1.5)+path('M141 315Q150 319 159 316T176 312Q185 312 191 313T199 309Q206 313 215 314T230 315T241 319L248 316',1.2)
b+='<rect x="189" y="369" width="13" height="6" fill="#fff" stroke="#252440" stroke-width="1.2"/>'
c=g['condenser']
for z in c['ports']:
 x,y,xx,yy=z['rectApprox'];b+=f'<rect x="{x}" y="{y}" width="{xx-x}" height="{yy-y}" fill="#fff" stroke="#252440" stroke-width="1.2"/>'
b+=path(poly(c['outerBodyApprox']))
for z in c['innerJacketWalls']:b+=path(poly(z),1)
for z in[c['lowerTube'],c['flaskNeck'],c['flaskNeckRight']]:b+=path(poly(z))
for box in[c['topCap'],c['connectorCollar']]:
 x,y,xx,yy=box;b+=f'<rect x="{x}" y="{y}" width="{xx-x}" height="{yy-y}" fill="#fff" stroke="#252440" stroke-width="1.2"/>'
for key in['stopperOuter','adapterBand']:b+=path(poly(g['rightCap4'][key])+'Z',1.2,'#fff')
b+=path(poly(g['probe3']['leftAdapterBand'])+'Z',1.2,'#fff')+path(poly(g['probe3']['line']),2)
for z in c['ports']:
 ar=z['flowArrow'];b+=arrow([ar['tail'],ar['head']])+F.label(*[z['labelAt'][0],z['labelAt'][1]+6],z['label'],20)
p3=g['probe3'];b+=path(poly(p3['leaderNoHead']))+F.label(p3['label'][1][0],p3['label'][1][1]+6,'3',20)
p4=g['rightCap4'];ar=p4['bentLeaderArrow'];b+=arrow([ar['tail']]+ar['via']+[ar['head']])+F.label(p4['label'][1][0],p4['label'][1][1]+6,'4',20)
p5=g['bath5'];ar=p5['leaderArrow'];b+=arrow([ar['tail'],ar['head']])+F.label(p5['label'][1][0],p5['label'][1][1]+6,'5',20)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="960" height="970" viewBox="0 0 960 970"><title>Bộ hồi lưu với năm nhãn theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hoi-luu-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Sinhhànjacket2lớp/2porttrái/1arrowRIGHTupper2LEFTlowerGIỮsource;3rod+leaderNOhead/4bentarrowLEFTcap/5arrowLEFTbath;flaskwave/stirbary369/lowershellarc56.5bámđáynguồn-vàkhetrắngrõ/khôngscale-thermometerbulb-flame/t°/tênthêm.')
(M/'cau-truc-hoi-luu-ddh-lo-148-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
