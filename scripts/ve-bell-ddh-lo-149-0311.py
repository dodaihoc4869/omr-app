"""Giữ đỉnh và dóng lệch nhau trong nguồn, không sửa thành mô hình enzyme lý thuyết."""
from pathlib import Path
import importlib.util,json,hashlib
from scipy.interpolate import PchipInterpolator
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-molecule-lo-149.json').read_text())if r['i']==1291)
pts=[(71,317),(115,274),(154,228),(197,172),(235,121),(270,87),(295,75),(308,73),(350,82),(389,109),(422,155),(445,208),(465,278),(479,345)];xs=[p[0]for p in pts];ys=[p[1]for p in pts];pp=PchipInterpolator(xs,ys);d=f'M{xs[0]} {ys[0]}'
for i in range(len(xs)-1):
 x,xx=xs[i:i+2];y,yy=ys[i:i+2];h=xx-x;c=pp.c[:,i];d+=f'C{x+h/3:.3f} {y+c[2]*h/3:.3f} {xx-h/3:.3f} {yy-(3*c[0]*h*h+2*c[1]*h+c[2])*h/3:.3f} {xx} {yy}'
b='<g transform="translate(25 25) scale(2)"><path d="M40 355V54M40 355H529" fill="none" stroke="#252440" stroke-width="1.8"/><path d="M40 54L36 65L40 62L44 65Z M529 355L517 351L520 355L517 359Z" fill="#252440"/>'
b+='<path d="M295 355V74" fill="none" stroke="#252440" stroke-width="1.8" stroke-dasharray="13 12"/>'+f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.8"/>'
for x,t in[(68,'10'),(150,'20'),(230,'30'),(311,'40'),(392,'50'),(474,'60')]:b+=f'<path d="M{x} 355V364" stroke="#252440" stroke-width="1.8"/>'+F.label(x,389,t,24)
b+=F.label(49,55,'r',22)+F.label(529,385,'T(°C)',22)+'</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="920" viewBox="0 0 1240 920"><title>Đồ thị r theo nhiệt độ như nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bell-r-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',curvePixelAnchors=pts,ghiChuDung='Dóngnative295lên74/đỉnh30873KHÔNGtrùng;6Xticks/no0-Yticks-caption/curvebắtđầu71317kết479345/2axisarrows. Khôngsửadóngtheotick40/khôngtựgánamylase.')
(M/'cau-truc-bell-ddh-lo-149-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
