"""Vòng năm cạnh nguồn855: giữ literal và khe trắng tại nhánh OH."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9c1fb7249a11d76b198b08585e24dedf695b923ddc933050f34865108e3308b3';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
def line(d,w=2):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="'+('butt'if w==6 else'round')+'" stroke-linejoin="round"/>'
def label(x,y,t,size=31,anchor='middle'):
 global b
 b+=F.label(x,y,t,size,anchor=anchor)
def oh(x,y):label(x-F.advance('O',31)/2,y,'OH',anchor='start')
def ch2oh(x,y):
 for t,sz,dy in [('CH',31,0),('2',21.7,6),('OH',31,0)]:
  label(x,y+dy,t,sz,anchor='start');x+=F.advance(t,sz)
def taper(tip,foot):
 global b
 x,y=foot;b+=f'<path d="M{tip[0]} {tip[1]}L{x} {y-3}V{y+3}Z" fill="#252440"/>'
# Khe trắng hai phía nhánh OH phía trên có trong native, không nối xuyên.
line('M53 104L143 75 M173 75L218 90 M228 93L263 104 M53 59V148 M93 143V190 M224 143V75 M263 104V157')
line('M93 143H224',6)
taper((53,104),(93,143));taper((263,104),(224,143))
label(158,83,'O')
for x,y in [(53,175),(93,217),(224,72)]:oh(x,y)
# Liên kết CH2OH chạm C đầu tiên, không neo vào giữa cả chuỗi.
ch2oh(53-F.advance('C',31)/2,54);ch2oh(263-F.advance('C',31)/2,183)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="382" height="248" viewBox="0 0 382 248"><title>Vòng năm cạnh theo nguồn855</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='vong-nam-native855-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=855,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1five-ring4bareC+2CH2OH-C=6C/6O/3freeOH/2TAPER1boldfront6px-verticalfeet/CH2OHleftUP-rightDOWN-firstCanchors/upperOHUP-backbondWHITEGAPS/0standaloneH/regularupright/noaddedname-answer-nums-caption')
(K/'cau-truc-vong-nam-native855-ddh-lo-331-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
