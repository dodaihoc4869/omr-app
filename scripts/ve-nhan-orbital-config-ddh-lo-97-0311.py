"""Chữ và orbital giữ nguyên thông tin nguồn, không sửa cấu hình theo lý thuyết."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-95.json').read_text())};rows=[]
def line(x,y,xx,yy,w=3):return f'<path d="M{x} {y}L{xx} {yy}" stroke="#252440" stroke-width="{w}" fill="none"/>'
for i in[1352,1360,340]:
 if i==1352:
  w,h=1100,500;b='<rect x="10" y="10" width="1080" height="480" fill="none" stroke="#252440" stroke-width="5"/>'
  for x,y,t,size,anchor,weight in[(45,90,'Thành phần dinh dưỡng',57,'start','dam'),(45,155,'Trong 1 viên nhộng',42,'start','de'),(45,270,'Hàm lượng',57,'start','dam'),(45,340,'L-Lysine',42,'start','de'),(1040,340,'500 mg',42,'end','de'),(550,405,'(gồm 637 mg L-Lysine Hydrochloride)',40,'middle','de')]:b+=F.label(x,y,t,size,anchor,weight=weight)
  b+=line(45,185,1060,185,4)+line(45,445,1060,445,4)
 elif i==340:
  w,h=1050,420;b=''.join(F.label(35,85+95*k,t,46,'start')for k,t in enumerate(a[i]['text']))
 elif i==1360:
  w,h=1100,270;b=''
  for x,n,lab in[(35,1,'1s'),(285,1,'2s'),(445,3,'2p'),(955,1,'3s')]:
   b+=f'<rect x="{x}" y="35" width="{n*90}" height="100" fill="none" stroke="#252440" stroke-width="3"/>'
   for k in range(1,n):b+=line(x+k*90,35,x+k*90,135)
   for k in range(n):
    xx=x+k*90+30;b+=line(xx,117,xx,52)+line(xx,52,xx-10,67)+line(xx,52,xx+10,67)
    if lab!='3s':
     xx+=30;b+=line(xx,52,xx,117)+line(xx,117,xx-10,102)+line(xx,117,xx+10,102)
   b+=F.label(x+n*45,215,lab,42,weight='dam')
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Nội dung theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nhan-orbital-config-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',ghiChuDung='Giữnhộng/637mg/500mg;3sCHỈ1↑;Rkhông4s,Tgiữ1−,đủdấuchấmcuốidòng. Chữthường/đậmtừfontapp,khôngfauxitalic/bold.'))
(M/'cau-truc-nhan-orbital-config-ddh-lo-97-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
