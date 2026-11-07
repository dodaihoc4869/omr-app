"""Nguồn540: đếm và giữ vị trí từng chấm nhìn rõ, không bổ sung ký hiệu theo lý thuyết."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='65ac6e267d32414b9a38437d05135ad6bc807417a3db13c2b44d916f0125bc57'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
for x,y,r in [(178,178,155),(178,179,107),(177,179,62)]:
 b+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="#c46200" stroke-width="1.8"/>'
b+='<circle cx="175" cy="179" r="34" fill="#9fb8ff"/>'
points=[(175,117),(178,240),(133,82),(229,85),(278,137),(277,216),(236,266),(140,276),(85,230),(76,145),(178,22),(22,182),(180,333)]
for x,y in points:b+=f'<circle cx="{x}" cy="{y}" r="9.3" fill="#f58226" stroke="#c47935" stroke-width="0.8"/>'
b+=F.label(175,188,'+13',24,fill='#654014',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="350" height="350" viewBox="0 0 350 350"><title>Mô hình nguyên tử theo nguồn</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='bohr-ba-lop-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=540,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3continuousorbits/13solid-orange-dots/directcount2+8+3/outerTOP-LEFT-BOTTOM-NOrightdot/bluecore+13actualDDHdam/noaddedcharge-shellnumbers-elementname-arrows-caption/0externalfont.')
(K/'cau-truc-bohr-ba-lop-ddh-lo-243-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
