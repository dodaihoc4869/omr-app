"""Bảy hộp và nhánh hợp: giữ biến, trạng thái và điều kiện nguồn, không giải chất."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-molecule-lo-139.json').read_text())if r['i']==1248);b=''
boxes=[(25,25,0),(25,200,1),(25,375,2),(25,550,3),(585,375,4),(585,550,5),(305,765,6)]
for x,y,idx in boxes:b+=f'<rect x="{x}" y="{y}" width="470" height="90" fill="#fff" stroke="#252440" stroke-width="3"/>'+F.label(x+235,y+60,r['nodes'][idx],35)
def arrow(x,y,yy):return f'<path d="M{x} {y}V{yy}" fill="none" stroke="#252440" stroke-width="3"/><path d="M{x} {yy}L{x-10} {yy-21}L{x} {yy-15}L{x+10} {yy-21}Z" fill="#252440"/>'
for y in[115,290,465]:b+=arrow(260,y,y+85)
b+=arrow(820,465,550)
for x,y,t in[(278,175,'t°, V₂O₅(s)'),(278,350,'+ H₂SO₄(l)'),(278,525,'+ H₂O(l)')]:b+=F.label(x,y,t,34,'start')
b+='<path d="M260 640V700H820V640M540 700V765" fill="none" stroke="#252440" stroke-width="3" stroke-linejoin="round"/><path d="M540 765L530 744L540 750L550 744Z" fill="#252440"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="885" viewBox="0 0 1080 885"><title>Sơ đồ bảy hợp chất và phân bón theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='phan-bon-flow-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='7hộp/5arrow/nhánhhợpvuônggóc;biếnA/Q/X/Y/Z,tagg/s/l,3điềukiệnnhánhtrái;N2H2→YKHÔNGcond;khônggiảichất/charges.')
(M/'cau-truc-phan-bon-ddh-lo-141-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
