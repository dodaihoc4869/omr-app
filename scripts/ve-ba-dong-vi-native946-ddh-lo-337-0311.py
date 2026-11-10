"""Ba đồng vị nguồn946: giữ đúng hạt và các nhãn nguyên văn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ab154dba3582c8406dc8d14bab0387d2208ae442e70bd26a7a2d3b06e26f1ab1';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<defs><radialGradient id="cloud"><stop offset="0" stop-color="#ffffed"/><stop offset="1" stop-color="#ffed4d"/></radialGradient><radialGradient id="proton" cx="43%" cy="42%"><stop offset="0" stop-color="#d7f3ff"/><stop offset="0.7" stop-color="#a1d5ff"/><stop offset="1" stop-color="#66b7e7"/></radialGradient><radialGradient id="neutron" cx="45%" cy="44%"><stop offset="0" stop-color="#fff7df"/><stop offset="0.55" stop-color="#ffbdcc"/><stop offset="1" stop-color="#ff2b9c"/></radialGradient></defs>'
for x in [122,373,627]:b+=f'<circle cx="{x}" cy="123" r="109" fill="url(#cloud)" stroke="#da9c00" stroke-width="2"/>'
for x in [122,347,595]:
 b+=f'<circle cx="{x}" cy="123" r="24" fill="url(#proton)" stroke="#3a9cbc" stroke-width="2"/>'
 b+=F.label(x-2,131,'p',25,fill='#246776')+F.label(x+10,122,'+',14,fill='#246776')
for x,y in [(395,123),(638,100),(635,147)]:
 b+=f'<circle cx="{x}" cy="{y}" r="24" fill="url(#neutron)" stroke="#ee2b98" stroke-width="3"/>'
 b+=F.label(x,y+8,'n',25,fill='#fffbea',extra='stroke="#528258" stroke-width="22" paint-order="stroke fill" stroke-linejoin="round"')
for x,y in [(137,22),(420,30),(685,30)]:
 b+=f'<circle cx="{x}" cy="{y}" r="17" fill="#eaff96" stroke="#87ca35" stroke-width="3"/>'
 b+=F.label(x,y+8,'e-',25,fill='#27452e')
for x,y,t in [(114,291,'Protium'),(372,294,'Deuterium'),(626,296,'Tritium')]:b+=F.label(x,y,t,24,fill='#000000',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="749" height="307" viewBox="0 0 749 307"><title>Ba đồng vị theo nguồn946</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ba-dong-vi-native946-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=946,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3yellowclouds3green-e-minus3blue-p-supplus3pink-n/0-1-2neutrons/3trueDAMcaptionsProtium-Deuterium-Tritium/regularuprightparticlelabels/e-minusBASELINE/p-plusSUP/noaddedorbit-nucleus-electron-sign-answer')
(K/'cau-truc-ba-dong-vi-native946-ddh-lo-337-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
