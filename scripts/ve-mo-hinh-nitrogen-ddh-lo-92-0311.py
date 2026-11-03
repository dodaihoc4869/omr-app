"""Mô hình N2 với ba ống liên kết và chú thích năng lượng đúng nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a=next(r for r in json.loads((M/'doc-molecule-lo-87.json').read_text())if r['i']==925)
b='<defs><radialGradient id="sphere" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#83c7ff"/><stop offset="0.55" stop-color="#1672ff"/><stop offset="1" stop-color="#1644e8"/></radialGradient><linearGradient id="tube" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b4b4b4"/><stop offset="0.5" stop-color="#f0f0f0"/><stop offset="1" stop-color="#929292"/></linearGradient></defs>'
for dy in[-24,0,24]:b+=f'<path d="M145 {182+dy}L320 {109+dy}" fill="none" stroke="#929292" stroke-width="16" stroke-linecap="round"/><path d="M145 {180+dy}L320 {107+dy}" fill="none" stroke="url(#tube)" stroke-width="11" stroke-linecap="round"/>'
for x,y in[(100,200),(365,90)]:b+=f'<circle cx="{x}" cy="{y}" r="70" fill="url(#sphere)"/>'+F.label(x,y+20,'N',54,fill='#eef6ff',weight='dam')
b+=F.label(520,180,'E',40,'start')+F.label(545,192,'B',25,'start')+F.label(580,180,'(N',40,'start')+''.join(f'<path d="M642 {y}H675" stroke="#252440" stroke-width="3"/>'for y in[155,165,175])+F.label(688,180,'N) = 945 kJ/mol',40,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1250" height="300" viewBox="0 0 1250 300"><title>Mô hình phân tử và năng lượng liên kết theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nitrogen-model-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
r=dict(a,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Hai cầuN xanh/nhãnNtrắng,3ốngxám chéo lênphải,captionE_B(N≡N)=945kJ/mol;Bđúngsubscriptpath,khôngUnicodebeta.')
(M/'cau-truc-mo-hinh-nitrogen-ddh-lo-92-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
