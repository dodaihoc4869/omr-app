from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='e61fb5d63768923f8211848cb0fc1421ac953313b1744da871d820db0f227853';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
for x,lev in [(147,141),(261,131),(368,121)]:
 b+=f'<path d="M{x} {lev}H{x+49}V184C{x+49} 208 {x} 208 {x} 184Z" fill="#4245cc"/>'
 if x==368:b+=f'<path d="M{x} 121H{x+49}" stroke="#111111" stroke-width="2.2"/>'
 if x!=368:b+=f'<path d="M{x} 121H{x+49}V{lev}H{x}Z" fill="#ffff00" stroke="#111111" stroke-width="2.2"/>'
 b+=f'<path d="M{x} 7V184C{x} 208 {x+49} 208 {x+49} 184V7" fill="none" stroke="#111111" stroke-width="3.2"/>'
b+='<path d="M116 109L148 130 M122 175L148 165" fill="none" stroke="#777777" stroke-width="0.8"/>'
b+=F.label(55,106,'ester',23,anchor='start',fill='#111111')+F.label(7,188,'dung dịch',23,anchor='start',fill='#111111')
for x,t in [(171,'(1)'),(286,'(2)'),(393,'(3)')]:b+=F.label(x,235,t,24,weight='dam',fill='#111111')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="426" height="246" viewBox="0 0 426 246"><title>Ba ống nghiệm phân lớp</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ba-ong-phan-lop-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1269,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3openUtesttubes/3bluefills/yellowupper1thick2thin3none/2noheadleaders/ester-dung dịch/3actualDAMnumbers/regularDDHlabels/noaddedliquid-level-normalization-answer')
(K/'cau-truc-ba-ong-phan-lop-ddh-lo-300-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
