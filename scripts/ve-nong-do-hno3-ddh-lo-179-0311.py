"""Nguồn1028: năm đường cong theo pixel, không suy đáp án."""
from pathlib import Path
import importlib.util,json,hashlib
from scipy.interpolate import PchipInterpolator
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=dict(next(x for x in json.loads((K/'doc-molecule-lo-169.json').read_text())if x['i']==1028));r.pop('chiLaDuLieuDungChuaSoatRender',None)
def line(d,w=2,dash=''):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"'+(f' stroke-dasharray="{dash}"'if dash else'')+'/>'
b=''
for y in r['geometry']['guideYs']:b+=line(f'M166 {y}H670',1.7,'7 7')+line(f'M156 {y}H176',2.6)
b+=line('M166 453V58M158 80L166 58L174 80M166 453H934M911 444L934 453L911 462',3)
for x,t in zip([312,461,541,615],['4,02','8,06','9,75','12,2']):b+=line(f'M{x} 446V460',3)+F.label(x+8,495,t,28)
for y,t in [(453,'0'),(273,'5'),(93,'10')]:b+=F.label(150,y+10,t,30,'end')
for c in r['curves']:
 pts=c['samples'];fun=PchipInterpolator([p[0]for p in pts],[p[1]for p in pts]);xs=sorted(set([p[0]for p in pts]+list(range(pts[0][0],pts[-1][0],2))));b+=line('M'+'L'.join(f'{x:.2f} {float(fun(x)):.2f}'for x in xs),4.2)
b+=F.label(558,74,'NO',32,'start',weight='dam')+F.label(605,232,'NO₂',30,'start',weight='dam')+F.label(598,408,'N₂O',30,'start',weight='dam')+F.label(284,314,'N₂',30,'start',weight='dam')
b+=F.label(220,141,'NH₄',30,'start',weight='dam')+F.label(278,120,'+',18,'start',weight='dam')
b+='<g transform="translate(66 266) rotate(-90)">'+F.label(0,0,'Hàm lượng sản phẩm khử',30,weight='dam')+'</g>'
b+=F.label(692,495,'C',30,'start')+F.label(712,505,'HNO₃',15,'start')+F.label(762,495,'(mol L⁻¹)',27,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="990" height="555" viewBox="0 0 990 555"><title>Hàm lượng sản phẩm khử theo nồng độ nitric acid</title>'+b+'</svg>').encode();h=hashlib.sha256(raw).hexdigest();fn='nong-do-hno3-ddh-'+h+'.svg';(K/fn).write_bytes(raw);r.update(svg=fn,hashSvg=h,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='5PCHIPcurvesnativeanchors/10dashedguides+Yticks/4Xticks/3Ylabels/2axisarrows/all5curvelabels/NH4sup+/CsubHNO3/molLsup-1/noanswer.');(K/'cau-truc-nong-do-hno3-ddh-lo-179-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
