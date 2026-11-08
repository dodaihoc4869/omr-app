"""Nguồn951: mô hình nguyên tử xám với bốn thùy hạt nhân nhìn thấy."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ac3b635d923d6f5bd483c74e876247c266afd0212435420c9ac20d65c93e7e26';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
b='<defs><radialGradient id="gray" cx="64%" cy="32%" r="68%"><stop offset="0" stop-color="#c4c4c4"/><stop offset="0.45" stop-color="#939393"/><stop offset="1" stop-color="#6e6e6e"/></radialGradient></defs><circle cx="118" cy="102" r="101" fill="none" stroke="#808080" stroke-width="1.6"/>'
for x,y,r in [(110,109,11),(126,93,10),(111,94,12),(125,106,12),(43,36,7.5),(194,167,7.5)]:b+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="url(#gray)"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="232" height="210" viewBox="0 0 232 210"><title>Mô hình nguyên tử theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='helium-bon-hat-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=951,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1continuousgrayorbit/2smallgrayballscoverorbit/4overlappinggraynucleuslobes/upperRIGHThighlights/noaddedhiddenball-charge-label-He-arrow-name-answer.')
(K/'cau-truc-helium-bon-hat-ddh-lo-282-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
