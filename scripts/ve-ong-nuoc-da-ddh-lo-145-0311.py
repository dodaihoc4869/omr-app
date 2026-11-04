"""Hai ống nối van K, chỉ ống nhạt ngâm nước đá; không thêm công thức hay nhiệt độ."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a=json.loads((M/'doc-chi-tiet-con-lai-lo-144.json').read_text());rows=[]
# Các đường vỡ góc là ký hoạ nước đá, không đại diện số hạt/thể tích.
b='<defs><clipPath id="ice"><path d="M67 130V200Q67 215 81 215H201Q215 215 215 200V130Z"/></clipPath></defs><g transform="translate(35 25) scale(3)"><g clip-path="url(#ice)"><rect x="66" y="129" width="150" height="87" fill="#f5ffff"/>'
for row in range(10):
 for col in range(10):
  x=63+col*17+(row%2)*7;y=128+row*9;j=(row*3+col*5)%4
  points=[(x,y+2),(x+5,y-1-j*.3),(x+13,y+1),(x+15,y+5),(x+11,y+8),(x+4,y+7),(x-1,y+5)]
  b+='<polygon points="'+' '.join(f'{xx},{yy}'for xx,yy in points)+'" fill="#fff" stroke="#3b94a9" stroke-width=".8"/>'
b+='</g><path d="M66 107V201Q66 216 81 216H201Q216 216 216 201V107" fill="none" stroke="#252440" stroke-width="1.2"/><path d="M67 131Q76 125 87 130T110 130T135 130T161 130T186 130T215 130" fill="none" stroke="#3b94a9" stroke-width="1"/>'
b+='<path d="M125 31V194Q125 214 144 214Q163 214 163 194V31Z" fill="#bd9638" stroke="#252440" stroke-width="1.3"/><path d="M256 31V194Q256 214 275 214Q294 214 294 194V31Z" fill="#a8582b" stroke="#252440" stroke-width="1.3"/>'
b+='<path d="M163 62H256V73H163" fill="#bd823a" stroke="#252440" stroke-width="1.2"/><rect x="188" y="60" width="45" height="15" rx="6" fill="#0863a5"/><path d="M209 53V82M202 53H216" stroke="#161614" stroke-width="4" fill="none"/>'
for x in[121,252]:b+=f'<path d="M{x} 16H{x+46}L{x+42} 34H{x+4}Z M{x+3} 10H{x+43}V18H{x+3}Z" fill="#161614"/>'
for x,y,t,n in[(111,75,'(a)',14),(310,75,'(b)',14),(210,44,'K',15),(32,145,'Nước đá',15)]:b+=F.label(x,y,t,n)
b+='<path d="M43 151L91 174" fill="none" stroke="#252440" stroke-width=".8"/></g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="735" viewBox="0 0 1080 735"><title>Hai ống khí nối van K và nước đá theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ong-nuoc-da-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
for r in a:
 if r['i']in[678,1356]:rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='2tubeđáytròn/capsđen/1vanKblue+handleđen/left(a)nhạtngâmicebath/right(b)đậmngoài/labelNướcđá+leader;khífillđầybodyKHÔNGmặtchấtlỏngtrongtube/côngthức/t°/arrowthêm. Đườngmảnhnướcđákýhoạkhôngsốhạt.'))
(M/'cau-truc-ong-nuoc-da-ddh-lo-145-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
