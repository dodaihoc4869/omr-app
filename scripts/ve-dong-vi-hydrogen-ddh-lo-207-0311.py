"""Nguồn110: ba sơ đồ đồng vị, giữ số hạt, điện tích và chú thích gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='14b953017b488e11acd383be65e26411b465e148de197f3c6b71256715c621e4';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='''<defs><radialGradient id="cloud"><stop offset="0" stop-color="#ffffe4"/><stop offset=".48" stop-color="#fffca7"/><stop offset="1" stop-color="#ffeb51"/></radialGradient><radialGradient id="proton" cx=".4" cy=".35"><stop offset="0" stop-color="#e4f5ff"/><stop offset=".64" stop-color="#b5d9ff"/><stop offset="1" stop-color="#7fb7ee"/></radialGradient><radialGradient id="neutron" cx=".4" cy=".35"><stop offset="0" stop-color="#ffd9f6"/><stop offset=".65" stop-color="#ff9ada"/><stop offset="1" stop-color="#e94ba9"/></radialGradient></defs>'''
for x in [122,373,626]:b+=f'<circle cx="{x}" cy="123" r="108" fill="url(#cloud)" stroke="#dba11b" stroke-width="2.3"/>'
for x,y in [(122,123),(347,123),(596,123)]:
 b+=f'<circle cx="{x}" cy="{y}" r="23" fill="url(#proton)" stroke="#53afe0" stroke-width="2.3"/><circle cx="{x}" cy="{y}" r="19.5" fill="none" stroke="#8cc9f5" stroke-width="1.5"/>'
 b+=F.label(x-2,y+7,'p',23,fill='#39485d')+F.label(x+12,y-1,'+',12,fill='#39485d')
for x,y in [(395,123),(638,99),(635,147)]:
 b+=f'<circle cx="{x}" cy="{y}" r="23" fill="url(#neutron)" stroke="#dd32a2" stroke-width="2.3"/><circle cx="{x}" cy="{y}" r="19.5" fill="none" stroke="#f569be" stroke-width="1.5"/>'+F.label(x,y+7,'n',23,fill='#64304c')
for x,y in [(136,22),(420,31),(685,31)]:
 b+=f'<circle cx="{x}" cy="{y}" r="17" fill="#ddff59" stroke="#65a72b" stroke-width="2.2"/>'+F.label(x-2,y+7,'e',23,fill='#456b27')+F.label(x+9,y+4,'-',16,fill='#456b27')
for x,t in [(114,'Protium'),(373,'Deuterium'),(626,'Tritium')]:b+=F.label(x,290,t,23,fill='#111111',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="755" height="311" viewBox="0 0 755 311"><title>Ba sơ đồ đồng vị theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dong-vi-hydrogen-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=110,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3yellowclouds/3electrons-e−/3protons-p+/neutrons0-1-2/3Englishcaptionsdam/sourcecolors/internalgradients/DDHpath.');(K/'cau-truc-dong-vi-hydrogen-ddh-lo-207-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
