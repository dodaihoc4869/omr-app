"""Dựng lại tám đồ thị đã mở nguồn; tọa độ bố cục không phải điểm đo mới."""
from pathlib import Path
import json,hashlib,html
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash'])
INK='#252440';TEAL='#087f8e';PURPLE='#6961bb';GRID='#d6d4e4';rows=[]
def text(x,y,s,size=24,anchor='middle',extra=''):
 return f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="DejaVu Sans,Arial,sans-serif" font-size="{size}" fill="{INK}" {extra}>{html.escape(str(s))}</text>'
def path(d,color=INK,width=2,extra=''):
 return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round" {extra}/>'
def line(x,y,xx,yy,color=INK,width=2,extra=''):return path(f'M{x:g} {y:g}L{xx:g} {yy:g}',color,width,extra)
def guide(x,y,xx,yy):return line(x,y,xx,yy,GRID,1.5,'stroke-dasharray="3 5"')
def axes(x,y,right,top):return line(x,y,right,y)+line(x,y,x,top)+path(f'M{right-13} {y-6}L{right} {y}L{right-13} {y+6}M{x-6} {top+13}L{x} {top}L{x+6} {top+13}')
def add(i,w,h,b,**data):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Đồ thị theo hình nguồn</title>'+b+'</svg>').encode();digest=hashlib.sha256(svg).hexdigest();fn='do-thi-'+digest+'.svg';(M/fn).write_bytes(svg);a=A[i]
 rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=digest,byteSvg=len(svg),trangThai='cho-soat-doc-lap',nguoiDocNguon='soat_nguon_3',**data))
# 21: giữ hình học đườngKCl từ ảnh, không làm tròn thành số liệu thí nghiệm.
left,bottom,w,h=130,390,600,300;b=''
for v in range(0,101,10):
 x=left+v/100*w;b+=line(x,bottom-h,x,bottom,GRID,1.5)+text(x,bottom+30,v,21)
for v in range(10,71,10):
 y=bottom-v/70*h;b+=line(left,y,left+w,y,GRID,1.5)+text(left-16,y+7,v,21,'end')
b+=line(left,bottom,left+w,bottom)+line(left,bottom,left,bottom-h)
def src21(x,y):return(left+(x-120)/438*w,bottom-(360-y)/307*h)
p,q=src21(120,241),src21(558,108);b+=line(*p,*q,TEAL,3.5);b+=text(left+w+12,q[1]+8,'KCl',25,'start')
y=bottom-40/70*h;b+=line(left,y,left+w,y,PURPLE,3.5)+text(left+w+12,y+8,'NaCl',25,'start')
b+=text(430,466,'Nhiệt độ (°C)')+text(40,240,'Độ tan (g chất tan/100 g H₂O)',23,'middle','transform="rotate(-90 40 240)"')
add(21,900,500,b,xTicks=list(range(0,101,10)),yTicks=list(range(0,71,10)),traceKClPx=[[120,241],[558,108]],frameNguonPx=[120,53,558,360],NaCl=40,ghiChu='Không gán giá trị nguyên cho đầu/cuối/giao điểm KCl; đường không marker.')
# 108: pH có số, tốc độ chỉ định tính; đỉnh Chymotrypsin giữa7 và8.
b=axes(110,390,835,40)
for v in range(1,13):b+=text(110+(v-1)*60,425,v,22)
b+=guide(170,390,170,70)+path('M110 244C125 218 142 70 170 70C196 70 215 345 260 365',TEAL,3.5)
b+=path('M380 343C420 245 460 55 500 55C533 55 588 300 620 343',PURPLE,3.5,'stroke-dasharray="2 7"')
b+=text(202,80,'Pepsin',24,'start')+text(500,31,'Chymotrypsin',24)+text(470,468,'pH')+text(35,220,'Tốc độ phản ứng',24,'middle','transform="rotate(-90 35 220)"')
add(108,900,500,b,kieu='dinh-tinh',xTicks=list(range(1,13)),yTicks=[],ghiChu='Pepsin đỉnh2, Chymotrypsin đỉnhgiữa7và8 cao hơn; không suy tốc độ hay thêm marker.')
# 115: giao tại t1; hai mức cân bằng KHÁC nhau, nằm ngang từ t2.
b=axes(110,360,835,40)
for x,label in [(245,'t₁'),(410,'t₂'),(535,'t₃'),(650,'t₄')]:b+=guide(x,360,x,85)+text(x,397,label)
b+=path('M110 60C135 120 190 180 245 205C300 240 355 265 410 265H800',TEAL,3.5)
b+=path('M110 360C145 285 195 238 245 205C310 155 355 125 410 125H800',PURPLE,3.5)
b+=text(170,105,'(a)')+text(170,317,'(b)')+text(875,441,'Thời gian',24,'end')+text(38,208,'Nồng độ',24,'middle','transform="rotate(-90 38 208)"')
add(115,920,470,b,kieu='dinh-tinh',xTicks=['t₁','t₂','t₃','t₄'],ghiChu='Giữ giao tại t1 và nằm ngang từt2; (a) giảm, plateau thấp; (b) tăng, plateau cao.')
# 150: chỉ HAI đường, nhãn H2+I2 là một đường thấp.
b=axes(110,370,835,35)+path('M110 50C145 130 200 150 310 150H800',TEAL,3.5)+path('M110 370C180 340 245 335 310 335H800',PURPLE,3.5)
b+=text(520,126,'HI',26)+text(520,314,'H₂ + I₂',26)+text(475,430,'Thời gian')+text(38,205,'Nồng độ',24,'middle','transform="rotate(-90 38 205)"')
add(150,900,460,b,kieu='dinh-tinh',soDuong=2,nhan=['HI','H₂ + I₂'],ghiChu='Không tách nhãnH2+I2 thành hai đường, không thêm số liệu.')
# 233: mẫu pixel là nét nguồn, tuyệt đối không vẽ thành marker/điểm đo trung gian.
b=axes(110,360,710,50);x=lambda t:110+t*6;y=lambda v:360-v/30*280
for v in range(15,91,15):b+=line(x(v),360,x(v),351)+text(x(v),391,v,22)
for v in range(5,31,5):b+=line(110,y(v),119,y(v))+text(96,y(v)+8,v,22,'end')
b+=text(96,389,'0',22,'end')+guide(x(0),y(25),x(75),y(25))+guide(x(75),y(0),x(75),y(25))
samples=[[134,357],[140,336.5],[160,287],[180,252],[200,229.5],[220,211],[240,198.5],[260,189.5],[280,182.5],[300,177],[320,172],[340,167.5],[360,163],[380,159],[400,155],[420,150.5],[439,147]]
xy=[(110+(sx-134)/305*450,360-(357-sy)/210*(25/30*280))for sx,sy in samples]
# Nội suy đơn điệu qua nét nguồn để bỏ góc gấp, không tạo điểm đo/marker.
hs=[xy[k+1][0]-xy[k][0]for k in range(len(xy)-1)];ss=[(xy[k+1][1]-xy[k][1])/hs[k]for k in range(len(hs))];ms=[ss[0]]
for k in range(1,len(xy)-1):
 w1=2*hs[k]+hs[k-1];w2=hs[k]+2*hs[k-1]
 ms.append((w1+w2)/(w1/ss[k-1]+w2/ss[k])if ss[k-1]*ss[k]>0 else 0)
ms.append(ss[-1]);curve=f'M{xy[0][0]:.3f} {xy[0][1]:.3f}'
for k,hx in enumerate(hs):
 x0,y0=xy[k];x1,y1=xy[k+1];curve+=f'C{x0+hx/3:.3f} {y0+ms[k]*hx/3:.3f} {x1-hx/3:.3f} {y1-ms[k+1]*hx/3:.3f} {x1:.3f} {y1:.3f}'
b+=path(curve,TEAL,4)
b+=text(40,34,'Thể tích CO₂ (mL)',24,'start')+text(875,445,'Thời gian phản ứng (s)',24,'end')
add(233,920,480,b,xTicks=list(range(0,91,15)),yTicks=list(range(0,31,5)),diemCoMocRo=[[0,0],[75,25]],traceGeometryPx=samples,ghiChu='Kết thúc(75;25), không kéo đến90; không marker, không công bố mẫu pixel thành dữliệu.')
# 249: trục bị cắt dưới30; không thêm tick80.
b='';px=lambda t:140+(t-20)*5;py=lambda v:400-(v-28)*6.8
for v in range(20,141,20):b+=guide(px(v),70,px(v),400)+text(px(v),431,v,22)
for v in [30,40,50,60,70]:b+=guide(100,py(v),780,py(v))+text(87,py(v)+8,v,22,'end')
b+=line(100,50,100,400)+line(100,400,780,400);pts=[[20,30],[40,55],[60,70],[80,75],[100,65],[120,50],[140,35]]
b+=path('M'+'L'.join(f'{px(t):g} {py(v):g}'for t,v in pts),TEAL,3.5)
for t,v in pts:b+=f'<circle cx="{px(t):g}" cy="{py(v):g}" r="5" fill="{TEAL}"/>'
b+=text(440,472,'Nhiệt độ (°C)')+text(35,245,'Hiệu suất (%)',23,'middle','transform="rotate(-90 35 245)"')+text(450,529,'Ảnh hưởng của nhiệt độ đến hiệu suất tổng hợp ethyl acetate',22)
add(249,900,560,b,xTicks=list(range(20,141,20)),yTicks=[30,40,50,60,70],diem=pts,ghiChu='Giữ trục cắt ởgần30, không thêm0/80; đơn sắcđổi teal khôngmang dữliệu.')
# 404: đỉnh37, bên trái rộng/bên phải dốc; hết nét tại50.
b=axes(100,370,830,35);px=lambda v:100+11*v
for v in [0,10,20,30,37,40,50,60]:b+=text(px(v),407,v,22)
# Lô78: giữ sáu vạch chia nhìn thấy trong nguồn404/525.
for v in [10,20,30,40,50,60]:b+=line(px(v),366,px(v),374)
b+=guide(px(37),370,px(37),80)
samples404=[[68, 311], [90, 308], [120, 307], [150, 303], [180, 299], [210, 291], [240, 279], [260, 268], [280, 256], [295, 244], [310, 215], [325, 173], [340, 132], [355, 102], [370, 85], [385, 81], [390, 79], [405, 87], [420, 101], [435, 120], [450, 144], [465, 172], [480, 213], [490, 243], [498, 275], [503, 296], [505, 304], [507, 311]]
xy=[((100+(sx-68)/(390-68)*407)if sx<=390 else(507+(sx-390)/(507-390)*143),370-(311-sy)/(311-79)*290)for sx,sy in samples404]
hs=[xy[k+1][0]-xy[k][0]for k in range(len(xy)-1)];ss=[(xy[k+1][1]-xy[k][1])/hs[k]for k in range(len(hs))];ms=[ss[0]]
for k in range(1,len(xy)-1):
 w1=2*hs[k]+hs[k-1];w2=hs[k]+2*hs[k-1]
 ms.append((w1+w2)/(w1/ss[k-1]+w2/ss[k])if ss[k-1]*ss[k]>0 else 0)
ms.append(ss[-1]);curve=f'M{xy[0][0]:.3f} {xy[0][1]:.3f}'
for k,hx in enumerate(hs):
 x0,y0=xy[k];x1,y1=xy[k+1];curve+=f'C{x0+hx/3:.3f} {y0+ms[k]*hx/3:.3f} {x1-hx/3:.3f} {y1-ms[k+1]*hx/3:.3f} {x1:.3f} {y1:.3f}'
b+=path(curve,TEAL,3.5)
b+=text(465,458,'Nhiệt độ (°C)')+text(35,220,'Tốc độ phản ứng',24,'middle','transform="rotate(-90 35 220)"')
add(404,900,490,b,traceGeometryPx=samples404,kieu='dinh-tinh',xTicks=[0,10,20,30,37,40,50,60],yTicks=[],ghiChu='Đỉnh37, hết nét50; không gán số tốc độ hoặc kéo đường sau50.')
# 476: số liệu in trên cột giữ nguyên dấu phẩy, không thêm0 tại gốc.
b=axes(120,440,850,45);py=lambda v:440-v*23
for v,label in [(2.5,'2,5'),(5,'5'),(7.5,'7,5'),(10,'10'),(12.5,'12,5'),(15,'15')]:
 b+=(line(120,py(v),800,py(v),INK,1.5)if v==15 else guide(120,py(v),800,py(v)))+text(101,py(v)+8,label,22,'end')
values=[11.61,11.37,11.97,12.67,13.39,14.07];years=[2019,2021,2023,2025,2027,2029]
for k,(year,v)in enumerate(zip(years,values)):
 x=185+k*110;last=year==2029;labelY=py(v)-(4 if last else 13);font=20 if last else 23;maskY=py(v)-(20.5 if last else 36);maskH=20 if last else 29
 b+=f'<rect x="{x-31}" y="{py(v):.3f}" width="62" height="{v*23:.3f}" fill="{TEAL}"/><rect x="{x-40}" y="{maskY:.3f}" width="80" height="{maskH}" rx="3" fill="white"/>'+text(x,labelY,f'{v:.2f}'.replace('.',','),font)+text(x,476,year,22)
b+=text(24,32,'Triệu tấn',23,'start')+text(849,490,'Năm',23)+text(475,542,'Sản lượng tiêu thụ phenol trên toàn thế giới',24)
add(476,950,575,b,xTicks=years,yTicks=['2,5','5','7,5','10','12,5','15'],cot=[{'x':a,'y':b,'label':f'{b:.2f}'.replace('.',',')}for a,b in zip(years,values)],ghiChu='Không thêm số0; đủ6cột,đường15liền,cácđườnglưới còn lại chấm; đơn sắcđổi teal khôngmang dữliệu.')
out=M/'cau-truc-do-thi-lo-9-ban-dung.json';old={(a['hash'],a['hashSvg']):a for a in json.loads(out.read_text())}if out.exists()else{}
for r in rows:
 previous=old.get((r['hash'],r['hashSvg']),{})
 if previous.get('trangThai')=='da-soat-doc-lap':
  for k in ['trangThai','hashSvgDaSoat','nguoiSoat']:r[k]=previous[k]
out.write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng8 đồthị; chờsoát từng nguồn vàbản mới.')
