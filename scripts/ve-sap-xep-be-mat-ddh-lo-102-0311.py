"""Giữ tám phân tử và hướng từng đầu trong các phương án, kể cả hình hỗn hợp."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-101.json').read_text())};rows=[]
def wave(start,end,n,amp):
 step=(end-start)/n;x=start;d=f'M{x:g} 0Q{x+step/2:g} {amp} {x+step:g} 0';x+=step
 for k in range(1,n):x+=step;d+=f'T{x:g} 0'
 return f'<path d="{d}" stroke="#252440" stroke-width="3" fill="none" stroke-linecap="round"/>'
for i in[661,283,369,969,242]:
 b=''
 if i in[661,283]:
  w,h=740,420
  for col in range(2):
   for row in range(4):
    left=(row%2==0)if col==0 else(row%2!=0);xx=40+col*370;yy=55+row*90
    body=wave(25,265,9,14)+'<circle cx="5" cy="0" r="20" fill="#252440"/>'
    tr=f'translate({xx} {yy})'if left else f'translate({xx+270} {yy}) scale(-1 1)';b+=f'<g transform="{tr}">'+body+'</g>'
 else:
  w,h=600,600
  for k in range(8):
   inside=i==242 and k%2==0
   body=(wave(70,250,12,12)+'<circle cx="50" cy="0" r="20" fill="#252440"/>')if inside else(wave(225,30,13,12)+'<circle cx="245" cy="0" r="20" fill="#252440"/>')
   b+=f'<g transform="translate(300 300) rotate({k*45})">'+body+'</g>'
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Các phân tử theo sơ đồ nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='sap-xep-be-mat-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Đủ8phântửrời/đầutrònđen,khôngthêmcharge/chữ.242giữ4cardinalheadTRONG+4diagonalheadNGOÀI,khôngchuẩnhoáphươngán.'))
(M/'cau-truc-sap-xep-be-mat-ddh-lo-102-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
