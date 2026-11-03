"""Hai peptide giữ các nhóm thu gọn và từng H tường minh của nguồn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);A=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);rows=[]
def save(i,w,h,b,note):
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='hinh-ddh-'+hh+'.svg';(M/fn).write_bytes(svg);a=A[i];rows.append(dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChu=note))
def line(x,y,xx,yy):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round"/>'
def atom(x,y,label,last=False):return F.label(x+F.advance(label[-1],36)/2,y,label,36,'end')if last else F.label(x-F.advance(label[0],36)/2,y,label,36,'start')
def backbone(xs,labels):
 b='';bounds=[]
 for k,(x,label)in enumerate(zip(xs,labels)):
  if k==0:right=x+F.advance('N',36)/2;left=right-F.advance(label,36)
  else:left=x-F.advance(label[0],36)/2;right=left+F.advance(label,36)
  b+=F.label(left,263,label,36,'start');bounds.append((left,right))
 for j in range(len(xs)-1):b+=line(round(bounds[j][1]+12,3),250,round(bounds[j+1][0]-12,3),250)
 return b
b=backbone([150,270,390,510,630,750,870,990,1140],['H₂N','CH','C','N','CH','C','N','CH','COOH'])
for x in[390,750]:b+=line(x-5,273,x-5,334)+line(x+5,273,x+5,334)+atom(x,375,'O')
for x in[510,870]:b+=line(x,273,x,334)+atom(x,375,'H')
b+=line(270,227,270,145)+atom(270,130,'CH₃')+line(630,227,630,145)+F.label(630-F.advance('[',36)-F.advance('C',36)/2,130,'[CH₂]₂COOH',36,'start')
b+=line(990,273,990,334)+atom(990,375,'CH')+line(1045,361,1115,361)+atom(1140,375,'CH₃')+line(990,385,990,444)+atom(990,485,'CH₃')
save(1348,1320,535,b,'Ala–Glu–Val literal:CH3up/[CH2]2COOHup/ValCH(CH3)2down;2amideC=Odown/2N–Hdown,NH2đầu/COOHcuốicondensed,khôngstereo/tênchất.')
b=backbone([150,270,390,510,630,750,870,990,1110,1250],['H₂N','C','C','N','C','C','N','C','C','OH'])
for x in[390,750,1110]:b+=line(x-5,273,x-5,334)+line(x+5,273,x+5,334)+atom(x,375,'O')
for x in[270,630,990]:b+=line(x,273,x,334)+atom(x,375,'H')
for x in[510,630,870]:b+=line(x,227,x,145)+atom(x,130,'H')
b+=line(990,227,990,145)+atom(990,130,'CH₃')+line(270,227,270,160)+atom(270,143,'C')+line(270,106,270,57)+atom(270,42,'H')+line(251,120,174,79)+atom(150,80,'H₃C',True)+line(289,120,366,79)+atom(390,80,'CH₃')
save(1377,1400,430,b,'Val–Gly–Ala giữC/Htườngminhở3Calpha,gly2H/ValCnhánh+H/2N–H;3carbonylC=Odown,NH2đầu/OHcuối,khôngnêm/tênchất.')
(M/'cau-truc-peptide-h-ddh-lo-56-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
