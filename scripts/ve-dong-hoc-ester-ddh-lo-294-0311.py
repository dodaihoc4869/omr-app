"""Nguồn1212: mười dấu cộng dữ liệu rời trên lưới, không suy thêm đường nối."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='dc1a5081a2df564f827b31c01940bd348fb3c7802e4c0235f6e66e25b49f259b';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
for j in range(31):
 x=47+19.2*j;b+=f'<path d="M{x:g} 33V362" stroke="'+('#888888'if j%5==0 else '#b5b5b5')+'" stroke-width="'+('1.2'if j%5==0 else '1')+'" fill="none"/>'
for j in range(36):
 y=362-9.4*j;b+=f'<path d="M47 {y:g}H623" stroke="'+('#888888'if j%5==0 and j!=5 else '#b5b5b5')+'" stroke-width="'+('1.2'if j%5==0 else '1')+'" fill="none"/>'
b+='<path d="M47 315H623" stroke="#888888" stroke-width="1.3" stroke-dasharray="13 21" fill="none"/>'
b+='<path d="M47 36V362H657 M41 46L47 33L53 46 M646 356L658 362L646 368" fill="none" stroke="#777777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
for j in range(31):
 x=47+19.2*j;b+=f'<path d="M{x:g} 362V366" stroke="#777777" stroke-width="1.6"/>'
 if j%5==0:b+=F.label(x,390,str(j*4),18,fill='#777777')
for j in range(36):
 y=362-9.4*j;b+=f'<path d="M43 {y:g}H49" stroke="#777777" stroke-width="1.6"/>'
 if j%5==0:b+=F.label(32,y+6,str(j),18,anchor='end',fill='#777777')
pts=[(71,231),(95,184),(119,165),(167,137),(215,118),(263,95),(326,85),(398,76),(455,76),(527,76)]
for x,y in pts:b+=f'<path d="M{x-4} {y}H{x+4} M{x} {y-4}V{y+4}" fill="none" stroke="#777777" stroke-width="2.4"/>'
def italic(x,y,t,z):return '<g transform="translate('+str(x)+' '+str(y)+') skewX(-10)">'+F.label(0,0,t,z,anchor='start',fill='#777777')+'</g>'
b+=italic(43,22,'n',18)+F.label(54,24,'ester',10,anchor='start',fill='#777777')
b+=F.label(84,22,'(×10',17,anchor='start',fill='#777777')+F.label(125,14,'−4',11,anchor='start',fill='#777777')+F.label(144,22,'mol)',17,anchor='start',fill='#777777')
b+=italic(670,368,'t',20)+F.label(682,368,'(phút)',20,anchor='start',fill='#777777')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="749" height="399" viewBox="0 0 749 399"><title>Đồ thị số mol ester theo thời gian theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dong-hoc-ester-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1212,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='10separatedplusdatamarkers/31V36Hgrid-y5dashedOVERlightgrid/7Xlabels0..120step20/8Ylabels0..35step5/minorticks/2openVaxisheads/nitalic-subester(×10supminus4mol)/titalic(phút)/grayDDH/noaddedcurve-lines-title-equilibrium-exactcoordinates-answer.')
(K/'cau-truc-dong-hoc-ester-ddh-lo-294-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
