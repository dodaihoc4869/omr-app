"""Giữ HO–C=O khai triển bên trái và từng nối đôi của mạch nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
j=json.loads((M/'doc-molecule-lo-130.json').read_text());rows=[]
def path(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
for r in j:
 if r['i'] not in[837,378,700]:continue
 down=r['i']==837;n=22 if down else 18;doubles=[4,7,10,13,16,19] if down else[9,12,15];points=[(60,120 if down else 80)]
 for atom in range(2,n+1):
  x,y=points[-1];points.append((x+(48 if atom-1 in doubles else 24),y if atom-1 in doubles else 200-y))
 b=''
 for bond in range(1,n):
  x,y=points[bond-1];xx,yy=points[bond];b+=path(f'M{x} {y}L{xx} {yy}')
  if bond in doubles:b+=path(f'M{x+6} {y+7}H{xx-6}')
 if down:b+=path('M56 122V155M64 122V155M60 120L32 93')+F.label(60,181,'O',25)+F.label(7,96,'HO',25,'start')
 else:b+=path('M56 78V47M64 78V47M60 80L32 104')+F.label(60,40,'O',25)+F.label(7,121,'HO',25,'start')
 w=points[-1][0]+22;raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="205" viewBox="0 0 {w} 205"><title>Acid béo với carboxyl khai triển</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='acid-kha-trien-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',diemCarbon=points,bondDoiTuCOOH=doubles,ghiChuDung='HOexplicittrái;837C=Oxuống22C6Z;378/700C=Olên18C3Z;khônggộpCOOH/tựthêmcaption/charge.'))
(M/'cau-truc-acid-kha-trien-ddh-lo-133-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
