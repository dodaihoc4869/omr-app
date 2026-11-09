"""Hai phản ứng giữ cùng sản phẩm và mọi nhãn theo nguồn, không thêm nước."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ef28b1d6ec68ca36a0b3f931b8f727d688f0e743e3e54db2abb0193e8bb60a07';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
def path(d):return '<path d="'+d+'" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
def label(x,y,t,size=29,anchor='middle'):return F.label(x,y,t,size,anchor=anchor,fill='#111')
for off,cx,num in [(0,52,'1'),(618,661,'2')]:
 b+=f'<ellipse cx="{cx}" cy="113" rx="12.5" ry="14" fill="none" stroke="#111" stroke-width="2.2"/>'+label(cx,124,num,25)
 # Acide: hai chân carbonyl tách trên nhánh chéo, không nối thành cầu dọc.
 b+=path(f'M{83+off} 113H{123+off}L{137+off} 95 M{119+off} 113L{138+off} 135 M{125.333+off} 110L{143+off} 132')
 b+=label(149+off-F.advance('O',29)/2,94,'OH',anchor='start')+label(146+off,158,'O')
 # Dấu cộng giữa hai chất là dữ kiện nguyên bản.
 b+=label(193+off,126,'+',28)
for start,end in [(331,400),(936,1004)]:
 b+=path(f'M{start} 113H{end-9}')
 b+=f'<path d="M{end} 113L{end-13} 107L{end-10} 113L{end-13} 119Z" fill="#111"/>'
 x=(start+end)/2;b+=label(x-5,102,'H',28)+label(x+11,88,'+',17)
# Isopropanol: HO neo tâm O phía phải; carbon giữa có hai đầu trần.
b+=path('M257 112L280 98V57 M280 98L313 118')
b+=label(248+F.advance('O',29)/2,132,'HO',anchor='end')
# Propene có hai nét chéo trái, một nhánh phải; không thêm H/C.
b+=path('M833 117L872 95L910 117 M840 123L872 103')
for off in [0,605]:
 b+=path(f'M{415+off} 113H{457+off}L{470+off} 95 M{453+off} 113L{472+off} 135 M{459.333+off} 110L{477+off} 132 M{497+off} 79H{524+off}L{539+off} 53 M{524+off} 79L{544+off} 103')
 b+=label(482+off,92,'O')+label(483+off,158,'O')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1215" height="196" viewBox="0 0 1215 196"><title>Hai phản ứng tạo cùng ester theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hai-cach-tao-ester-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1320,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2panels2circlednums/acid+isopropanol→ester;acid+propene→sameester/2filledRIGHTheads2Hsupplus/4COdouble1CCdouble/20C9Ototal/regularDDH/allthin/noaddedH2O-coeff-caption-answer')
(K/'cau-truc-hai-cach-tao-ester-ddh-lo-305-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
