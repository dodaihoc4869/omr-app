"""Dựng đồ thị từ trục/số liệu đã đọc nguyên ảnh nguồn, không suy số liệu mới."""
from pathlib import Path
import json,hashlib,html
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem'
A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash'])
def text(x,y,s,size=24,anchor='middle',extra=''):
 return f'<text x="{x}" y="{y}" font-family="DejaVu Sans,Arial,sans-serif" font-size="{size}" text-anchor="{anchor}" fill="#252440" {extra}>{html.escape(s)}</text>'
def line(x,y,xx,yy,color='#252440',width=2,extra=''):
 return f'<path d="M{x} {y}L{xx} {yy}" stroke="{color}" stroke-width="{width}" fill="none" {extra}/>'
def root(w,h,b):return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Đồ thị theo trục và số liệu nguồn</title>'+b+'</svg>'
b=line(105,320,105,42)+line(105,320,540,320)
b+='<path d="M98 56L105 42L112 56M526 313L540 320L526 327" stroke="#252440" stroke-width="2.5" fill="none"/>'
b+=line(105,120,472,120,'#aaa8c2',2,'stroke-dasharray="3 6"')
b+='<path d="M105 320C125 213 184 139 288 123C320 120 350 120 380 120L472 120" stroke="#087f8e" stroke-width="4" fill="none"/>'
b+=text(122,59,'n',30,'start')+text(534,299,'t',30)+text(83,352,'0',28)+text(91,129,'0,1',28,'end')
plots=[{'i':8,'svgText':root(600,400,b),'kieu':'dinh-tinh','truc':['n','t'],'mocY':'0,1','ghiChu':'Không suy thời gian đạt cân bằng hoặc thêm mốc t; đường cong tăng rồi nằm ngang như nguồn.'}]
b='';left,top,width,height=150,55,780,390
for y in range(0,201,20):
 yy=top+height-y/200*height;b+=line(left,yy,left+width,yy,'#d9d9e5',1.5)+text(left-18,yy+8,str(y),22,'end')
for k,label in enumerate(['0','0.25','0.5','0.75','1','1.25','1.5']):
 x=left+k*width/6;b+=line(x,top,x,top+height,'#d9d9e5',1.5)+text(x,top+height+38,label,22)
points=[[0,180],[0.5,120],[1,60],[1.5,30]];xy=[(left+x/1.5*width,top+height-y/200*height)for x,y in points]
b+='<polyline points="'+' '.join(f'{x},{y}'for x,y in xy)+'" stroke="#087f8e" stroke-width="4" fill="none"/>'
for x,y in xy:b+=f'<circle cx="{x}" cy="{y}" r="6" fill="#087f8e"/>'
b+=text(930,520,'Nồng độ enzyme protease (%)',24,'end')+text(55,250,'Thời gian làm mềm thịt (phút)',24,'middle','transform="rotate(-90 55 250)"')
plots.append({'i':70,'svgText':root(1000,550,b),'kieu':'so-lieu','diem':points,'xTick':['0','0.25','0.5','0.75','1','1.25','1.5'],'yTick':list(range(0,201,20)),'nhanTruc':['Nồng độ enzyme protease (%)','Thời gian làm mềm thịt (phút)']})
out=M/'cau-truc-do-thi-lo-8-ban-dung.json';old={(r['hash'],r['hashSvg']):r for r in json.loads(out.read_text())}if out.exists()else{};rows=[]
for r in plots:
 a=A[r['i']];b=r.pop('svgText').encode();digest=hashlib.sha256(b).hexdigest();fn='do-thi-'+digest+'.svg';(M/fn).write_bytes(b);r.update(hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=digest,byteSvg=len(b),trangThai='cho-soat-doc-lap')
 previous=old.get((r['hash'],digest),{})
 if previous.get('trangThai')=='da-soat-doc-lap':
  for k in ['trangThai','hashSvgDaSoat','nguoiSoat']:r[k]=previous[k]
 rows.append(r)
out.write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng',len(rows),'đồ thị; chờ kiểm độc lập.')
