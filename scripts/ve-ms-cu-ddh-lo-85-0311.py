"""Phổ Cu: tọa độ đo trên từng ảnh nguồn, không bổ sung trị số đỉnh từ câu dẫn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
sources={r['i']:r for r in json.loads((M/'doc-dung-moi-lo-79.json').read_text())}
inv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());assets=sorted(inv['assets'],key=lambda r:r['hash'])
for i in [634,245]:
 a=assets[i];qs=[]
 for q in inv['questions']:
  refs=[h for h in q['hinh'] if h['hash']==a['hash']]
  if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
 sources[i]=dict(i=i,hash=a['hash'],fileNguon=a['file'],questions=qs,ghiChuNguon='Đã mở native/zoom4x và đo pixel độc lập, report doc-cu-bo-4-lo-85.json; không gán trị số đỉnh từ lý thuyết.')
def line(x,y,xx,yy,w=3):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" fill="none" stroke="#252440" stroke-width="{w}"/>'
rows=[]
for i,ox,oy,xs,ys,peaks in [(870,57,153,[90,123,157,190,223],[153,119,84,49,14],[(164,28),(169,106)]),(1297,56,156,[89,123,156,190,223],[156,121,87,52,17],[(164,107),(169,27)]),(634,57,155,[90,123,156.5,189.5,223],[155,120,85,50,16],[(164,66),(169,66)]),(245,54.5,157,[87.5,120.5,154,187.5,220.5],[157,121,87,52,18],[(161.5,67)])]:
 x0,y0=ox*4,oy*4;b=line(x0,ys[-1]*4,x0,y0)+line(x0,y0,xs[-1]*4,y0)
 for v,px in zip([20,40,60,80,100],xs):b+=line(px*4,y0,px*4,y0+14)+F.label(px*4,y0+53,str(v),30)
 for v,py in zip([0,20,40,60,80],ys):b+=line(x0-14,py*4,x0,py*4)+F.label(x0-23,py*4+9,str(v),30,'end')
 for px,py in peaks:b+=line(px*4,y0,px*4,py*4,5)
 b+=F.label(560,y0+105,'m/z',32)+F.label(64,335,'Phần trăm số nguyên tử đồng vị (%)',29,extra='transform="rotate(-90 64 335)"')
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="760" viewBox="0 0 1000 760"><title>Phổ đồng vị theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms-cu-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
 rows.append(dict(sources[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Giữ vị trí đỉnh/tick nguồn bằng tọa độ pixel nhân4. Không tự bổ sung63/65 hoặc phầntrăm trên đỉnh; không thêmA/C/frame/grid/mũi tên.'))
(M/'cau-truc-ms-cu-ddh-lo-85-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
