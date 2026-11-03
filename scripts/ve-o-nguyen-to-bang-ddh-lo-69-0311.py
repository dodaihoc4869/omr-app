"""Ô nguyên tố/bảng dinh dưỡng dùng đúng DDH thường và đậm WOFF2 app."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
source={r['i']:r for r in json.loads((M/'doc-so-do-bang-lo-68.json').read_text())};rows=[]
def save(i,w,h,b,bold=False):
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bang-o-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r=dict(source[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap')
 if bold:r['hashPhongDam']=F.font('dam')[1]
 rows.append(r)
b='<rect x="15" y="15" width="220" height="320" fill="#e5f7fa" stroke="#252440" stroke-width="3"/>'
for x,y,label,size in[(125,65,'9',34),(125,190,'F',125),(125,255,'Fluorine',32),(125,315,'19',34)]:b+=F.label(x,y,label,size)
save(170,250,350,b)
b='<rect x="10" y="10" width="280" height="280" fill="#fbfbfd" stroke="#252440" stroke-width="4"/>'
b+=F.label(35,55,'6',36,'start',weight='dam')+F.label(150,210,'C',170,weight='dam')+F.label(150,250,'Carbon',24)+F.label(150,285,'12.011',33)
save(229,300,300,b,True)
widths=[300,220,280,210,200,230];edges=[20]
for w in widths:edges.append(edges[-1]+w)
b=f'<rect x="20" y="20" width="{sum(widths)}" height="380" fill="white" stroke="#77718f" stroke-width="1.5"/>'
for xx in edges[1:-1]:b+=f'<path d="M{xx} 20V400" stroke="#77718f" stroke-width="1.5"/>'
for yy in[120,190,260,330]:b+=f'<path d="M20 {yy}H{edges[-1]}" stroke="#77718f" stroke-width="1.5"/>'
headers=[['Loại đồ uống'],['Năng lượng','(kJ)'],['Carbohydrate','(g)'],['Chất béo','(g)'],['Protein','(g)'],['Calcium','(mg)']]
for j,parts in enumerate(headers):
 cx=(edges[j]+edges[j+1])/2
 for k,label in enumerate(parts):b+=F.label(cx,85 if len(parts)==1 else 65+k*40,label,34 if k==0 else 30,weight='dam')
for n,row in enumerate(source[83]['table'][1:]):
 for j,label in enumerate(row):b+=F.label((edges[j]+edges[j+1])/2,168+n*70,label,34)
save(83,1480,420,b,True)
(M/'cau-truc-o-bang-ddh-lo-69-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('Đã dựng3nguồn, chờ soát độc lập.')
