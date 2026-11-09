"""Nguồn1341: mạch sáu nối đôi, giữ khe trắng carbonyl thực thấy trong bản gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='f2e809303f3a4b38002d2e6bcc6e56fd86fc3dcb915ddfc2eae64a098ff707de';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
v=[(75,56),(110,18),(139,55),(174,19),(212,19),(241,56),(277,20),(315,20),(343,57),(379,21),(416,21),(444,58),(479,22),(517,22),(546,59),(582,23),(620,23),(649,60),(685,24),(723,24),(751,61),(788,24)]
def path(d):return '<path d="'+d+'" fill="none" stroke="#202020" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
b=path('M'+'L'.join(f'{x} {y}'for x,y in v))
b+=path('M47 20L75 56 M72 62V89 M79 62V89')
for a in [3,6,9,12,15,18]:
 x,y=v[a];xx,yy=v[a+1];b+=path(f'M{x+3} {y+7}H{xx-3}')
b+=F.label(35+F.advance('O',26)/2,26,'HO',26,anchor='end',fill='#202020')+F.label(75,112,'O',26,fill='#202020')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="796" height="116" viewBox="0 0 796 116"><title>Mạch acid theo nguồn1341</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='mach-acid-sau-noi-doi-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1341,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='22bareC2O/6horizontalCCdoubleinnerBELOW/COdoubleDOWN2verticalrays-withnativeWHITEGAP/HOleftOanchor/freeRIGHTUP/allthinregularDDH/noaddedH-Cnums-caption-name-answer/noalias942')
(K/'cau-truc-mach-acid-sau-noi-doi-ddh-lo-308-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
