"""Đũa thủy tinh và hai cốc nguồn947, giữ chữ/vạch theo ảnh."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ab6c0db08f290786d2b2306110ef59cd3140de6706bda0f930911abeab52b697';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,c='#777',w=.7):return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
b='<path d="M56 124L145 4Q148 1 150 5L149 8L61 127Q57 130 56 127Z" fill="#c7c7c7" stroke="#252440" stroke-width=".7" stroke-linejoin="round"/>'
b+=line('M93 70H102 M85 82H97')
for x,y in [(201,77),(337,116)]:
 b+=f'<path d="M{x+1} {y}H{x+60}V117Q{x+60} 123 {x+52} 124H{x+10}Q{x+2} 123 {x+1} 116Z" fill="#ededed"/>'
 b+=line(f'M{x} 32V117Q{x+1} 125 {x+10} 125H{x+53}Q{x+61} 124 {x+61} 117V35Q{x+61} 32 {x+65} 32',w=.9)
 r=x+22;b+=line(f'M{r} 45V116',c='#929292',w=.6)
 for yy in [45,53,61,69,77,85,93,100,108,116]:b+=line(f'M{r} {yy}h{18 if yy in [45,85] else 10}',c='#929292',w=.6)
 for yy in [69,82]:b+=line(f'M{x-1} {yy}h3',w=.55)
 if x==201:
  for yy in [69,82]:b+=line(f'M260 {yy}h3',c='#aaa',w=.55)
# Fragmented source ink beside the two marked rows, not extra labelled graduations.
b+=line('M234 69H236 M237 77h1 M370 69h3 M374 70h1',c='#888',w=.55)
for x,t in [(64,'Đũa thủy tinh'),(233,'60ml H₂O'),(381,'10ml dd H₂SO₄ 98%')]:b+=F.label(x,146,t,14,fill='#000000',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="455" height="163" viewBox="0 0 455 163"><title>Đũa và hai cốc theo nguồn947</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dua-hai-coc-native947-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=947,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1rod2beakers/10ticksEACH-long45-85/liquid77-116/2rodtransversemarks-intentUNKNOWN/3trueDAMliteralcaptions-Đũa thủy tinh-60ml H2O-10ml dd H2SO4 98%/mlLOWER-2-4SUB/noaddedheads-drops-mL-normalize-answer/noalias74')
(K/'cau-truc-dua-hai-coc-native947-ddh-lo-338-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
