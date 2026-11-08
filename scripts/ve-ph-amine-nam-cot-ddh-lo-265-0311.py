"""Nguồn hash90940b7f…: pH năm dung dịch; giữ gốc11.0 và mọi nhãn in trong hình."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='90940b7feb3548aa1483a2d664c919ce3a4735d5c1ea9cf95b8f26f8ac80b120';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<defs><linearGradient id="bar" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#88cee1"/><stop offset="1" stop-color="#87cbe2"/></linearGradient></defs><g transform="translate(10 12)">'
xs=[174,330,486,641,797];tops=[397,312,269,226,141];bounds=[(112,237),(268,392),(424,548),(579,704),(735,859)];labels=['NH₃','CH₃NH₂','C₂H₅NH₂','CH₃CH₂CH₂NH₂','(CH₃)₂NH']
for j in range(11):
 y=440-j*42.8;b+=f'<path d="M75 {y:g}H894" fill="none" stroke="#b9ccd6" stroke-width="1" stroke-dasharray="2 2"/>'
for x in xs:b+=f'<path d="M{x} 12V440" fill="none" stroke="#b9ccd6" stroke-width="1" stroke-dasharray="2 2"/>'
for (a,z),y in zip(bounds,tops):b+=f'<rect x="{a}" y="{y}" width="{z-a}" height="{440-y}" fill="url(#bar)"/>'
# Dấu sáng bốn cánh có thật trong cột5: giữ như trang trí, không diễn giải thành dữ liệu.
b+='<path d="M822 396C825 404 829 408 838 410C830 413 825 418 822 426C819 418 814 413 806 410C814 408 819 404 822 396Z" fill="#b5d2df"/>'
for y in tops:b+=f'<path d="M75 {y}H894" fill="none" stroke="#b91927" stroke-width="1.7" stroke-dasharray="4.5 2.5"/>'
b+='<path d="M75 12V440H894" fill="none" stroke="#252440" stroke-width="1.5"/>'
for j in range(11):
 y=440-j*42.8;t=f'{11+j/10:.1f}';b+=f'<path d="M75 {y:g}H80" stroke="#252440" stroke-width="1.5"/>'+F.label(73,y+6.5,t,18,'end')
for x,t in zip(xs,labels):b+=f'<path d="M{x} 440V434" stroke="#252440" stroke-width="1.5"/>'+F.label(x,460,t,20)
b+='<g transform="translate(16 227) rotate(-90)">'+F.label(0,7,'pH',21)+'</g>'+F.label(484,482,'Chất',21)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="920" height="510" viewBox="0 0 920 510"><title>pH các dung dịch theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ph-amine-nam-cot-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=774,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='HASH90940b7f riêng không lấy i774 làm địnhdanh;5cyanbars/11yticks11.0..12.0DOT/5xtickslabels/11H5Vgridbehind/5redguidesOVERfill/axisorigin11.0/pHrotated-Chất/4pointpalestarretain/nondata/noheads-title-legend-extraunits.')
(K/'cau-truc-ph-amine-nam-cot-ddh-lo-265-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
