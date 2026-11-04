"""Giữ dấu điện tích và các mũi tên trong nguồn, kể cả hướng cầu muối khác lý thuyết."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a=json.loads((M/'doc-chi-tiet-con-lai-lo-155.json').read_text());r=next(r for r in a if r['i']==483);g=r['geometry155']
def path(d,w=1.2,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#252440" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def poly(ps):return 'M'+'L'.join(f'{x} {y}'for x,y in ps)
def arrow(ps,w=1.1):
 b=path(poly(ps),w);x,y=ps[-1];xx,yy=ps[-2];dd=math.hypot(x-xx,y-yy);ux,uy=(x-xx)/dd,(y-yy)/dd;px,py=-uy,ux
 return b+f'<path d="M{x} {y}L{x-8*ux+2.5*px} {y-8*uy+2.5*py}L{x-8*ux-2.5*px} {y-8*uy-2.5*py}Z" fill="#252440"/>'
b='<g transform="translate(30 25) scale(2)">'
for cx,color in[(225,'#dedede'),(430,'#ececec')]:
 b+=path(f'M{cx-70} 186V359A70 12 0 0 0 {cx+70} 359V186',1.2,'#fff')
 b+=f'<path d="M{cx-69} 201V359A69 11 0 0 0 {cx+69} 359V201Z" fill="{color}"/>'
 for cy,rx,ry in[(186,70,11),(201,69,11),(359,70,12)]:b+=f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="#252440" stroke-width=".9"/>'
b+=path(poly(g['outerWire']),1.6)+path(poly(g['outerWireRight']),1.6)+'<circle cx="325" cy="75" r="19" fill="#fff" stroke="#252440" stroke-width="1.4"/>'+path(poly(g['centralSymbol']['insideZigzag']))
# Ống U có hai vách và hai miệng nhúng. Không vẽ một đường dây thay cho cầu muối.
b+='<path d="M225 250V177Q225 162 240 162H414Q429 162 429 177V250H398V188Q398 177 386 177H269Q257 177 257 188V250Z" fill="#fff"/>'
b+=path('M225 250V177Q225 162 240 162H414Q429 162 429 177V250M257 250V188Q257 177 269 177H386Q398 177 398 188V250',1.2)
for x,rx in[(241,16),(413.5,15.5)]:b+=f'<ellipse cx="{x}" cy="250" rx="{rx}" ry="3" fill="#fff" stroke="#252440" stroke-width=".8"/>'
# Hai đuôi cong ở trên cầu đều hướng vào giữa, không đổi sang mô tả ion migration.
b+=path('M216 171Q216 154 232 154H283M438 171Q438 154 421 154H370',1)
b+='<path d="M283 154L275 151V157Z M370 154L378 151V157Z" fill="#252440"/>'
for ar in g['eArrows']:
 b+=arrow([ar['tail'],ar['head']])+F.label(ar['textAt'][0],ar['textAt'][1]+6,'e',18)
for z in[g['bridge']['leftIonText'],g['bridge']['rightIonText']]:b+=F.label(z['at'][0]+(.5 if z['text']=='NH₄⁺'else 0),z['at'][1]+6,z['text'],12 if z['text']=='NH₄⁺'else 16)
for ar in g['bridge']['ionArrows']:b+=arrow([ar['tail'],ar['head']],.9)
for name,box in g['electrodes'].items():
 x,y,xx,yy=box;b+=f'<rect x="{x}" y="{y}" width="{xx-x}" height="{yy-y}" rx="4" fill="#48484f" stroke="#252440" stroke-width="1"/>'
for z in g['labelsAndLeaders']:
 t=z['text'];x,y=z['at'];size=18;anchor='middle';base=y+6
 if t=='Cầu muối':base=110;size=16
 elif t=='NH₄Cl':base=126;size=16
 elif t=='ZnSO₄(aq)':x=138;anchor='end'
 elif t=='CuSO₄(aq)':x=524;anchor='start'
 elif t in['Zn','Cu']:base=218;size=20
 b+=F.label(x,base,t,size,anchor)
 if z.get('leader'):b+=arrow(z['leader'],.85)
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1380" height="900" viewBox="0 0 1380 900"><title>Pin Zn Cu với cầu muối theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pin-zn-cu-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows=[]
for r in a:
 if r['i']in[483,1216]:rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='2cups/ZnCu/ZnSO4CuSO4(aq)/2e→KHÔNGminus/2bridgearcs→←VÀOGIỮA/Cl−↓NH4+↓/NH4Cl/Cầumuối/2wallU2endsnhúng/solutiongraykhôngsốhạt. LabelreflowtheoDDHđểkhôngđụngleader;khôngpolarityhayionmớithêm.'))
(M/'cau-truc-pin-zn-cu-ddh-lo-155-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
