"""Sơ đồ năm chất: giữ biếnn, điều kiện / và nhãn từng mũi tên."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-molecule-lo-106.json').read_text())if r['i']==1396);b=''
for x,t in[(100,'FeS₂'),(440,'SO₂'),(780,'SO₃'),(1240,'H₂SO₄.nSO₃'),(1780,'H₂SO₄')]:b+=F.label(x,145,t,42)
for k,(start,end)in enumerate([(220,330),(550,670),(890,1040),(1450,1640)]):
 b+=f'<path d="M{start} 130H{end-15}" stroke="#252440" stroke-width="3"/><path d="M{end} 130L{end-20} 123V137Z" fill="#252440"/>'+F.label((start+end)/2,90,r['arrows'][k]['over'],30)+F.label((start+end)/2,195,r['arrows'][k]['under'],29)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1940" height="230" viewBox="0 0 1940 230"><title>Sơ đồ sản xuất theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='so-do-acid-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
row=dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='GiữH2SO4.nSO3nbiến/dấuchấm/+O2/t°2mũitênđầu/+H2SO4/+H2O/(1)..(4).KhôngthêmV2O5/hệsố/nhiệtđộkhôngnguồn.')
(M/'cau-truc-so-do-acid-ddh-lo-108-ban-dung.json').write_text(json.dumps([row],ensure_ascii=False,indent=2))
