"""Bảng892: giữ chữ a trên dòng cơ sở, R hoa nhỏ dưới và tám số thập phân dấu phẩy."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a38a3e7f8a4cbb38355529c1346d89b232509ef9f11e6faec758c4c76b2ea156';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M0 1H1333 M0 42H1333 M0 124H1333 M0 165H1333 M0 229H1333 M223 1V229 M598 1V229 M946 1V229 M1333 1V229" fill="none" stroke="#252440" stroke-width="1.4"/>'
for x,t in [(111,'Amino acid'),(410,'pKa của α-COOH (pK₁)'),(772,'pKa của α-NH₃⁺ (pK₂)')]:b+=F.label(x,32,t,28,weight='dam')
parts=[('pKa của chuỗi bên (pK',28,0),('R',18,5),(')',28,0)]
x=1139-sum(F.advance(t,z,'dam')for t,z,_ in parts)/2
for t,z,dy in parts:b+=F.label(x,32+dy,t,z,'start',weight='dam');x+=F.advance(t,z,'dam')
for y,t in [(74,'Glutamic'),(115,'acid'),(155,'Glycine'),(197,'Lysine')]:b+=F.label(111,y,t,30,weight='dam')
for y,values in [(74,['2,19','9,67']),(155,['2,35','9,78']),(197,['2,18','8,95'])]:
 for x,t in zip([410,772],values):b+=F.label(x,y,t,30)
b+=F.label(1139,155,'—',30)
def mixed(y,parts):
 x=1139-sum(F.advance(t,30)for t,_,_ in parts)/2;out=''
 for t,dy,italic in parts:
  yy=y+dy;part=F.label(x,yy,t,30,'start')
  if italic:part=f'<g transform="translate({math.tan(math.radians(10))*yy:.5f} 0) skewX(-10)">'+part+'</g>'
  out+=part;x+=F.advance(t,30)
 return out
b+=mixed(83,[('4,25 (',0,False),('nhóm',0,True),(' - COOH ',-7,False),(')',0,False)])
b+=mixed(219,[('10,53 (',0,False),('nhóm',0,True),(' - NH₃⁺',-17,False),(')',0,False)])
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1340" height="232" viewBox="0 0 1340 232"><title>Bảng pKa amino acid theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bang-pka-amino-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=892,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4columns4rows/4headers3AAnamesactualdam/8commadecimal1emdash/2nhómitalic/2alpha/NH3sub-plusSup/headerpKaBASELINEa/pKsub1-2-UPPERR/noleftverticalrestoration/noaddedpI-unit-title-answer.')
(K/'cau-truc-bang-pka-amino-ddh-lo-278-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
