"""Repeatunit literal, giữ ngoặc/nhánh/n/đầu liên kết; không thay bằng phân tử hữu hạn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F);src=json.loads((M/'doc-polymer-cau-truc-5.json').read_text());rows=[]
def line(x,y,xx,yy):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round"/>'
for old in src:
 if old['i']not in[334,842,896]:continue
 labels=old['backbone'];xs=[180+220*k for k in range(len(labels))];b='';bounds=[]
 for x,label in zip(xs,labels):
  left=x-F.advance(label[0],40)/2;right=left+F.advance(label,40);bounds.append((left,right));b+=F.label(left,165,label,40,'start')
 b+=line(60,150,bounds[0][0]-12,150)+line(bounds[-1][1]+12,150,xs[-1]+120,150)
 for k in range(len(xs)-1):
  if old['i']==896 and k==1:
   b+=line(bounds[k][1]+12,144,bounds[k+1][0]-12,144)+line(bounds[k][1]+12,156,bounds[k+1][0]-12,156)
  else:b+=line(bounds[k][1]+12,150,bounds[k+1][0]-12,150)
 for branch in old['branches']:
  x=xs[branch['site']-1];label=branch['label']
  if branch.get('bond')=='double':b+=line(x-5,185,x-5,230)+line(x+5,185,x+5,230)
  else:b+=line(x,185,x,230)
  b+=F.label(x-F.advance(label[0],40)/2,270,label,40,'start')
 top,bottom=(95,295)if old['i']in[334,842]else(110,190);right=xs[-1]+70;h=bottom-top
 b+=f'<path d="M125 {top}C105 {top+h*.25:g} 105 {bottom-h*.25:g} 125 {bottom}M{right-15:g} {top}C{right+5:g} {top+h*.25:g} {right+5:g} {bottom-h*.25:g} {right-15:g} {bottom}" fill="none" stroke="#252440" stroke-width="2.5"/>'
 b+=F.label(right+22,bottom+15,'n',30,'start');width=xs[-1]+180;height=350
 svg=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}"><title>Đơn vị lặp theo hình nguồn</title>'+b+'</svg>').encode();digest=hashlib.sha256(svg).hexdigest();fn='polymer-ddh-'+digest+'.svg';(M/fn).write_bytes(svg);r=dict(old);r.update(svg=fn,hashSvg=digest,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap');rows.append(r)
(M/'cau-truc-polymer-ddh-lo-42-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng',len(rows),'nguồn, chờsoát.')
