"""Giữ riêng hai sơ đồ tinh bột, đặc biệt chiều Glycogen/Glucose và nhãn enzyme."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def line(x,y,xx,yy):return f'<path d="M{x} {y}L{xx} {yy}" stroke="#252440" stroke-width="2.5" fill="none"/>'
def arrow(x,y,xx,yy):
 sign=1 if xx>x else -1
 return line(x,y,xx,yy)+f'<path d="M{xx-sign*11} {yy-5}L{xx} {yy}L{xx-sign*11} {yy+5}Z" fill="#252440"/>'
for i in[1188,1423]:
 boxed=i==1188;b=''
 nodes=[(30,130,150,'Tinh bột'),(340,130,140,'Dextrin'),(640,130,150,'Maltose'),(920,130,150,'Glucose'),(1240,40,200,'CO₂ + H₂O'),(1200,220,180,'Glycogen')]
 if boxed:nodes.append((1490,220,150,'Glucose'))
 for x,y,w,t in nodes:
  if boxed:b+=f'<rect x="{x}" y="{y}" width="{w}" height="60" rx="10" fill="#f2f1fb" stroke="#c9c9de" stroke-width="1.5"/>'
  b+=F.label(x+w/2,y+38,t,27)
 for k,(x,xx,enzyme)in enumerate([(180,340,'α-amylase'),(480,640,'β-amylase'),(790,920,'enzyme'if boxed else'maltase')],1):
  b+=arrow(x,160,xx,160);cx=(x+xx)/2
  b+=F.label(cx,130,enzyme if boxed else'H₂O',24)+F.label(cx,195 if boxed else 205,f'({k})'if boxed else enzyme,22 if boxed else 24)
 b+=line(1070,160,1100,160)+line(1100,70,1100,250 if boxed else 258)+arrow(1100,70,1240,70)
 b+=F.label(1170,48,'enzyme'if boxed else'[O]',24)+F.label(1170,105,'(4)'if boxed else'enzyme',22 if boxed else 24)
 if boxed:
  b+=arrow(1100,250,1200,250)+F.label(1150,220,'enzyme',24)+F.label(1150,286,'(5)',22)
  b+=arrow(1380,250,1490,250)+F.label(1435,220,'enzyme',24)+F.label(1435,286,'(6)',22)
 else:b+=arrow(1100,242,1200,242)+arrow(1200,258,1100,258)+F.label(1150,220,'enzyme',24)
 width=1680 if boxed else 1480;svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="330" viewBox="0 0 {width} 330"><title>Sơ đồ chuyển hóa theo nguồn</title>'+b+'</svg>').encode();h=hashlib.sha256(svg).hexdigest();fn='tinh-bot-ddh-'+h+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=h,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu='1188có6sốquátrình/ôvàGlycogen→Glucosecuối;1423khôngsố/khôngô,cóH2O/maltase/[O]vàGlucose⇄Glycogen.'))
(M/'cau-truc-tinh-bot-ddh-lo-25-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng2sơđồ, chờsoát chiều vànhãn.')
