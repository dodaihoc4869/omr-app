"""Nguồn99: điện cực đồng và bùn anode theo nguồn, không thêm dấu cực."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='13ab7877243941189907b506084a1ba97e56c54e5c9c61f82dac86ce1791dc25';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.5,color='#252440',fill='none'):return f'<path d="{d}" fill="{fill}" stroke="{color}" stroke-width="{w}" stroke-linejoin="round"/>'
b='<path d="M106 142H491V269H106Z" fill="#a6abe8"/>'
b+=path('M147 79V20H256M265 20H426V76M257 9V32M265 4V39',2,'#ff7f27')
b+='<path d="M138 78H155V249H138Z M391 89L407 76H463V244L447 255H391Z" fill="#ff7f27"/>'
# Mảng bùn liền theo nét nguồn; không suy ra số hạt.
b+='<path d="M378 269L398 263L410 261L431 261L447 266L460 269Z" fill="#111111"/>'
b+=path('M106 102V269H491V102',3.8,'#111111')
b+=path('M79 62L138 98M519 61L448 106',1.1,'#c9ccff')+path('M541 218L444 266',1.2,'#777777')
b+=F.label(9,57,'lá đồng',24,'start',fill='#111111')+F.label(526,62,'khối đồng',24,'start',fill='#111111')+F.label(548,220,'bùn anode',24,'start',fill='#111111')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="710" height="280" viewBox="0 0 710 280"><title>Sơ đồ điện cực đồng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='tinh-che-dong-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=99,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Láđồng/khốiđồng/bùnanode/3leaders/2batteryplatesRIGHTlong/wires/purpleliquid/blackbeaker/sourcecolors/nochargeletters/noparticlecount/DDHpath.');(K/'cau-truc-tinh-che-dong-ddh-lo-204-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
