"""Nguồn318: minh họa xám, không suy độ sáng bóng hay cực điện từ lý thuyết."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='37166ff253ceab6d688bc041c00ecc8090a3fe02990e26a03c0af6ab09f9af13';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.3,fill='none',c='#707070',extra=''):return f'<path d="{d}" fill="{fill}" stroke="{c}" stroke-width="{w}" {extra}/>'
def ellipse(x,y,rx,ry,fill='none',w=1.3,c='#707070'):return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{c}" stroke-width="{w}"/>'
b=path('M208 47L337 54V104L208 87Z',1.5,'#bdbdbd')+path('M337 54L369 50V93L337 104Z',1.5,'#999999')+path('M208 47L249 41L369 50L337 54Z',1.5,'#ffffff')
for x,y in [(217,70),(265,74),(315,79)]:b+=ellipse(x,y,4.5,5,'#b7b7b7',1.4)
for x,y in [(229,71),(278,75),(327,80)]:b+=ellipse(x,y,4.5,5,'#ffffff',1.4)
for d in ['M217 75Q214 82 208 88C178 108 144 124 78 128','M229 76Q225 84 220 91C214 108 197 121 181 135L150 153Q143 157 127 151Q116 146 113 156','M265 79C264 91 264 104 270 115C280 130 258 139 235 145','M278 80C278 88 273 93 273 99C274 109 281 117 286 124C293 136 288 143 276 143H270Q265 143 266 155','M315 84C316 101 312 122 319 134C330 145 343 148 353 148Q358 148 358 159','M327 85C329 109 331 124 342 129L356 134']:b+=path(d,1.3)
def cup(offset,n):
 z=f'<g transform="translate({offset} 0)">'
 z+=path('M45 180V260C45 279 125 279 125 260V180Z',1.5,'#ffffff')
 z+=ellipse(85,203,40,13,'none',1.1,'#a2a2a2')+path('M45 260C57 250 111 250 125 260',1,'none','#a2a2a2','stroke-dasharray="2.5 4"')
 for x,w in [(92,9),(109,8)]:
  top=189 if x==92 else 180
  z+=path(f'M{x} {top}H{x+w}V259H{x}Z',1.3,'#ffffff')+path(f'M{x+w-2} {top+1}V258',1.8,'none','#b3b3b3')+path(f'M{x} 205H{x+w}',1.1)
 z+=ellipse(85,171,44,14,'#eeeeee',1.5)+ellipse(85,169,38,10,'#ffffff',1.2)+path('M44 175C53 190 120 190 127 175',1.1)
 # Chỉ một dây nối cục bộ từ chân bóng tới cọc trái như nguồn.
 z+=path('M77 160C78 150 84 139 90 143Q98 143 96 156',1.3)
 for x,y in [(92,158),(109,156)]:
  z+=path(f'M{x} {y}H{x+7}V172H{x}Z',1.2,'#eeeeee')+path(f'M{x+7} {y}L{x+9} {y-2}V170L{x+7} 172Z',1,'#bdbdbd')+path(f'M{x} {y}L{x+2} {y-2}H{x+9}L{x+7} {y}Z',1,'#ffffff')
 glass='#f5f5f5' if n==3 else '#ffffff'
 z+=path('M57 161C57 153 52 149 52 138C48 126 57 119 65 119C74 118 81 128 78 138C77 148 70 153 70 161Z',1.4,glass)
 z+=path('M54 140C48 144 52 157 55 162',1.1)
 if n==1:z+=path('M59 142C54 130 57 125 64 126C73 126 75 134 71 144',2.4,'none','#dddddd')
 z+=path('M60 161V133Q60 125 65 126Q70 126 70 133V161Z',1.1,'#999999')+path('M63 161V139Q65 138 67 139V161',.8,'#ffffff')
 z+=ellipse(66,166,17,8,'#b5b5b5',1.3)+ellipse(66,163,13,5,'#c9c9c9',1.1)+path('M61 156V164Q66 168 71 164V156',1.1,'#a6a6a6')
 z+=F.label(85,308,f'({n})',22)
 return z+'</g>'
for offset,n in [(0,1),(153,2),(305,3)]:b+=cup(offset,n)
b+=path('M334 40L301 50',1.2)+F.label(362,27,'Nguồn điện',22)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="499" height="321" viewBox="0 0 499 321"><title>Bộ ba cốc dẫn điện theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ba-coc-dan-dien-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=318,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='grayillustration/3cups6electrodes/3lamps6externalwires6supplyterminals/localserieswires/lidellipses-liquidsurface-dashedbackarcs/3numbers-Nguồnđiện-DDHpath/filamentgray1paleinnercrescent2white3verylightgrayfieldVISUALONLY/noinferredbrightness-rays-ions-polarity-chemicalnames.')
(K/'cau-truc-ba-coc-dan-dien-ddh-lo-225-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
