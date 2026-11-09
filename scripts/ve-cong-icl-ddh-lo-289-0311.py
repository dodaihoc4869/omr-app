"""Nguồn1109: phản ứng cộng ICl, giữ nháy thẳng sau R và mọi H tường minh."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='c74a71d151580864a175dccd7eee45278caeb00e410b64ea04bf227ca6104eda';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M35 24L54 53 M139 34L128 54 M53 83L43 102 M129 83L141 102 M77 58H104 M77 68H104 M295 69H332 M429 68H531 M635 34L652 62 M739 45L727 62 M648 91L638 109 M728 92L738 111 M607 76L645 77 M676 77H703 M733 77H762" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
b+='<polygon points="521,61 546,68 521,75 526,68" fill="#252440"/>'
for x,y,t,z in [(21,29,"R'",32),(155,30,'R"',32),(62,81,'C',32),(119,81,'C',32),(34,129,'H',32),(149,129,'H',32),(216,79,'+',28),(288,81,'I',32),(350,81,'Cl',32),(621,38,"R'",32),(752,39,'R"',32),(602,89,'I',32),(660,89,'C',32),(718,89,'C',32),(781,89,'Cl',32),(630,138,'H',32),(747,138,'H',32)]:b+=F.label(x,y,t,z)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="811" height="140" viewBox="0 0 811 140"><title>Sơ đồ cộng ICl theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='cong-icl-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1109,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4explicitC4explicitH2I2Cl/4RtokensSTRAIGHTsingle-doublequotesNOTprime/1CCdouble→CCsingle/1IClbond/4CH4CRproductCIandCCl/1plus1filledRIGHT/allregularDDH/noaddedconditions-caption-phases-charges-Rvalues-answer.')
(K/'cau-truc-cong-icl-ddh-lo-289-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
