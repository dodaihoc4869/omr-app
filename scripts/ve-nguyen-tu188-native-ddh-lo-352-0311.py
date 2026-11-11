"""Nguyên tử nguồn188: hai vòng, bảy chấm; giữ mép cắt dưới native."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-nguyen-tu188-lo-352.json').read_text());h=p['hash'];g=p['geometry']
b='''<defs><radialGradient id="electron" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#55b4c8"/><stop offset="0.55" stop-color="#2996b1"/><stop offset="1" stop-color="#26788b"/></radialGradient><radialGradient id="core"><stop offset="0" stop-color="#fadd65"/><stop offset="1" stop-color="#fadd70"/></radialGradient></defs>'''
for o in g['orbits']:
 x,y=o['center'];b+=f'<ellipse cx="{x}" cy="{y}" rx="{o["rx"]}" ry="{o["ry"]}" fill="none" stroke="#9591a7" stroke-width="2.2"/>'
o=g['nucleus'];x,y=o['center'];b+=f'<circle cx="{x}" cy="{y}" r="{o["radius"]}" fill="url(#core)"/>'
b+=F.label(131,142,'+7',26,fill='#161508',weight='dam')
for o in g['innerElectrons']+g['outerElectrons']:
 x,y=o['center'];b+=f'<ellipse cx="{x}" cy="{y}" rx="{o["rx"]}" ry="{o["ry"]}" fill="url(#electron)" stroke="#397f8e" stroke-width="0.8"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="380" height="242" viewBox="0 0 380 242"><title>Mô hình nguyên tử theo nguồn188</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nguyen-tu188-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=188,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2grayvioletcontinuousorbits/7tealdots2inner5outerOVERorbits/1yellowcore+7trueDAMuprightSAMEbaseline/outerBOTTOMcroppednative242/blankRIGHTretained/0arrows0captions/noaddedN-name-shellnums-electronminus-ionanswer')
(K/'cau-truc-nguyen-tu188-native-ddh-lo-352-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
