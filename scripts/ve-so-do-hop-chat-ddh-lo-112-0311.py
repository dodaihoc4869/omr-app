"""Sơ đồ bảy hộp giữ các biến nguyên văn, không giải chất theo câu dẫn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-molecule-lo-106.json').read_text())if r['i']==1246)
b='<rect width="805" height="805" fill="#d6fbd6"/>'
for x,y,t in[(44,21,'NH₃(g) + O₂(g)'),(46,185,'X(g)'),(47,347,'Hợp chất T'),(51,507,'Acid (Y)'),(458,347,'N₂(g) + H₂(g)'),(462,507,'Hợp chất Q'),(261,711,'Phân bón Z')]:b+=f'<rect x="{x}" y="{y}" width="280" height="75" fill="#ffff99" stroke="#ff2b2b" stroke-width="2"/>'+F.label(x+140,y+45,t,25,weight='dam')
for x,y,yy in[(184,98,183),(185,262,345),(189,424,505),(599,424,505),(397,630,710)]:b+=f'<path d="M{x} {y}V{yy-10}" stroke="#2020ff" stroke-width="2"/><path d="M{x} {yy}L{x-6} {yy-12}H{x+6}Z" fill="#2020ff"/>'
b+='<path d="M190 582V630H611V582" fill="none" stroke="#2020ff" stroke-width="2"/>'
for x,y,t in[(156,144,'(1)'),(239,144,'t°, Pt(s)'),(157,308,'(2)'),(229,308,'O₂(g)'),(160,468,'(3)'),(301,468,'+ O₂(g) + H₂O(l)'),(570,468,'(4)'),(654,468,'xt, t°, p'),(371,676,'(5)')]:b+=F.label(x,y,t,24)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 805 805"><title>Sơ đồ chuyển hóa theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='so-do-hop-chat-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
row=dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',ghiChuDung='Giữ7box/5arrow/nhánhgấpvuông/haiđầuvàonút5/5label/4điềukiện,tấtcảX/T/Y/Q/Zlàbiếnkhônggiảitên. Giữ(g)/(s)/(l),nềnmàu.')
(M/'cau-truc-so-do-hop-chat-ddh-lo-112-ban-dung.json').write_text(json.dumps([row],ensure_ascii=False,indent=2))
