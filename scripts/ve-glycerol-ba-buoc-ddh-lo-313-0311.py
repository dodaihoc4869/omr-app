"""Nguồn1378: giữ ba bước và nhãn nguyên bản, không thêm xúc tác từ câu dẫn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='f8c631133d9ac5bad4b5881cc057131fa12166253bb872de2691056f21bf2bd7';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def label(x,y,t,z=25,anchor='middle',weight='de'):return F.label(x,y,t,z,anchor=anchor,weight=weight,fill='#111')
def italic(x,y,t):return f'<g transform="translate({x} {y}) skewX(-10)">'+label(0,0,t)+'</g>'
def path(d):return f'<path d="{d}" fill="none" stroke="#111" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
b=label(58,88,'Glycerol',32,'start')
for x,t in [(430,'X'),(701,'Y'),(963,'Z')]:b+=label(x,88,t,34,weight='dam')
for start,end,c in [(195,408,300),(467,680,572),(729,942,834)]:
 b+=path(f'M{start} 77H{end} M{end-11} 67L{end} 77L{end-11} 87')
 b+=italic(c,66,'+ CH₃COOH')+italic(c,103,'−H₂O')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1026" height="162" viewBox="0 0 1026 162"><title>Ba bước theo nguồn1378</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glycerol-ba-buoc-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1378,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='GlycerolregularUPRIGHT→X→Y→ZtrueDAM-UPRIGHT/3OPENV2legs-shafttoTIP/3above+CH3COOH-3belowminusH2O-ALLchemregularITALIC/noaddedH2SO4-temp-names-structures-answer')
(K/'cau-truc-glycerol-ba-buoc-ddh-lo-313-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
