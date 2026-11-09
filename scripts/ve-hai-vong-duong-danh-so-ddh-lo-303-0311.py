"""Hai vòng đường có số carbon; nhánh ngoài giữ carbon trần và OH riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ed3df6e23bc60160c79a0d2b9fe4fe2d06889cf225c192f6d52adec261715a32';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M95 191L169 131H272 M294 140L360 191L386 222 M405 221L434 191L567 159 M591 160L722 194 M169 131V82L202 62 M95 191V239 M169 250V213 M283 250V291 M434 191V138L467 118 M488 251V293 M667 251V212 M722 194V248L755 269" fill="none" stroke="#151515" stroke-width="2.2" stroke-linecap="square" stroke-linejoin="miter"/>'
b+='<path d="M95 191L169 246.25L169 253.75Z M360 191L283 246.25L283 253.75Z M434 191L488 247.25L488 254.75Z M722 194L667 247.25L667 254.75Z" fill="#090909"/>'
b+='<path d="M169 250H283 M488 251H667" stroke="#090909" stroke-width="7.5"/>'
for x,y in [(283,141),(395,239),(578,167)]:b+=F.label(x,y,'O',23,fill='#151515')
# Neo riêng tâm chữ O của mọi OH vào nhánh; không thêm CH2/H khác.
for x,y in [(211,64),(95,258),(169,209),(283,312),(476,119),(488,313),(667,207),(764,285)]:
 b+=F.label(x-F.advance('O',23)/2,y,'OH',23,anchor='start',fill='#151515')
for x,y,t in [(161,85,'6'),(172,150,'5'),(86,195,'4'),(168,275,'3'),(278,240,'2'),(360,185,'1'),(426,140,'1'),(425,190,'2'),(496,240,'3'),(670,274,'4'),(730,199,'5'),(733,248,'6')]:b+=F.label(x,y,t,15,fill='#151515')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="965" height="371" viewBox="0 0 965 371"><title>Hai vòng đường đánh số theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hai-vong-duong-danh-so-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1312,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1sixring1fivering/12bareC11O/12Cnums/3bentbareC-OHbranches5freeOH/2ringO1bridgeO/4TAPER2frontbold/0explicitH0CH2OH/regularDDH/noaddedcaption-name-answer')
(K/'cau-truc-hai-vong-duong-danh-so-ddh-lo-303-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
