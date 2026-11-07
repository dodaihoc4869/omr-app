"""Nguồn413: thang14ô,28vạch và ba nồng độ in sẵn; không thêm mốc trung gian."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='493c6487030d4f14419ffa767db9564125219d3e8d52834c571020682393443f'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
# Các màu lấy trực tiếp trong phần tô của từng ô nguồn; vân in không là vạch/số liệu.
xs=[106,166,226,286,346,406,467,527,587,647,707,767,827,887]
colors=['#b74f75','#ff6378','#ff9965','#ffc766','#ffd565','#fff865','#d6cc68','#a4b77d','#829978','#6f8d7e','#698785','#52839e','#534f9a','#584c94']
edges=['#62425d','#c85165','#ffb389','#eed089','#ead46d','#eded70','#bfc16b','#7c8a62','#687a65','#596960','#4f6f76','#4d637d','#35314c','#302940']
defs='<defs>'
defs+='<linearGradient id="c2"><stop stop-color="#ff6378"/><stop offset="83%" stop-color="#ff6378"/><stop offset="84%" stop-color="#ff7587"/><stop offset="100%" stop-color="#ff7587"/></linearGradient>'
defs+='<linearGradient id="c3" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#ffa26e"/><stop offset="100%" stop-color="#ff9965"/></linearGradient>'
defs+='<linearGradient id="c4"><stop stop-color="#ffc766"/><stop offset="85%" stop-color="#ffc766"/><stop offset="100%" stop-color="#ffd16e"/></linearGradient>'
defs+='<linearGradient id="c5"><stop stop-color="#ffce62"/><stop offset="100%" stop-color="#ffd565"/></linearGradient>'
defs+='<linearGradient id="c7"><stop stop-color="#fbf272"/><stop offset="40%" stop-color="#fbf272"/><stop offset="41%" stop-color="#d6cc68"/><stop offset="100%" stop-color="#d6cc68"/></linearGradient>'
defs+='<linearGradient id="c8" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a4b77d"/><stop offset="45%" stop-color="#a4b77d"/><stop offset="46%" stop-color="#bace93"/><stop offset="74%" stop-color="#bace93"/><stop offset="75%" stop-color="#a4b77d"/><stop offset="100%" stop-color="#a4b77d"/></linearGradient>'
defs+='<linearGradient id="c11"><stop stop-color="#698785"/><stop offset="37%" stop-color="#698785"/><stop offset="40%" stop-color="#7b9592"/><stop offset="68%" stop-color="#7b9592"/><stop offset="72%" stop-color="#698785"/><stop offset="100%" stop-color="#588091"/></linearGradient></defs>'
b=defs
for n,(x,color,edge) in enumerate(zip(xs,colors,edges),1):
 fill=f'url(#c{n})' if n in [2,3,4,5,7,8,11] else color
 b+=f'<rect x="{x}" y="56" width="51" height="48" fill="{fill}" stroke="{edge}" stroke-width="0.8"/>'
 center=x+25.5
 b+=f'<path d="M{center} 45V56M{center} 104V117" fill="none" stroke="#202020" stroke-width="1.3"/>'
 b+=F.label(center,145,str(n),22,fill='#111111')
def power(cx,exponent):
 base=22;sup=14;w=F.advance('10',base)+F.advance(exponent,sup);left=cx-w/2
 return F.label(left,35,'10',base,'start',fill='#111111')+F.label(left+F.advance('10',base),23,exponent,sup,'start',fill='#111111')
for center,exp in [(131.5,'−1'),(492.5,'−7'),(912.5,'−14')]:b+=power(center,exp)
# Dấu cộng nâng cao dùng glyph Latin của DDH, không gọi phông dự phòng.
x=31;b+=F.label(x,24,'[H',22,'start',fill='#111111');x+=F.advance('[H',22)
b+=F.label(x,14,'+',14,'start',fill='#111111');x+=F.advance('+',14)
b+=F.label(x,24,']',22,'start',fill='#111111')
b+=F.label(51,59,'(mol/L)',23,fill='#111111')+F.label(51,145,'pH',23,fill='#111111')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="964" height="151" viewBox="0 0 964 151"><title>Thang màu pH và nồng độ ion hydrogen theo nguồn</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='thang-ph-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=413,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='14cells14numbers1..14/28tickstems/ONLY10sup-1,-7,-14/[Hsup+](mol/L)/pH/allDDHpath/noextraaxis-ticks-values/shading-printtexture-notdata.')
(K/'cau-truc-thang-ph-ddh-lo-241-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
