"""Bảng lên men và hai đồ thị giữ số liệu/đường gãy/các plateau độc lập."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
source={r['i']:r for r in json.loads((M/'doc-so-do-bang-lo-68.json').read_text())};rows=[]
def line(x,y,xx,yy,color='#252440',width=2,extra=''):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" fill="none" stroke="{color}" stroke-width="{width}" {extra}/>'
def save(i,w,h,b,bold=False):
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bang-do-thi-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r=dict(source[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap')
 if bold:r['hashPhongDam']=F.font('dam')[1]
 rows.append(r)
#1318: hai ô trái rowspan2; CH3COOH colspan4.
xs=[20,140,470,680,890,1100,1310]
b='<rect x="20" y="20" width="1290" height="440" fill="white" stroke="#77718f" stroke-width="1.5"/>'
for xx in xs[1:-1]:b+=line(xx,20 if xx in [140,470] else 90,xx,460,'#77718f',1.5)
b+=line(470,90,1310,90,'#77718f',1.5)
for yy in[160,220,280,340,400]:b+=line(20,yy,1310,yy,'#77718f',1.5)
b+=F.label(80,103,'Cốc',32,weight='dam')
for yy,label in[(65,'Nồng độ phần trăm'),(105,'C₂H₅OH trong dung'),(145,'dịch nghiên cứu')]:b+=F.label(305,yy,label,30,weight='dam')
b+=F.label(890,65,'Nồng độ phần trăm CH₃COOH',34,weight='dam')
for j,label in enumerate(source[1318]['header']['children']):b+=F.label((xs[j+2]+xs[j+3])/2,135,label,30,weight='dam')
for n,row in enumerate(source[1318]['rows']):
 for j,label in enumerate(row):b+=F.label((xs[j]+xs[j+1])/2,203+n*60,label,32,weight='dam'if j==0 else'de')
save(1318,1330,480,b,True)
#1190: khoảng cách X thật, không làm đều35/37 hoặc nối mượt dữ liệu.
x=lambda v:130+v/70*1050;y=lambda v:650-v*1.5
b='<path d="M130 55V650H1360M120 75L130 50L140 75M1340 640L1365 650L1340 660" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
pts=source[1190]['points']
for a,c in pts:b+=line(130,y(c),x(a),y(c),'#77718f',1.8,'stroke-dasharray="7 6"')+line(x(a),y(c),x(a),650,'#77718f',1.8,'stroke-dasharray="7 6"')
b+='<path d="M'+'L'.join(f'{x(a):g} {y(c):g}'for a,c in pts)+'" fill="none" stroke="#252440" stroke-width="3"/>'
for a,c in pts:b+=f'<circle cx="{x(a):g}" cy="{y(c):g}" r="7" fill="#252440"/>'
for v in[25,35,37,55,70]:b+=F.label(x(v)+(-10 if v==35 else 10 if v==37 else 0),700,str(v),26)
for v in[60,90,150,180,300]:b+=F.label(110,y(v)+8,str(v),26,'end')
b+=F.label(115,678,'0',26,'end')+F.label(130,35,'t (giây)',28)+F.label(1430,748,'Nhiệt độ (°C)',30,'end')
for a,c,label in zip([25,35,37,55,70],[180,90,60,150,300],source[1190]['pointLabels']):
 if a==35:xx,yy,anchor=x(a)-35,y(c)-10,'end'
 elif a==37:xx,yy,anchor=x(a)+30,y(c)+35,'start'
 elif a==55:xx,yy,anchor=x(a)+30,y(c)+8,'start'
 else:xx,yy,anchor=x(a),y(c)-30,'middle'
 b+=F.label(xx,yy,label,28,anchor,weight='dam')
save(1190,1480,790,b,True)
#361: giao tại t1, cảhai bắt đầu đoạn ngang tại t2 nhưng cao độ KHÁC NHAU.
b='<path d="M140 65V470H920M130 85L140 60L150 85M900 460L925 470L900 480" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
for xx,label in[(270,'t₁'),(470,'t₂'),(610,'t₃'),(730,'t₄')]:b+=line(xx,100,xx,470,'#77718f',1.6,'stroke-dasharray="6 6"')+F.label(xx,515,label,29)
b+='<path d="M140 90C180 180 220 220 270 250C320 280 390 340 470 340H880M140 470C180 360 220 290 270 250C320 210 390 170 470 170H880" fill="none" stroke="#252440" stroke-width="2.8"/>'
b+=F.label(210,160,'(a)',30)+F.label(205,405,'(b)',30)+F.label(60,275,'Nồng độ',30,extra='transform="rotate(-90 60 275)"')+F.label(885,555,'Thời gian',30)
save(361,1040,600,b)
(M/'cau-truc-bang-do-thi-ddh-lo-72-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('Đã dựng3nguồn, chờ soát độc lập.')
