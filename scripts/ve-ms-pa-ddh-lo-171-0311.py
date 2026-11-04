"""Hai phương án phổ Cu nguồn535/692: giữ literal pixel, không sửa theo lý thuyết."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a=json.loads(Path('/workspace/scratch/doc-molecule-lo-169.json').read_text());out=[]
def line(d,w=1.4):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}"/>'
for i in [535,692]:
 r=dict(next(r for r in a if r['i']==i));r.pop('chiLaDuLieuDungChuaSoatRender',None)
 if i==535:ox,oy,ex,ty=114,255,363,50;xs=[164,214,263,313,363];ys=[255,204,152,102,50];peaks=[(273,70),(281,186)]
 else:ox,oy,ex,ty=112,248,357,44;xs=[161,210,259,308,357];ys=[248,197,146,95,44];peaks=[(269,177),(277,58)]
 b='<g transform="translate(15 15)">'+line(f'M{ox} {ty}V{oy}H{ex}')
 for x,t in zip(xs,[20,40,60,80,100]):b+=line(f'M{x} {oy}v7',1.2)+F.label(x,oy+29,str(t),17)
 for y,t in zip(ys,[0,20,40,60,80]):b+=line(f'M{ox} {y}h-8',1.2)+F.label(ox-17,y+6,str(t),17,'end')
 for x,y in peaks:b+=line(f'M{x} {oy}V{y}',1.8)
 b+=F.label((ox+ex)/2,oy+54,'m/z',19)+'<g transform="translate(47 167) rotate(-90)">'+F.label(0,0,'Phần trăm số nguyên tử đồng vị (%)',15)+'</g></g>'
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="455" height="370" viewBox="0 0 455 370"><title>Phương án phổ khối lượng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms-pa-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
 r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='2peakspixelnguồn/ticksX20..100/Y0..80/2axislabels;NOmass63/65/percentlabels/khôngsửaphươngánsaithànhđúng,khôngnormalizetheory.')
 out.append(r)
(M/'cau-truc-ms-pa-ddh-lo-171-ban-dung.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
