"""Hai mô hình hydrogen và AO cầu: giữ caption, trục và thứ tự che khuất."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-106.json').read_text())};rows=[]
def line(x,y,xx,yy,color='#252440'):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="{color}" stroke-width="3"/>'
for i in[645,754,1008,1067,284,1265]:
 if i in[645,754,1008,1067]:
  w,h=1100,530;b='<defs><radialGradient id="cloud"><stop offset="0" stop-color="#9d9d9d"/><stop offset="0.45" stop-color="#b8b8b8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="250" cy="200" r="140" fill="none" stroke="#686772" stroke-width="2"/><circle cx="250" cy="200" r="16" fill="#686772"/>'
  x=250+140*math.cos(math.radians(-150));y=200+140*math.sin(math.radians(-150));b+=f'<circle cx="{x:.4f}" cy="{y:.4f}" r="10" fill="'+('#252440'if i in[645,754]else'#a0a0a0')+'" stroke="#686772" stroke-width="1.5"/>'
  b+='<circle cx="830" cy="200" r="180" fill="url(#cloud)"/><circle cx="830" cy="200" r="16" fill="#686772"/>'
  for x,model in[(250,'1'),(830,'2')]:b+=F.label(x,430,'Mô hình ('+model+')',36)+F.label(x,485,'của nguyên tử hydrogen',33)
 else:
  w,h=700,680
  if i==284:
   color='#5b176d';b=line(15,330,650,330,color)+line(340,75,340,650,color)+line(160,575,540,105,color)
   b+='<defs><radialGradient id="sphere" cx="30%" cy="50%"><stop offset="0" stop-color="#9de7f4"/><stop offset="1" stop-color="#00a4d6"/></radialGradient></defs><circle cx="340" cy="330" r="125" fill="url(#sphere)" stroke="#174b77" stroke-width="2"/>'
   b+=F.label(340,50,'z',36,fill=color)+F.label(675,342,'y',36,fill=color)+F.label(135,610,'x',36,fill=color)
  else:
   b='<defs><radialGradient id="sphere" cx="35%" cy="35%"><stop offset="0" stop-color="#d2d2d2"/><stop offset="1" stop-color="#929292"/></radialGradient></defs><circle cx="340" cy="330" r="125" fill="url(#sphere)"/>'
   b+=line(340,650,340,40)+line(15,330,650,330)+line(540,105,120,575)
   b+='<g fill="#252440"><path d="M340 40L333 60H347Z"/><path d="M650 330L630 323V337Z"/><path d="M120 575L127 554L140 567Z"/></g>'
   b+=F.label(375,58,'z',36)+F.label(650,390,'x',36)+F.label(155,615,'y',36)
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Mô hình theo hình nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hydrogen-ao-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Hydrogenđủ2model/4dòngcaption;model2khôngtrackelectron/quỹđạo.284giữxchéo/yngang,trụcSAUcầu/khôngarrow;1265giữxngang/ychéo,trụcTRƯỚCcầu/3arrow.'))
(M/'cau-truc-hydrogen-ao-ddh-lo-107-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
