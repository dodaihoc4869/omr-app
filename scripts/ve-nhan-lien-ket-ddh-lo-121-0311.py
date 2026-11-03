"""Giữ nhãn mũi tên/bond đúng nguồn, không suy vị trí nhóm chức từ đáp án."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('haworth',G/'scripts/haworth-ddh-0311.py');H=importlib.util.module_from_spec(s);s.loader.exec_module(H);F=H.F;a={r['i']:r for r in json.loads((M/'doc-molecule-lo-117.json').read_text())};rows=[]
def arrow(x,y,xx,yy):
 dx,dy=xx-x,yy-y;d=math.hypot(dx,dy);ux,uy=dx/d,dy/d;return H.line(x,y,xx,yy,2)+f'<path d="M{xx} {yy}L{xx-ux*16-uy*5} {yy-uy*16+ux*5}L{xx-ux*16+uy*5} {yy-uy*16-ux*5}Z" fill="#252440"/>'
for i in[880,838,952]:
 if i in[880,838]:
  b=H.line(150,240,310,187)+H.line(350,187,510,240)+F.label(330,190,'O',32)+H.wedge((150,240),(220,320),2,10)+H.line(220,320,440,320,10)+H.wedge((440,320),(510,240),10,2)
  for x,y,t,direction in[(150,240,'CH₂OH','up'),(510,240,'CH₂OH','up'),(150,240,'H','down'),(220,320,'H','up'),(220,320,'OH','down'),(440,320,'HO','up'),(440,320,'H','down'),(510,240,'OH','down')]:
   baseline=y-95 if direction=='up'else y+95;end=y-65 if direction=='up'else y+60
   if direction=='up'and y==320:baseline=y-40;end=y-20
   b+=H.line(x,y,x,end)
   if t=='HO':b+=F.label(x+F.advance('O',32)/2,baseline,t,32,'end')
   else:b+=F.label(x-F.advance(t[0],32)/2,baseline,t,32,'start')
  b+=arrow(420,75,420,210)+F.label(420,58,'2',30)+arrow(55,425,190,420)+F.label(30,440,'3',30)+arrow(650,300,600,165)+F.label(675,320,'4'if i==880 else'1',30)+arrow(650,430,555,360)+F.label(675,450,'1'if i==880 else'4',30)
 else:
  br={c:dict(v)for c,v in a[i]['substituents'].items()};b=H.body(br)
  for x,y,t in[(420,300,'(1)'),(310,325,'(2)'),(300,165,'(3)'),(500,210,'(4)')]:b+=F.label(x,y,t,27)
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="780" height="520" viewBox="0 0 780 520"><title>Các nhãn theo hình nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nhan-lien-ket-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='880/838giữ1/4ĐẢONHAU,arrow2thậtchỉBOND O-ring–C2(420,210),KHÔNGsửavàoOH.C3HOđúnghướngOattached/Hexplicitđủ.952nhãn(1)..(4)làBONDkhôngcarbonnumber.'))
(M/'cau-truc-nhan-lien-ket-ddh-lo-121-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
