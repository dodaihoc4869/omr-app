"""Nguồn465: giữ mạch mở uốn quanh và ba liên kết đôi của ảnh gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='54772107eb2e02514a88803d0e9d3115e847a1228894e7faba923612b5c4f055';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="3.2" stroke-linejoin="round"/>'
b=line('M84 73V118L44 141V186L84 209V254L123 277L163 254L203 277L243 254V209L282 186V141L243 118V73L203 50L163 73V118')
b+=line('M204 268L234 251M274 180V147M235 79L204 60M84 73L61 57M80 78L57 65M84 73L109 59')
b+=F.label(45,58,'O',20,weight='dam')+F.label(123-F.advance('O',20,weight='dam')/2,58,'OH',20,'start',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="319" height="315" viewBox="0 0 319 315"><title>Mạch acid béo theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='linolenic-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=465,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='18Cinclcarbonyl+17implicit/3CCdouble+1COdouble/COOHexplicitO-OHdamthật/coiledOPENchainfreeC18/noaddedH-caption-numbers/DDHpath.')
(K/'cau-truc-linolenic-ddh-lo-232-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
