"""Điện phân NaCl1200: giữ17 bọt riêng, bốn bản pin và các lớp kính/dung dịch."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='d92e12da589ef96a4e8561fedda164d72de84dfb45dee8dd618421710bb5b9cc';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.3,c='#425963'):return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
outline='M42 139H280Q284 140 280 144Q276 149 276 159V313Q276 354 230 354H92Q45 354 45 313V159Q45 149 41 144Q38 139 42 139Z'
b='<defs><clipPath id="cup"><path d="'+outline+'"/></clipPath><linearGradient id="glass" x1="0" x2="1"><stop stop-color="#f2f9fc"/><stop offset=".62" stop-color="#edf5f8"/><stop offset="1" stop-color="#e7f2f8"/></linearGradient><radialGradient id="bubble" cx=".3" cy=".23" r=".85"><stop stop-color="#f5fcff"/><stop offset=".4" stop-color="#dfF1fa"/><stop offset="1" stop-color="#cce5f1"/></radialGradient></defs>'
b+='<path d="'+outline+'" fill="url(#glass)"/>'
b+='<g clip-path="url(#cup)"><path d="M259 140Q247 141 247 160V313Q247 338 224 348H230Q271 347 271 313V158Q271 145 277 140Z" fill="#d6e7f1"/>'
b+='<path d="M51 209H271V313Q271 348 230 348H92Q51 348 51 313Z" fill="#d3e9f7"/>'
b+='<path d="M247 209H271V313Q271 348 230 348H224Q247 338 247 313Z" fill="#b4d8ee"/>'
b+='<path d="M59 140H77Q83 155 80 177V313Q81 336 108 348H92Q61 337 61 313V159Q61 145 59 140Z" fill="#f7fcff" opacity=".7"/></g>'
b+=path('M105 114V56H149 M171 56H217V114',1.5,'#263d47')
for x in [98,210]:
 b+=f'<path d="M{x} 114H{x+15}V325H{x}Z" fill="#565656" stroke="#2c414b" stroke-width="1.2"/>'
 b+=f'<path d="M{x+.6} 209H{x+14.4}V324.4H{x+.6}Z" fill="#5a676d"/>'
b+=path('M149 35V78 M156 47V66 M164 35V78 M171 47V66',1.8,'#425963')
b+=F.label(135,48,'+',24,fill='#425963')+F.label(181,48,'−',24,fill='#425963')
b+=path(outline)+path('M46 140Q51 145 51 158V313Q51 348 92 348H230Q271 348 271 313V158Q271 145 277 140',1.2)+path('M42 139H280',1.2)
left=[(86,229,5),(130,224,6.5),(119,242,4),(93,254,6.5),(123,264,5.5),(84,271,5),(93,289,6.5),(123,289,5.5),(118,312,6.5)]
right=[(200,222,4),(237,225,5),(191,244,5),(229,249,6.5),(205,272,6.5),(235,274,5),(205,294,6.5),(229,308,6.5)]
for x,y,r in left+right:
 b+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#bubble)" stroke="#5d7883" stroke-width=".85"/>'
 b+=f'<ellipse cx="{x-r*.28}" cy="{y-r*.34}" rx="{r*.25}" ry="{r*.21}" fill="#fff" opacity=".8"/>'
b+=F.label(163,341,'NaCl',28,fill='#263a43')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="323" height="390" viewBox="0 0 323 390"><title>Điện phân theo nguồn1200</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dien-phan-nacl-native1200-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1200,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1openbeakerstraightRIM139-liquid209/2grayrodsbluegraybelowliquid/4batterybarsLONGshortLONGshort/+LEFT−RIGHT/17bubblesLEFT9RIGHT8FRONTrodsoverlap/whiteinternalhighlightsNOTextrabubbles/NaClregularDDH/noaddedgas-currentnames-arrows-voltage-molarity-answer')
(K/'cau-truc-dien-phan-nacl-native1200-ddh-lo-321-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
