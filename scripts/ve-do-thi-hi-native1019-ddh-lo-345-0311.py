"""Đồ thị HI nguồn1019: một đường đỏ, lưới và mọi nhãn nguyên văn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='b6c93db56d3ba3eef16373bc027c8db920e92eb94f2880f4d761f97b850df523';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
xs=[144,163,180.5,199.5,219.5,238,256,275,293.5,313,330,349.5,368.5,388,405.5,424.5,444.5,463,481,498.5]
ys=[71.5,90,108,127,146,165.5,183,202,221.5,240.5,258,277,295.5,314,332,350.5,370,389,406.5,426]
b='<path d="'+' '.join(f'M{x} 71.5V441' for x in xs)+' '+' '.join(f'M129 {y}H498.5' for y in ys)+'" fill="none" stroke="#00816e" stroke-width="0.8"/>'
b+='<path d="'+' '.join(f'M123 {y}H129' for y in ys if y not in [71.5,165.5,258,350.5])+'" fill="none" stroke="#00816e" stroke-width="0.7"/>'
b+='<path d="M129 71.5H498.5V441" fill="none" stroke="#001a17" stroke-width="0.9"/>'
# Mẫu đọc từ nét đỏ native; Hermite đơn điệu, không thêm marker.
points=[(129,441),(140,409.5),(150,379.5),(160,352),(180,303.5),(200,266.5),(220,237),(240,211.5),(260,192),(280,176.5),(300,163.5),(320,154),(340,147),(360,142.5),(380,138),(400,133.5),(420,130),(440,127.5),(460,127.5),(480,127.5),(490,127.5)]
sec=[(v[1]-u[1])/(v[0]-u[0]) for u,v in zip(points,points[1:])];slopes=[sec[0]]+[(0 if a*b<=0 else 2*a*b/(a+b))for a,b in zip(sec,sec[1:])]+[0]
curve='M129 441'
for j,((x,y),(u,v))in enumerate(zip(points,points[1:])):
 dx=(u-x)/3;curve+=f'C{x+dx:.3f} {y+slopes[j]*dx:.3f} {u-dx:.3f} {v-slopes[j+1]*dx:.3f} {u} {v}'
b+='<path d="'+curve+'" fill="none" stroke="#ed0000" stroke-width="1.8" stroke-linecap="round"/>'

# Trục xanh che nét đỏ sát gốc như native.
b+='<path d="M129 12V441H599" fill="none" stroke="#0800b8" stroke-width="2"/><path d="M129 4L123.5 15L134.5 15Z M607 441L596 435.5L596 446.5Z" fill="#0800b8"/>'
b+='<path d="'+' '.join(f'M{x} 441V452' for x in [219.5,313,405.5,498.5])+' '+' '.join(f'M114 {y}H129' for y in [71.5,165.5,258,350.5])+'" fill="none" stroke="#001a17" stroke-width="0.8"/>'
for x,t in [(219.5,'1'),(313,'2'),(405.5,'3'),(498.5,'4')]:b+='<g transform="translate('+str(x)+' 480)skewX(-10)">'+F.label(0,0,t,27,fill='#001a17')+'</g>'
for y,t in [(79,'2,0'),(173,'1,5'),(266,'1,0'),(359,'0,5'),(456,'0')]:b+='<g transform="translate(111 '+str(y)+')skewX(-10)">'+F.label(0,0,t,27,anchor='end',fill='#001a17')+'</g>'
b+='<g transform="translate(51 254)rotate(-90)">'+F.label(0,0,'Lượng HI (mol)',29,weight='dam',fill='#001a17')+'</g>'
b+=F.label(337,520,'Thời gian',29,fill='#001a17')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="630" height="531" viewBox="0 0 630 531"><title>Đồ thị HI theo nguồn1019</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='do-thi-hi-native1019-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1019,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1redcurve-finitehorizontalplateau/nativeirregular20V20Hgreen+2blueaxisboundaries/2filledheads/4commaY4X1origin0/numeralsregularITALIC-Lượng HI (mol)trueDAMrotated-Thời gianregular/noaddedplateauvalue-unit-marker-answer-noalias847')
(K/'cau-truc-do-thi-hi-native1019-ddh-lo-345-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
