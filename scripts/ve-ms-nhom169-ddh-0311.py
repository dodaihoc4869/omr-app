"""Nhóm phổ169: bạc/Mg/haiđỉnhliteral; giữ nhãn, ticks, baseline và pixel nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
src=Path('/workspace/scratch/doc-molecule-lo-169.json');a=json.loads(src.read_text());out=[]
def line(d,w=1.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}"/>'
def label(x,y,t,size=19,anchor='middle'):return F.label(x,y,str(t),size,anchor)
def vertical(x,y,t,size=19):return f'<g transform="translate({x} {y}) rotate(-90)">'+label(0,0,t,size)+'</g>'
for i in [1203,907,998,1018]:
 r=dict(next(r for r in a if r['i']==i));r.pop('chiLaDuLieuDungChuaSoatRender',None)
 b='<g transform="translate(15 15)">'
 if i in [1203,907]:
  b+=line('M130 20V382H688')
  for j in range(11):
   y=382-j*36.2;v=47.5+j*.5;t=str(v).replace('.0','').replace('.',',');b+=line(f'M130 {y}h-10')+label(113,y+6,t,19,'end')
  for j in range(11):
   x=130+j*55.8;b+=line(f'M{x} 382v10')
   if j%2:b+=label(x,423,str(105.5+j*.5).replace('.0',''),20)
  for x,y,t in [(297.4,69.1,'51,8'),(520.6,331.3,'48,2')]:b+=line(f'M{x} 382V{y}',3.2)+label(x,y-12,t,23)
  b+=label(409,451,'m/z',22)+vertical(35,215,'Phần trăm số nguyên tử đồng vị (%)',20)
  w,h=750,490
 elif i==998:
  b+=line('M93 36V401H518')
  for x in [181,226,272,319,369,422,474]:b+=line(f'M{x} 401v14',1.2)
  for x,y,m,t in [(181,101,24,79),(272,366,25,10),(369,362,26,11)]:b+=line(f'M{x} 401V{y}',2.6)+label(x,y-12,t,23)+label(x,441,m,23)
  b+=label(311,478,'Tỉ lệ nguyên tử khối/điện tích (m/z)',21)+vertical(49,233,'Phần trăm số nguyên tử đồng vị (%)',20)
  w,h=620,530
 else:
  b+=line('M110 51V249H347',1.4)
  for x,t in [(157,20),(204,40),(251,60),(299,80),(347,100)]:b+=line(f'M{x} 249v7',1.2)+label(x,276,t,17)
  for y,t in [(249,0),(199,20),(150,40),(101,60),(51,80)]:b+=line(f'M110 {y}h-8',1.2)+label(95,y+6,t,17,'end')
  b+=line('M263 249V123M270 249V123',1.8)+label(229,304,'m/z',19)+vertical(47,157,'Phần trăm số nguyên tử đồng vị (%)',15)
  w,h=440,345
 b+='</g>'
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" viewBox="0 0 %s %s"><title>Phổ khối lượng theo dữ liệu nguồn</title>'%(w,h,w,h)+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms-nhom169-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
 r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Literalaxis/labels/peaks;Agbaseline47,5top52,5/no%trênpeak;Mg79-10-11/noytick/4emptyxticks;1018equal2peaksx263270top123KHÔNGmass63/65/percenttrênpeak/khônggiảiPA.')
 out.append(r)
(M/'cau-truc-ms-nhom169-ddh-ban-dung.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
