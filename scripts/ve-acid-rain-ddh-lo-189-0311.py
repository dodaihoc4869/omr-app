"""Nguồn386: cảnh quan mưa acid và toàn bộ nhãn nguyên nguồn."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='45002f0511a3f63ddde829cf1f5281e0e84339978834992e3b938349fc1e37f9';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,fill='none',stroke='none',w=1):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round"/>'
def cloud(x,y,scale=1):
 b=f'<g transform="translate({x} {y}) scale({scale})">';b+=path('M-50 9C-68 6-64-16-50-17C-43-27-29-28-21-21C-16-36 5-36 8-22C19-34 41-28 43-14C60-15 65 2 53 7C42 17 27 16 20 9C10 26-8 24-17 14C-28 25-43 21-48 11Z','#e0f6ff','#009fd7',1);b+=path('M-52 2Q-23-7 0-1T51-1Q30 11 16 6Q-5 19-19 7Q-39 17-52 2Z','#f8fdff');return b+'</g>'
def tree(x,y,green=False):
 b=path(f'M{x} {y}L{x-1} {y-45}M{x-1} {y-20}L{x-10} {y-39}M{x-1} {y-29}L{x+9} {y-48}M{x-3} {y-27}L{x-5} {y-52}M{x+2} {y-35}L{x+12} {y-57}',stroke='#644019',w=1.7)
 if green:
  for dx,dy,rx,ry in [(-5,-48,7,15),(6,-53,7,14),(0,-60,8,14)]:b+=f'<ellipse cx="{x+dx}" cy="{y+dy}" rx="{rx}" ry="{ry}" fill="none" stroke="#a7c72c" stroke-width="1.5"/>'
 return b
b='<defs><linearGradient id="water" x2="0" y2="1"><stop stop-color="#66daff"/><stop offset="1" stop-color="#009ddf"/></linearGradient></defs>'
# Nước và các dải bờ hồ, không dữ liệu định lượng.
b+=path('M3 284Q32 264 76 270L394 256Q451 260 461 278Q453 289 468 305L458 323L458 348H21Q2 337 14 315L3 304L8 292Z','#2d5420')+path('M15 285Q60 271 96 280L402 270Q452 271 456 283L449 296L460 309L449 329L449 346H26Q10 336 22 320L10 305L18 294Z','url(#water)')
for y in [288,299,312,327,338]:b+=path(f'M29 {y}Q76 {y-9} 118 {y}T218 {y}T321 {y}T432 {y}',stroke='#85e6ff',w=1.5)
b+=path('M20 271L64 254L89 226L116 204L140 210L172 189L192 198L218 180L232 196L250 185L278 207L306 191L326 177L347 198L368 204L386 225L415 238L445 264L384 276L311 275L258 280L204 276L155 270L107 282L57 279Z','#235b0d')
b+=path('M35 267L77 251L99 224L123 205L143 221L173 195L191 213L210 193L227 217L253 199L278 221L315 194L337 205L363 219L392 237L426 259L346 269L283 260L235 267L189 259L139 274L95 265L68 275Z','#4a8a0c')
b+=path('M30 270L90 258L118 232L143 241L158 255L179 261L158 274L101 280Z','#86b522')+path('M177 276L218 251L270 244L298 251L319 235L355 246L415 260L357 269L302 278L253 272L219 282Z','#5a900a')
for d in ['M99 223L109 216L127 237L113 232Z','M155 219L169 206L190 230L176 224Z','M205 258L228 250L245 257L232 261Z','M245 271L268 258L283 263L276 269Z','M307 254L322 245L342 250L337 256Z']:b+=path(d,'#a4c727')
# Dòng chảy từ sườn đồi xuống hồ và mũi tên đỏ.
b+=path('M222 247Q211 256 202 258Q194 263 190 271Q182 275 176 280',stroke='#3dc2ec',w=4)+path('M210 252Q201 259 190 266',stroke='#f44735',w=2)+path('M190 266L194 259L197 264Z','#f44735')+path('M180 279Q190 286 203 289',stroke='#f44735',w=2)+path('M203 289L196 284L196 290Z','#f44735')
for x,y,g in [(76,274,False),(87,270,False),(101,271,False),(113,270,False),(128,271,True),(137,271,True)]:b+=tree(x,y,g)
# Hai khu nhà máy, năm ống khói như nguồn.
b+=path('M216 222L251 220L258 227V244H217Z','#cbaa55','#746126',.8)
for x in [222,245]:b+=path(f'M{x} 224V190H{x+5}V224Z','#dac56d','#887b43',.8)
for x in [220,232,244]:b+=f'<rect x="{x}" y="229" width="7" height="6" fill="#e7f2db" stroke="#8c7c3b" stroke-width=".7"/>'
for x,y,w,base in [(315,189,11,240),(351,207,9,248),(379,215,7,253)]:b+=path(f'M{x} {base}V{y}H{x+w}V{base}Z','#c7e8e8','#87b8bd',.8)
for wall in ['M296 236L326 219V245L296 240Z','M328 239L358 227V250L328 246Z','M360 244L386 235V254L360 250Z']:b+=path(wall,'#f2eed1','#a0bda5',.8)
for roof in ['M296 236L326 219','M328 239L358 227','M360 244L386 235']:b+=path(roof,stroke='#79c6db',w=2.5)
for x,y in [(303,237),(335,242),(367,247)]:b+=f'<rect x="{x}" y="{y}" width="6" height="3" fill="#d7cf80"/>'
for x,y in [(223,184),(245,183),(319,184),(354,202),(382,209)]:
 for j in range(4):b+=f'<ellipse cx="{x+4+j*4}" cy="{y-j*7}" rx="{7+j*2}" ry="{4+j}" fill="#eef1f0" opacity=".65"/>'
# Nuages, mưa và mặt trời.
b+=cloud(88,84,1.1)+cloud(303,75,1)+cloud(203,55,.34)+cloud(419,111,.34)
for x in range(33,155,13):
 for y in range(120,191,18):b+=path(f'M{x} {y}l-4 8',stroke='#d6f1fb',w=.7)
for i in range(12):
 a=i*math.pi/6;x=193+14*math.cos(a);y=91+14*math.sin(a);u=193+19*math.cos(a+.12);v=91+19*math.sin(a+.12);b+=path(f'M{x} {y}L{u} {v}L{193+13*math.cos(a+.3)} {91+13*math.sin(a+.3)}Z','#d8ab49')
b+='<circle cx="193" cy="91" r="12" fill="#d4af4f"/><circle cx="193" cy="91" r="7" fill="#e3dc96"/>'
for x,y0,y1 in [(223,153,103),(248,153,103),(326,153,103),(352,153,103)]:b+=path(f'M{x} {y0}C{x+7} {y0-12} {x-7} {y0-16} {x} {y0-27}S{x+3} {y1+12} {x} {y1+7}',stroke='#ff271d',w=1)+path(f'M{x} {y1}l-3 8h6Z','#ff271d')
b+=path('M82 110H97V132H106L90 158L73 132H82Z','#fa241d')+path('M110 162H114V205H120L112 215L105 205H110Z','#f7251b')
b+=F.label(233,26,'ACID RAIN',25)+F.label(45,132,'H₂SO₄',16)+F.label(140,132,'HNO₃',16)+F.label(304,83,'H₂O',21)+F.label(239,173,'NO₂',16)+F.label(342,173,'SO₂',16)+F.label(69,197,'Trees killed',11,fill='#f23820')+F.label(69,211,'by acid rain',11,fill='#f23820')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360"><title>Acid rain theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='acid-rain-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=386,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='ACIDRAIN/allEnglishlabels-formulas/4clouds/sun/4wavyuparrows/2downarrows/redrunoffarrows/trees/factories/lake/sourceillustrationnotquantitativevegetation.');(K/'cau-truc-acid-rain-ddh-lo-189-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
