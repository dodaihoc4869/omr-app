"""Đổi chữ SVG sang nét DDH Rounded; bản mới phải soát lại, không ghi đè ảnh cũ."""
from pathlib import Path
import importlib.util,json,hashlib,sys,xml.etree.ElementTree as E
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311/kiem';spec=importlib.util.spec_from_file_location('ddh',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(spec);spec.loader.exec_module(F);NS='http://www.w3.org/2000/svg';E.register_namespace('',NS)
def convert(node,inherit=None):
 attrs=dict(inherit or {});attrs.update(node.attrib)
 for child in list(node):
  if child.tag.rsplit('}',1)[-1]=='text':
   if list(child):raise ValueError('Có tspan cần dựng chỉ số riêng')
   a=dict(attrs);a.update(child.attrib);s=child.text or '';size=float(a.get('font-size','24'));x=float(a.get('x','0'));y=float(a.get('y','0'));anchor=a.get('text-anchor','start');fill=a.get('fill','#252440');extra='transform="'+a['transform']+'"'if 'transform'in child.attrib else''
   new=E.fromstring(F.label(x,y,s,size,anchor,fill,extra));new.tail=child.tail;idx=list(node).index(child);node.remove(child);node.insert(idx,new)
  else:convert(child,attrs)
rows=[]
inputName=sys.argv[1]if len(sys.argv)>1 else'hoa-ve-thu-cong.json'
outName=sys.argv[2]if len(sys.argv)>2 else'cau-truc-chu-ddh-lo-13-ban-dung.json'
for old in json.loads((P/inputName).read_text()):
 r=dict(old);src=P/r['svg'];root=E.fromstring(src.read_bytes());convert(root);b=E.tostring(root,encoding='utf-8');h=hashlib.sha256(b).hexdigest();fn='hoa-ddh-'+h+'.svg';(P/fn).write_bytes(b);r.update(svgCu=r['svg'],svg=fn,hashSvg=h,byteSvg=len(b),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap');r.pop('hashSvgDaSoat',None);r.pop('nguoiSoat',None);rows.append(r)
(P/outName).write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng lại chữ',len(rows),'hình, cần soát lại bố cục.')
