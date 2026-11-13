"""Mô hình helium nguồn780: một quỹ đạo, hai electron, bốn hạt tâm."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='91d2bc19d2a6ea61b0cfe27f3d01d035780d61b9ecca0ce3dd1e3a4a54a933f9'
# Sắc độ là phần minh hoạ của từng hạt; không diễn giải hạt nhiễu quét thành chấm mới.
b='<defs><radialGradient id="hat" cx="65%" cy="32%" r="65%"><stop offset="0" stop-color="#c7c7c7"/><stop offset="0.25" stop-color="#a3a3a3"/><stop offset="0.65" stop-color="#8d8d8d"/><stop offset="1" stop-color="#747474"/></radialGradient></defs>'
b+='<defs><radialGradient id="hatDuoiTrai" cx="63%" cy="58%" r="65%"><stop offset="0" stop-color="#c2c2c2"/><stop offset="0.25" stop-color="#a3a3a3"/><stop offset="0.65" stop-color="#8d8d8d"/><stop offset="1" stop-color="#747474"/></radialGradient></defs>'
b+='<ellipse cx="169.5" cy="149.5" rx="121" ry="121" fill="none" stroke="#939393" stroke-width="1.3"/>'
# Các hạt nằm trước nét quỹ đạo, không thêm dấu điện tích hay nhãn nguyên tố.
b+='<path d="M159 139L179 139L178 158L158 159Z" fill="#747474"/>'
for x,y,rx,ry in [(79,71,8.5,8.5),(261,228,8.5,8.5),(158,159,12,12.5),(159,139,13,13.5),(179,139,12,12.5),(178,158,12.5,13)]:
 gradient='hatDuoiTrai' if (x,y)==(158,159) else 'hat'
 b+=f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="url(#{gradient})"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="334" height="307" viewBox="0 0 334 307"><title>Mô hình helium theo nguồn780</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='helium780-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='1GRAYorbit-2GRAYelectrons-4GRAYnucleons/6individualshadedellipsesOVERorbit/0glyph-charge-arrows-caption/NOaddedproton-neutron-colors-signs-numbers/scanGrainNOTextraParticles/nativeapproxNOTsubpixel'
r=dict(i=780,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-helium780-native-ddh-lo-427-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-helium780-lo-427.json').write_text(json.dumps(dict(hash=h,native=[334,307],questions=qs,ghiChu=note,rootSourceAudit='RootOWNnativeFULL/all2publicde10-C1-B3-D2-II-1/DB-10-B1-D1-II-97; OWNnucleus10x/electron20x. One orbit gray, two foreground electrons, four overlapping shaded central particles. No particle species inferred from shade. No text, arrows or signs. NativeapproxNOTsubpixel; scanner grain not traced as extra dots.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
