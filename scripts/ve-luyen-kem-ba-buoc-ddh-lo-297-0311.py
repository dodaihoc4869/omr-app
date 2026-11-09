"""Nguồn1250: ba sơ đồ luyện kẽm nguyên văn, không tự cân bằng hay thêm hệ số."""
from pathlib import Path
import importlib.util,json,hashlib,re
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='e32a8168dd3fc7d1eab4859ce8f0d192ba34915670d9583901381a2005b3a618';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
def formula(x,y,t):
 global b
 for a in re.findall(r'_[0-9]+|[^_]+?(?=_|$)',t):
  sub=a.startswith('_');a=a[1:]if sub else a;z=18 if sub else 29
  b+=F.label(x,y+(7 if sub else 0),a,z,anchor='start',fill='#222222');x+=F.advance(a,z)
 return x
rows=[(85,95,'ZnS + O_2',244,401,407,'ZnO + SO_2','t°, H=75%',323,70),(134,100,'ZnO + H_2SO_4',312,449,462,'ZnSO_4 + H_2O','H=100%',380,119),(182,100,'ZnSO_4 + H_2O',311,490,505,'Zn + H_2SO_4 + O_2','dpdd, H=80%',401,167)]
for i,(y,x,left,a,z,right,product,condition,cx,cy)in enumerate(rows,1):
 formula(45,y,'('+str(i)+')');formula(x,y,left);formula(right,y,product)
 b+=f'<path d="M{a} {y-8}H{z} M{z-8} {y-15}L{z} {y-8}L{z-8} {y-1}" fill="none" stroke="#222222" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
 b+=F.label(cx,cy,condition,17,fill='#222222')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="823" height="239" viewBox="0 0 823 239"><title>Ba sơ đồ sản xuất kẽm theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='luyen-kem-ba-buoc-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1250,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3reactionrows(1)..(3)/3openVRIGHT/ZnS+O2→ZnO+SO2;ZnO+H2SO4→ZnSO4+H2O;ZnSO4+H2O→Zn+H2SO4+O2/t°, H=75%;H=100%;dpdd, H=80%/regularDDH/subscripts2-4/noaddedcoefficients-balancedreaction-caption-answer.')
(K/'cau-truc-luyen-kem-ba-buoc-ddh-lo-297-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
