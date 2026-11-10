"""Đồ thị HI nguồn847: một đường đỏ, lưới và mọi nhãn nguyên văn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9b9c1d9c9b66914c88b2649e351985f68dc12b22dcc203ecd4eb1c6e027f27d4';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="'+' '.join(f'M{x} 69V445' for x in [113,129,148,167,186,205,224,243,262,281,300,319,338,357,376,395,414,433,452,471,491])+' '+' '.join(f'M113 {y}H491' for y in [69,88,107,126,145,164,183,202,221,240,259,278,297,316,335,354,373,392,411,430,445])+'" fill="none" stroke="#00816e" stroke-width="0.8"/>'
b+='<path d="M113 69H491V445" fill="none" stroke="#001a17" stroke-width="0.9"/>'
b+='<path d="M113 9V445H593" fill="none" stroke="#0800b8" stroke-width="2"/><path d="M113 0L108 11L119 11Z M601 445L590 440L590 451Z" fill="#0800b8"/>'
# Mẫu đọc từ nét đỏ native; Hermite đơn điệu, không thêm marker.
points=[(113,445),(132,391),(151,340),(170,297),(189,262.5),(208,234.5),(227,211.5),(246,193),(265,177.5),(284,165.5),(303,155.5),(322,148.5),(341,143.5),(360,138.5),(379,134.5),(398,130.5),(417,127),(436,125.5),(455,125.5),(474,125.5),(482,125.5)]
sec=[(v[1]-u[1])/(v[0]-u[0]) for u,v in zip(points,points[1:])];slopes=[sec[0]]+[(0 if a*b<=0 else 2*a*b/(a+b))for a,b in zip(sec,sec[1:])]+[0]
curve='M113 445'
for j,((x,y),(u,v))in enumerate(zip(points,points[1:])):
 dx=(u-x)/3;curve+=f'C{x+dx:.3f} {y+slopes[j]*dx:.3f} {u-dx:.3f} {v-slopes[j+1]*dx:.3f} {u} {v}'
b+='<path d="'+curve+'" fill="none" stroke="#ed0000" stroke-width="1.8" stroke-linecap="round"/>'

b+='<path d="'+' '.join(f'M{x} 445V457' for x in [206,302,397,493])+' '+' '.join(f'M99 {y}H113' for y in [69,165,259,354])+'" fill="none" stroke="#001a17" stroke-width="0.8"/>'
for x,t in [(206,'1'),(302,'2'),(397,'3'),(493,'4')]:b+='<g transform="translate('+str(x)+' 486)skewX(-10)">'+F.label(0,0,t,27,fill='#001a17')+'</g>'
for y,t in [(77,'2,0'),(173,'1,5'),(267,'1,0'),(362,'0,5'),(461,'0')]:b+='<g transform="translate(96 '+str(y)+')skewX(-10)">'+F.label(0,0,t,27,anchor='end',fill='#001a17')+'</g>'
b+='<g transform="translate(34 254)rotate(-90)">'+F.label(0,0,'Lượng HI (mol)',29,weight='dam',fill='#001a17')+'</g>'
b+=F.label(324,526,'Thời gian',29,fill='#001a17')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="606" height="535" viewBox="0 0 606 535"><title>Đồ thị HI theo nguồn847</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='do-thi-hi-native847-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=847,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1redincreasingcurve-horizontalplateau/green20x20grid/blue2axes2filledheads/5Ycomma4Xlabels/Lượng HI (mol)trueDAM-Thời gianregular/noaddedplateauvalue-unit-legend-answer')
(K/'cau-truc-do-thi-hi-native847-ddh-lo-327-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
