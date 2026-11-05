"""Nguồn58: chuỗi chuyển hóa literal, giữ công thức và bốn nhãn mũi tên."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='0b7e56b1275a64889d7aa748bea128079bd3fbc584df4ca3518161fb05f4a92f';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def formula(x,runs):
 b=''
 for txt,sub in runs:
  z=18 if sub else 30;b+=F.label(x,69 if sub else 61,txt,z,'start');x+=F.advance(txt,z)
 return b,x
forms=[ [('CO',0),('2',1)], [('(C',0),('6',1),('H',0),('10',1),('O',0),('5',1),(')',0),('n',1)], [('C',0),('12',1),('H',0),('22',1),('O',0),('11',1)], [('C',0),('6',1),('H',0),('12',1),('O',0),('6',1)], [('C',0),('2',1),('H',0),('5',1),('OH',0)] ]
b='';starts=[26,175,454,728,945];ends=[]
for x,runs in zip(starts,forms):
 c,e=formula(x,runs);b+=c;ends.append(e)
for j in range(4):
 x=ends[j]+20;y=starts[j+1]-18;b+=f'<path d="M{x} 52H{y}M{y-8} 46L{y} 52L{y-8} 58" fill="none" stroke="#252440" stroke-width="1.8"/>'+F.label((x+y)/2,38,f'({j+1})',18)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="104" viewBox="0 0 1120 104"><title>Chuỗi chuyển hóa theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='chuyen-hoa-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=58,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='CO2→(C6H10O5)n→C12H22O11→C6H12O6→C2H5OH/4arrows/labels(1)..(4)/DDHpath.');(K/'cau-truc-chuyen-hoa-ddh-lo-199-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
