"""Đồ thị định tính: không thêm số, tên chất hoặc giá trị plateau chưa có nguồn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
source={r['i']:r for r in json.loads((M/'doc-do-thi-lo-58.json').read_text())};rows=[]
def line(x,y,xx,yy,color='#252440',width=2,extra=''):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" fill="none" stroke="{color}" stroke-width="{width}" {extra}/>'
def save(i,w,h,b):
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Đồ thị theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='do-thi-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(source[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap'))
y=lambda v:540-v/10*440
b='<path d="M170 75V540H1040M160 95L170 70L180 95M1020 530L1045 540L1020 550" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
for v in range(0,11,2):b+=line(160,y(v),180,y(v))+F.label(140,y(v)+8,str(v),25,'end')
for v,label in[(8.64,'8,64'),(.68,'0,68')]:b+=line(170,y(v),940,y(v),'#77718f',1.8,'stroke-dasharray="7 6"')+F.label(960,y(v)+8,label,27,'start')
b+=f'<path d="M170 540C210 330 350 {y(8.64):g} 520 {y(8.64):g}H780M170 316C240 430 340 {y(.68):g} 500 {y(.68):g}H780" fill="none" stroke="#252440" stroke-width="2.8"/>'
b+=F.label(650,125,'Trạng thái cân bằng',28)+F.label(610,605,'Thời gian',30)+F.label(45,315,'Nồng độ của chất phản ứng (10⁻³ M)',28,extra='transform="rotate(-90 45 315)"')
save(128,1140,650,b)
# Bốn lựa chọn giữ thứ tự; bố trí2cột để đọc rõ số và các plateau trên màn nhỏ.
b=''
for k in range(4):
 g='<path d="M70 50V250H390M60 70L70 45L80 70M370 240L395 250L370 260" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
 g+=line(62,90,70,90)+F.label(60,98,'0,1',25,'end')+F.label(58,280,'0',25)+F.label(70,25,'n',28)+F.label(400,260,'t',28)+F.label(225,325,f'({k+1})',27)
 if k==0:guide=150;path='M70 250C100 170 155 150 260 150H335'
 elif k==1:guide=90;path='M70 250C100 130 155 90 260 90H335'
 elif k==2:guide=90;path='M70 250L250 90H335'
 else:guide=210;path='M70 90C95 180 145 210 260 210H335'
 g+=line(70,guide,335,guide,'#77718f',1.8,'stroke-dasharray="7 6"')+f'<path d="{path}" fill="none" stroke="#252440" stroke-width="2.8"/>'
 b+=f'<g transform="translate({20+(k%2)*480} {20+(k//2)*370})">'+g+'</g>'
save(144,980,760,b)
b='<path d="M120 65V500H950" fill="none" stroke="#252440" stroke-width="4"/>'
b+='<path d="M120 500C260 270 520 205 780 180" fill="none" stroke="#252440" stroke-width="3" stroke-dasharray="7 6"/>'
b+='<path d="M120 110C170 280 380 350 650 350H830M120 110C150 340 360 475 650 475H790" fill="none" stroke="#252440" stroke-width="2.8"/>'
b+=F.label(825,190,'(1)',29)+F.label(875,360,'(2)',29)+F.label(835,485,'(3)',29)+F.label(540,560,'Thời gian',30)+F.label(45,275,'Nồng độ',30,extra='transform="rotate(-90 45 275)"')
save(153,1000,610,b)
(M/'cau-truc-do-thi-dinh-tinh-ddh-lo-65-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('Đã dựng3đồ thị, chờ soát độc lập.')
