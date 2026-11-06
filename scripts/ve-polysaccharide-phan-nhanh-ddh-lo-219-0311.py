"""Nguồn225: sáu Haworth phân nhánh, giữ nhãn và ngoặc lặp theo nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='26aeade244c7dd9029e4b3d97d4365c9295cb7e312556ccfedd88edaa4cee2e4';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.9):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=24):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def ring(x,y,c6='CH₂OH',left=False,right=False):
 b=f'<g transform="translate({x} {y})">'+line('M-46 48L0 0H52M76 12L111 48')+F.label(64,10,'O',24)
 b+=line('M-46 48L0 94M64 94L111 48',2.3)+line('M0 94H64',4)
 b+=line('M0 0V-27M0 0V22M-46 48V11M111 48V11M0 94V71M0 94V123M64 94V69M64 94V122')
 b+=first(0,-32,c6)+F.label(0,43,'H',22)+F.label(-46,6,'H',22)+F.label(111,6,'H',22)+first(0,66,'OH')+F.label(0,146,'H',22)+F.label(64,63,'H',22)+first(64,147,'OH')
 if left:b+=line('M-46 48V76')+first(-46,98,'OH')
 if right:b+=line('M111 48V76')+first(111,98,'OH')
 return b+'</g>'
b=ring(108,93,left=True)+ring(371,92)+ring(637,93)+ring(533,341,left=True)+ring(795,339,c6='CH₂')+ring(1063,340,right=True)
b+=line('M219 141L257 171M284 171L325 140M482 140L520 169M547 173L591 141M748 141L784 170M644 389L681 419M708 419L749 387M906 387L944 418M971 419L1017 388')
for x,y in [(271,186),(534,186),(797,186),(694,436),(958,435)]:b+=F.label(x,y,'O',24)
b+=line('M797 192V283')
b+=line('M310 35H300V243H310M553 38H563V246H553M734 282H723V491H733M975 285H986V495H976',1.7)
b+=F.label(575,255,'m',13)+F.label(997,503,'n',13)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1235" height="534" viewBox="0 0 1235 534"><title>Polysaccharide phân nhánh theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polysaccharide-phan-nhanh-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=225,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='6rings/30H/15OH/5CH2OH+1CH2branch/5externalO/6horizontalbold/frontdiagsuniform-notwedges/2bracketpairs-m-n/noaddedX-caption/DDHpath.')
(K/'cau-truc-polysaccharide-phan-nhanh-ddh-lo-219-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
