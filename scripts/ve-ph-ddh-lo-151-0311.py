"""Mười bốn ô màu và chỉ ba nồng độ có thật; mọi glyph lấy từ DDH app."""
from pathlib import Path
from PIL import Image,ImageStat
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-molecule-lo-149.json').read_text())if r['i']==1339);im=Image.open(M.parent/'nguon'/r['fileNguon']).convert('RGB');b='<g transform="translate(20 20) scale(2)">';colors=[]
for i in range(14):
 x=145+i*67;cx=x+28.5;rgb=tuple(int(v)for v in ImageStat.Stat(im.crop((int(cx)-3,112,int(cx)+4,119))).median);color='#'+''.join(f'{v:02x}'for v in rgb);colors.append(color)
 b+=f'<rect x="{x}" y="90" width="57" height="55" fill="{color}" stroke="#777" stroke-width=".6"/><path d="M{cx} 78V90M{cx} 145V158" stroke="#252440" stroke-width="1.6"/>'+F.label(cx,189,str(i+1),27)
for cx,expo in[(173.5,'−1'),(575.5,'−7'),(1044.5,'−14')]:
 w=F.advance('10',27)+F.advance(expo,18);x=cx-w/2;b+=F.label(x,66,'10',27,'start')+F.label(x+F.advance('10',27),54,expo,18,'start')
b+=F.label(82,60,'[H⁺]',26)+F.label(82,97,'(mol/L)',26)+F.label(82,191,'pH',27)+'</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="2320" height="510" viewBox="0 0 2320 510"><title>Thang màu pH với ba nồng độ theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ph-14-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',mauDoTuNguon=colors,ghiChuDung='14ô1..14/28tickmarks/CHỈ3[H+]nồngđộ10^-1,-7,-14tại1/7/14;không0/15/acid-basecaption. ExponentdùngglyphDDHminus-Latindigitnhỏnângbaseline,pathkhôngfallback.')
(M/'cau-truc-ph-ddh-lo-151-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
