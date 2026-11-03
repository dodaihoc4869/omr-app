"""Hai biểu đồ nhiệt độ sôi, giữ dữ liệu gốc và hai thang trục độc lập."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
INK='#252440';GRID='#d6d4e4';PURPLE='#6961bb'
def line(x,y,xx,yy,c=INK,w=2,extra=''):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" fill="none" stroke="{c}" stroke-width="{w}" {extra}/>'
def defs():return '<defs><pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#f2f1fb"/><circle cx="3" cy="3" r=".7" fill="#77718f"/></pattern></defs>'
def bar(x,top,bottom,w=56):return f'<rect x="{x-w/2:g}" y="{top:g}" width="{w}" height="{bottom-top:g}" fill="url(#dots)" stroke="{INK}" stroke-width="1.5"/>'
def marker(x,y):return f'<path d="M{x:g} {y-8:g}L{x-8:g} {y+7:g}L{x+8:g} {y+7:g}Z" fill="{PURPLE}"/>'
def save(i,w,h,b,**data):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Biểu đồ theo số liệu và nhãn nguồn</title>'+b+'</svg>').encode();digest=hashlib.sha256(svg).hexdigest();fn='soi-ddh-'+digest+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=digest,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',**data))
b=defs()+'<rect x="130" y="70" width="950" height="390" fill="none" stroke="#252440" stroke-width="2"/>';py=lambda v:460-v/80*390
for v in[0,20,40,60,80]:b+=F.label(110,py(v)+8,str(v),22,'end')
labels=['CH₃CH₂NH₂','CH₃CHO','HCOOCH₃','CH₃CH₂CH₂NH₂','CH₃OH'];values=[17,21,32,48,65]
for k,(label,v)in enumerate(zip(labels,values)):
 x=225+k*190;b+=bar(x,py(v),460)+F.label(x,py(v)-16,str(v),24)+F.label(x,510,label,22)
b+=F.label(38,265,'Nhiệt độ sôi (°C)',24,extra='transform="rotate(-90 38 265)"')
save(704,1150,570,b,xLabels=labels,values=values,yTicks=[0,20,40,60,80],ghiChu='Mộtseries,đủ4cạnhkhung,khôngthêmtitle/legend/xlabel.')
# Hai trục được đặt riêng: bên trái cắt ở20, bên phải bắt đầu0.
b=defs()+'<rect x="150" y="140" width="970" height="380" fill="none" stroke="#252440" stroke-width="2"/>';ym=lambda v:520-(v-20)/60*380;yt=lambda v:520-v/100*380
for v in[20,40,60,80]:
 y=ym(v);b+=F.label(130,y+8,str(v),23,'end')
 if v in[40,60]:b+=line(150,y,1120,y,GRID,1.2)
for v in[0,20,40,60,80,100]:b+=F.label(1138,yt(v)+8,str(v),23,'start')
labels=['(CH₃)₃N','CH₃CH₂-O-CH₃','CH₃CH₂-NH-CH₃','CH₃CH₂CH₂-NH₂','CH₃CH₂CH₂-OH'];mass=[59,60,59,59,60];temps=[3,8,37,48,97];xs=[247,441,635,829,1023]
for x,label,m in zip(xs,labels,mass):b+=bar(x,ym(m),520,64)+F.label(x,ym(m)-18,str(m),25)+F.label(x,565,label,20)
# Đường liền mạch qua đúng5marker, không công bố điểm trung gian thành số liệu.
xy=list(zip(xs,map(yt,temps)));hs=[xy[k+1][0]-xy[k][0]for k in range(4)];ss=[(xy[k+1][1]-xy[k][1])/hs[k]for k in range(4)];ms=[ss[0]]
for k in range(1,4):ms.append(2/(1/ss[k-1]+1/ss[k])if ss[k-1]*ss[k]>0 else 0)
ms.append(ss[-1]);curve=f'M{xy[0][0]} {xy[0][1]}'
for k,hx in enumerate(hs):
 x0,y0=xy[k];x1,y1=xy[k+1];curve+=f'C{x0+hx/3:g} {y0+ms[k]*hx/3:g} {x1-hx/3:g} {y1-ms[k+1]*hx/3:g} {x1:g} {y1:g}'
b+=f'<path d="{curve}" fill="none" stroke="{PURPLE}" stroke-width="3" stroke-dasharray="9 6"/>'
for k,(x,v)in enumerate(zip(xs,temps)):
 y=yt(v);lx=x+40 if k==4 else x;ly=y+18 if k==4 else y-18
 b+=f'<rect x="{lx-24:g}" y="{ly-23:g}" width="48" height="29" rx="3" fill="white"/>'+F.label(lx,ly,str(v),24)+marker(x,y)
b+=F.label(46,335,'Phân tử khối',24,extra='transform="rotate(-90 46 335)"')+F.label(1233,330,'Nhiệt độ sôi (°C)',24,extra='transform="rotate(-90 1233 330)"')
title='BIỂU ĐỒ SO SÁNH PHÂN TỬ KHỐI VÀ NHIỆT ĐỘ SÔI CỦA MỘT SỐ HỢP CHẤT HỮU CƠ';size=24*min(1,1180/F.advance(title,24));b+=F.label(640,78,title,size)
b+='<rect x="280" y="650" width="60" height="25" fill="url(#dots)" stroke="#252440"/>'+F.label(360,671,'Phân tử khối',23,'start')+line(690,662,775,662,PURPLE,3,'stroke-dasharray="9 6"')+marker(732,662)+F.label(795,671,'Nhiệt độ sôi (°C)',23,'start')
save(1418,1280,730,b,xLabels=labels,mass=mass,temperature=temps,yTicksMass=[20,40,60,80],yTicksTemperature=[0,20,40,60,80,100],ghiChu='Giữ2thangkhácnhau;khônggộptrục,masscộtchấm,tempnétđứt+tamgiác,đủlegend/title/datalabel.')
(M/'cau-truc-soi-ddh-lo-27-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng2biểuđồ, chờsoát2trụcvàmọisốdata.')
