"""Nguồn877: giữ ba mũi tên và hai đường ống ra không có đầu tên."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9f6ab7dfaa21abe06d429353ddae5e264d25d5ec8fdb1b44cbb2741ab9c48f44';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
b='<g transform="translate(20 20)">'+line('M312 48H357 M312 62H357 M421 48H452 M421 62H452')
b+='<rect x="110" y="8" width="202" height="102" rx="15" fill="white" stroke="#252440" stroke-width="3.5"/><circle cx="389" cy="57" r="33" fill="white" stroke="#252440" stroke-width="2"/>'
b+=line('M58 32H108 M97 25L108 32L97 39 M62 85H108 M96 78L108 85L96 92 M389 90V113 M382 105L389 113L396 105')
b+=F.label(6,40,'CH₄',23,'start')+F.label(29,94,'O₂',23,'start')+F.label(389,138,'H₂O',23)
b+=F.label(211,63,'(I)',25,weight='dam')+F.label(389,65,'(II)',25,weight='dam')
for y,prefix,tail in [(39,'(I)',' : tháp oxi hoá'),(104,'(II)',' : tháp ngưng tụ')]:
 b+=F.label(547,y,prefix,25,'start',weight='dam')+F.label(547+F.advance(prefix,25,'dam'),y,tail,25,'start')
b+='</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="840" height="187" viewBox="0 0 840 187"><title>Hai tháp công nghiệp theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='thap-methane-acetylene-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=877,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1roundrectI1circleII/2connectorlines2outletlinesNOheads/3openVheadsCH4O2RIGHT-H2ODOWN/4Romanlabelsactualdam/legendexacttháp oxi hoá-tháp ngưng tụ/noaddedproducts-percent-temp-answer.')
(K/'cau-truc-thap-methane-acetylene-ddh-lo-276-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
