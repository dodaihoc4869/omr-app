"""Giữ hình học đọc từ nguồn, không suy giá trị đỉnh hoặc sửa mâu thuẫn đề/hình."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
source={r['i']:r for r in json.loads((M/'doc-do-thi-lo-58.json').read_text())};rows=[]
def line(x,y,xx,yy,color='#252440',width=2):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" fill="none" stroke="{color}" stroke-width="{width}"/>'
def save(i,w,h,b):
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Đồ thị theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='do-thi-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(source[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap'))
#157: Pepsin liền và Chymotrypsin chấm. Không thêm7,5 hoặc yticks.
x=lambda v:72+(v-1)/11*744;peak=x(2)
b=f'<path d="M72 80V534H890M62 100L72 75L82 100M870 524L895 534L870 544" fill="none" stroke="#77718f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+line(peak,100,peak,534,'#b9b6c6',1)
for v in range(1,13):b+=F.label(x(v),586,str(v),25)
b+=f'<path d="M72 336C96 280 112 100 {peak:g} 100C180 100 191 460 244 498" fill="none" stroke="#252440" stroke-width="3.5"/>'
b+='<path d="M364 468C408 320 452 86 504 86C552 86 598 400 648 468" fill="none" stroke="#252440" stroke-width="3.5" stroke-dasharray="2 8" stroke-linecap="round"/>'
b+=F.label(212,114,'Pepsin',27)+F.label(504,56,'Chymotrypsin',27)+F.label(445,644,'pH',29)+F.label(31,315,'Tốc độ phản ứng',27,extra='transform="rotate(-90 31 315)"')
save(157,920,680,b)
#207/216 có hình khác nhau: dựng nét riêng bằng tọa độPIXEL, không alias đỉnh.
caption='Biểu đồ hoạt động của một số enzyme tiêu hoá trong cơ thể người'
for i,scale,w,h in[(207,1.5,1164,770),(216,2,978,630)]:
 if i==207:
  left,bottom,top,right=84,398,96,692;ticks=[187,295,403,511,619]
  curves=['M84 368C112 352 139 321 148 274C160 232 176 211 195 211C215 211 217 237 217 283C217 329 241 353 279 371','M353 365C391 335 414 296 420 225C426 145 441 124 460 124C480 124 481 145 480 205C480 291 493 359 526 372','M391 368C424 335 452 300 466 257C483 214 502 197 526 197C557 197 570 213 577 253C588 302 605 355 642 374']
  labels=[(195,199,'pepsin'),(458,113,'amylase'),(544,187,'trypsin')];tickY=430;phX,phY=711,408;titleX=105;titleYs=[55,80];capY=467
 else:
  left,bottom,top,right=36,251,45,452;ticks=[107,181,255,329,403]
  curves=['M36 231C66 214 77 184 87 153C95 131 102 123 111 123C124 123 125 140 126 166C125 203 143 224 169 233','M221 230C247 210 262 180 266 128C270 79 282 64 291 64C307 64 307 79 307 113C307 164 315 222 339 234','M247 231C271 209 292 178 306 144C315 123 326 114 337 114C358 114 370 126 374 156C383 196 395 224 417 234']
  labels=[(111,115,'pepsin'),(290,54,'amylase'),(341,108,'trypsin')];tickY=271;phX,phY=470,259;titleX=48;titleYs=[15,34];capY=299
 geom=f'<path d="M{left} {top}V{bottom}H{right}" fill="none" stroke="#252440" stroke-width="1.7"/>'
 for xx in ticks:geom+=line(xx,bottom-4,xx,bottom+4,width=1.5)
 for path in curves:geom+=f'<path d="{path}" fill="none" stroke="#252440" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
 b=f'<g transform="scale({scale})">'+geom+'</g>'
 for xx,value in zip(ticks,[2,4,6,8,10]):b+=F.label(xx*scale,tickY*scale,str(value),26)
 for xx,yy,label in labels:b+=F.label(xx*scale,yy*scale,label,27)
 b+=F.label(phX*scale,phY*scale,'pH',28)
 for yy,label in zip(titleYs,['Độ hoạt động','của enzyme']):b+=F.label(titleX*scale,yy*scale,label,28)
 size=min(30,(w-40)/F.advance(caption,1));b+=F.label(w/2,capY*scale,caption,size)
 save(i,w,h,b)
#96: vùng tô và20’/55’ đúng như HÌNH; không sửa theo15’–85’ ở câu dẫn.
scale=1.35
b=f'<rect x="{299*scale:g}" y="{71*scale:g}" width="{218*scale:g}" height="{337*scale:g}" fill="#d6d4e4"/>'
geom='<path d="M139 40V408H887M132 56L139 34L146 56M869 400L893 408L869 416" fill="none" stroke="#252440" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
for xx in[299,517]:geom+=line(xx,71,xx,454,'#77718f',1)
for xx in[139,246,355,464,573,682,792]:geom+=line(xx,399,xx,417,width=1.5)
for yy in[366,307,248,189,130,71]:geom+=line(130,yy,148,yy,width=1.5)
geom+='<path d="M139 218C180 213 220 216 246 220C270 224 289 293 330 293C390 293 460 182 517 182C556 182 610 215 648 215C676 215 697 202 717 202C744 202 768 219 792 219" fill="none" stroke="#252440" stroke-width="2"/>'
b+=f'<g transform="scale({scale})">'+geom+'</g>'
for xx,value in zip([139,246,355,464,573,682,792],[0,20,40,60,80,100,120]):b+=F.label(xx*scale,447*scale,str(value),29)
for yy,value in zip([366,307,248,189,130,71],[40,60,80,100,120,140]):b+=F.label(117*scale,yy*scale+9,str(value),29,'end')
b+=F.label(200,32,'mg/dL',32)+F.label(1220,603,'phút',30)
b+=F.label(40,320,'Đường huyết',32,extra='transform="rotate(-90 40 320)"')+F.label(85,320,'(lượng glucose trong máu)',30,extra='transform="rotate(-90 85 320)"')
b+=F.label(299*scale,486*scale,'Sau khi tập 20’',30)+F.label(517*scale,486*scale,'Sau khi tập 55’',30)
save(96,1280,730,b)
(M/'cau-truc-enzyme-duong-huyet-ddh-lo-66-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('Đã dựng4đồ thị, chờ soát độc lập.')
