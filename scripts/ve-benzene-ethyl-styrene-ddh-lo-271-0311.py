"""Nguồn845: giữba vòng vàđiều kiện nguyênvăn, khôngđiền polymerA."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9b504c624c0fc7b49973715bb4474f1a6c1ccd445b2873a45aca337e071f5060';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
b='<g transform="translate(20 20)">'
for x,y in [(44,77),(239,81),(588,81)]:
 b+=line(f'M{x} {y}L{x+34} {y-20}L{x+68} {y}V{y+39}L{x+34} {y+59}L{x} {y+39}Z M{x+7} {y+5}V{y+34} M{x+34} {y-13}L{x+61} {y+3} M{x+34} {y+51}L{x+61} {y+35}')
b+=line('M307 81L327 69 M656 81L677 68')
b+=F.label(328,76,'CH₂CH₃',34,'start')+F.label(679,76,'CH=CH₂',34,'start')
for x0,x1,y,top,num in [(123,232,97,'CH₂=CH₂','(1)'),(460,570,97,'xt','(2)'),(825,936,98,'xt, t°, p','(3)')]:
 b+=line(f'M{x0} {y}H{x1} M{x1-12} {y-5}L{x1} {y}L{x1-12} {y+5}')+F.label((x0+x1)/2,y-9,top,22)+F.label((x0+x1)/2,y+22,num,22)
b+=F.label(955,110,'A',34,weight='dam');b+='</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1041" height="213" viewBox="0 0 1041 213"><title>Sơ đồ ba vòng vàA theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='benzene-ethyl-styrene-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=845,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3phenyl9innerdouble/CH2CH3→CH=CH2firstCanchors/3openVRIGHTheads/CH2=CH2-xt-xt,t°,p/3stepnums1..3/Aactualdamliteral/noaddedH2-yield80%-polymeranswer-caption.')
(K/'cau-truc-benzene-ethyl-styrene-ddh-lo-271-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
