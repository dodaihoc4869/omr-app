"""Ba đồ thị: giữ mọi số ghi trên nguồn; tọa độ chưa ghi số chỉ dùng dựng nét."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
source={r['i']:r for r in json.loads((M/'doc-do-thi-lo-58.json').read_text())};rows=[]
def line(x,y,xx,yy,color='#252440',width=2,extra=''):
 return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" fill="none" stroke="{color}" stroke-width="{width}" {extra}/>'
def save(i,w,h,b):
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Đồ thị theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='do-thi-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
 rows.append(dict(source[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap'))
# Trục t bắt đầu20, không phải0. Nối mượt qua đúng5 điểm đã ghi số.
x=lambda v:110+(v-4)/6*690;y=lambda v:490-(v-20)/180*410
b='<path d="M110 75V490H840M100 95L110 70L120 95M820 480L845 490L820 500" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
for v in range(4,11):b+=line(x(v),490,x(v),498)+F.label(x(v),535,str(v),25)
for v in range(20,201,20):b+=line(102,y(v),110,y(v))+F.label(90,y(v)+8,str(v),23,'end')
pts=[(5,140),(6,80),(7,60),(8,100),(9,180)]
for a,c in pts:b+=line(110,y(c),x(a),y(c),'#77718f',1.8,'stroke-dasharray="7 6"')+line(x(a),y(c),x(a),490,'#77718f',1.8,'stroke-dasharray="7 6"')
slopes=[-80,-30,0,160/3,100];curve=f'M{x(5):g} {y(140):g}'
for k in range(4):
 a,c=pts[k];aa,cc=pts[k+1];curve+=f'C{x(a+1/3):g} {y(c+slopes[k]/3):g} {x(aa-1/3):g} {y(cc-slopes[k+1]/3):g} {x(aa):g} {y(cc):g}'
b+=f'<path d="{curve}" fill="none" stroke="#252440" stroke-width="2.8"/>'
for a,c in pts:b+=f'<circle cx="{x(a):g}" cy="{y(c):g}" r="6" fill="#252440"/>'
b+=F.label(115,45,'t (giây)',28)+F.label(862,480,'pH',28)
save(68,920,585,b)
# Bốn điểm nối thẳng, giữ dấu chấm thập phân của nguồn220.
x=lambda v:140+v/1.5*920;y=lambda v:500-v/200*440
b='<rect x="140" y="60" width="920" height="440" fill="none" stroke="#d6d4e4" stroke-width="1.5"/>'
for k,label in enumerate(['0','0.25','0.5','0.75','1','1.25','1.5']):
 xx=140+k/6*920;b+=line(xx,60,xx,500,'#d6d4e4',1.5)+F.label(xx,545,label,25)
for v in range(0,201,20):b+=line(140,y(v),1060,y(v),'#d6d4e4',1.5)+F.label(115,y(v)+8,str(v),25,'end')
pts=[(0,180),(.5,120),(1,60),(1.5,30)];b+='<path d="M'+'L'.join(f'{x(a):g} {y(c):g}'for a,c in pts)+'" fill="none" stroke="#252440" stroke-width="3.5"/>'
for a,c in pts:b+=f'<circle cx="{x(a):g}" cy="{y(c):g}" r="7" fill="#77718f" stroke="#252440" stroke-width="1.5"/>'
b+=F.label(1070,605,'Nồng độ enzyme protease (%)',30,'end')+F.label(40,285,'Thời gian làm mềm thịt (phút)',30,extra='transform="rotate(-90 40 285)"')
save(220,1140,650,b)
#307: trục theo số nguồn, riêng độ cao điểm gãy đọc PIXEL, không công bố số mol suy ra.
x=lambda day:160+day/14*900;yp=lambda pixel:60+(pixel-25)/251*400
b=''
for k in range(29):
 xx=160+k/28*900;b+=line(xx,60,xx,460,'#d6d4e4'if k%4==0 else '#e6e4ee',1.5 if k%4==0 else 1)
for k in range(21):
 yy=460-k/20*400;b+=line(160,yy,1060,yy,'#d6d4e4'if k%5==0 else '#e6e4ee',1.5 if k%5==0 else 1)
b+=line(160,60,160,460)+line(160,460,1060,460)
for v in range(0,15,2):b+=line(x(v),460,x(v),472)+F.label(x(v),508,str(v),26)
for k,label in enumerate(['0','0,5','1','1,5','2']):
 yy=460-k*100;b+=line(148,yy,160,yy)+F.label(125,yy+8,label,26,'end')
coords=[(x(0),460),(x(2),yp(201)),(x(6),yp(137)),(x(8),yp(87)),(x(10),60),(x(14),60)]
b+='<path d="M'+'L'.join(f'{xx:g} {yy:g}'for xx,yy in coords)+'" fill="none" stroke="#252440" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
b+=F.label(40,260,'Số mol ethyl alcohol',30,extra='transform="rotate(-90 40 260)"')+F.label(1190,545,'Ngày',30)
save(307,1300,590,b)
(M/'cau-truc-do-thi-ddh-lo-63-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('Đã dựng3đồ thị, chờ soát độc lập.')
