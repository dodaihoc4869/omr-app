"""Nguồn798/hash948799fa…: pH năm dung dịch; giữ gốc11.0 và mọi nhãn in trong hình."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='948799fa5afb9c098bfe83f3ca764fdab936acff1c99bfc6b3fd3324d9f244ae';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<defs><linearGradient id="bar" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#88cee1"/><stop offset="1" stop-color="#87cbe2"/></linearGradient></defs><g transform="translate(20 20)">'
xs=[199,376,553,730,907];tops=[452,355,306,257,159];bounds=[(127,269),(305,446),(482,623),(659,800),(837,978)];labels=['NH₃','CH₃NH₂','C₂H₅NH₂','CH₃CH₂CH₂NH₂','(CH₃)₂NH']
for j in range(11):
 y=[501,452,404,355,306,257,208,160,111,62,14][j];b+=f'<path d="M85 {y:g}H1017" fill="none" stroke="#b9ccd6" stroke-width="1" stroke-dasharray="2 2"/>'
for x in xs:b+=f'<path d="M{x} 14V501" fill="none" stroke="#b9ccd6" stroke-width="1" stroke-dasharray="2 2"/>'
for (a,z),y in zip(bounds,tops):b+=f'<rect x="{a}" y="{y}" width="{z-a}" height="{501-y}" fill="url(#bar)"/>'
# Dấu sáng bốn cánh có thật trong cột5: giữ như trang trí, không diễn giải thành dữ liệu.
b+='<path d="M935 449C938 458 943 464 953 467C943 470 938 476 935 485C932 476 926 470 917 467C926 464 932 458 935 449Z" fill="#b5d2df"/>'
for y in tops:b+=f'<path d="M85 {y}H1017" fill="none" stroke="#b91927" stroke-width="1.7" stroke-dasharray="4.5 2.5"/>'
b+='<path d="M85 14V501H1017" fill="none" stroke="#252440" stroke-width="1.5"/>'
for j in range(11):
 y=[501,452,404,355,306,257,208,160,111,62,14][j];t=f'{11+j/10:.1f}';b+=f'<path d="M85 {y:g}H91" stroke="#252440" stroke-width="1.5"/>'+F.label(80,y+7,t,21,'end')
for x,t in zip(xs,labels):b+=f'<path d="M{x} 501V494" stroke="#252440" stroke-width="1.5"/>'+F.label(x,523,t,22)
b+='<g transform="translate(20 259) rotate(-90)">'+F.label(0,7,'pH',23)+'</g>'+F.label(553,549,'Chất',23)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1064" height="595" viewBox="0 0 1064 595"><title>pH các dung dịch theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ph-amine-nguon798-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=798,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='HASH948799fa riêng đãđọcsource798/allrefs;khôngalias774;5cyanbars/11yticks11.0..12.0DOT/5xtickslabels/11H5Vgridbehind/5redguidesOVERfill/axisorigin11.0/pHrotated-Chất/4pointpalestarretain/nondata/noheads-title-legend-extraunits.')
(K/'cau-truc-ph-amine-nguon798-ddh-lo-269-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
