"""Nguồn388: Fischer glucose sang sorbitol, giữ tác nhân A chưa xác định."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='453d5e8e46f850e8c9ce6a21d0a0f0ac9d00af4bbd80c10588ac626d60187d82';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=28):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=28):return F.label(x+F.advance(t[-1],z)/2,y,t,z,'end')
b=line('M539 90V364L574 383M539 90L574 70M546 95L581 76')+F.label(588,74,'O',28)+first(588,402,'OH')
b+=line('M933 91V365L968 384M933 91L968 71')+first(982,75,'OH')+first(982,403,'OH')
for x,ys in [(539,[145,199,254,309]),(933,[146,200,255,310])]:
 for i,y in enumerate(ys):
  if i==1:
   b+=line(f'M{x-42} {y}H{x+42}')+last(x-55,y+11,'HO')+F.label(x+55,y+11,'H',28)
  else:
   b+=line(f'M{x-42} {y}H{x+42}')+F.label(x-55,y+11,'H',28)+first(x+55,y+11,'OH')
b+=line('M668 234H811',1.4)+'<path d="M801 228L823 234L801 240L807 234Z" fill="#252440"/>'+F.label(740,222,'A',34)
# Nghiêng đường bao DDH để giữ kiểu chú thích của nguồn, không dùng phông khác.
for x,t in [(563,'Glucose'),(982,'Sorbitol')]:b+=f'<g transform="translate({math.tan(math.radians(10))*448:.5f} 0) skewX(-10)">'+F.label(x,448,t,30)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1085" height="501" viewBox="0 0 1085 501"><title>Sơ đồ chuyển glucose thành sorbitol theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-sorbitol-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=388,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2Fischer12implicitC/8standaloneH/11OH+1aldehydeOdouble/2RLRR/bareterminalC-OH/RIGHTarrowA/Glucose-SorbitolDDHpathsnghiêng/noaddedaldehydeH-condition-answer/DDHpath.')
(K/'cau-truc-glucose-sorbitol-ddh-lo-229-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
