"""Nguồn341: đồ thị màu xám, điểm gãy theo pixel nguồn, không suy số liệu mới."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='3cc7d992ffc43196906bb619bbda4d46780256b6d9351d14d9daa87b36b05d24';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2,c='#888888',extra=''):return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" {extra}/>'
b='<defs><clipPath id="plot"><rect x="203" y="64" width="401" height="175"/></clipPath></defs><rect x="37" y="36" width="611" height="329" fill="none" stroke="#909090" stroke-width="1.8"/>'
for y in [64,108,152,196,239]:b+=line(f'M203 {y}H604',2,'#d4d4d4')+line(f'M195 {y}H203',2)
b+=line('M203 64V239')
for x,t in [(203,'0'),(260,'2'),(318,'4'),(375,'6'),(433,'8'),(490,'10'),(547,'12'),(604,'14')]:b+=F.label(x,278,t,22,fill='#595959')
for y,t in [(76,'2'),(120,'1.5'),(164,'1'),(208,'0.5'),(251,'0')]:b+=F.label(180,y,t,22,'end',fill='#595959')
b+=line('M204 237L260 188L374 141L432 109L489 66H604',6,'#7f7f7f','clip-path="url(#plot)" stroke-linejoin="round"')
b+='<g transform="translate(99 159) rotate(-90)">'+F.label(0,0,'số mol ethyl',24,weight='dam')+F.label(0,33,'alcohol',24,weight='dam')+'</g>'+F.label(639,354,'Ngày',24,'end',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="701" height="401" viewBox="0 0 701 401"><title>Đồ thị theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='do-thi-ethyl-alcohol-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=341,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='literalgraypolylineverticespixels204237-260188-374141-432109-48966-60466/8XlabelsNOXtickstems/5Ytickstubs-gridlines/decimalDOT/outerframe/rotated2lineboldytitle-Ngàydam/noextraarrows-markers-values/DDHpath.')
(K/'cau-truc-do-thi-ethyl-alcohol-ddh-lo-224-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
