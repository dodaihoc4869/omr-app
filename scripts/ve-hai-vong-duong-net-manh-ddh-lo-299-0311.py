"""Nguồn1256: hai vòng đường, mọi liên kết mảnh đều; giữ từng H/OH theo hình."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='e3f6591b5b8013543ad6f0bcd565f8892c109bd7d381fbca09e0b7563bd4e4ee';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M119 329L214 173H405 M466 209L538 333L446 493H214L119 329 M214 173V86 M215 173V241 M119 329V243 M119 329V424 M214 493V418 M214 493V579 M446 493V419 M446 493V579 M538 333V244 M538 333L635 389 M717 389L816 333L988 232 M1071 228L1240 329L1140 493H909L816 333 M816 333V167 M1240 329V245 M1240 329V421 M909 493V424 M909 493V573 M1140 493V423 M1140 493V577" fill="none" stroke="#222222" stroke-width="4.2" stroke-linecap="square" stroke-linejoin="miter"/>'
for x,y in [(215,302),(119,224),(214,639),(446,405),(538,227),(909,413),(1140,639),(1240,234)]:b+=F.label(x,y,'H',68,fill='#222222')
for x,y in [(446,198),(676,438),(1028,234)]:b+=F.label(x,y,'O',68,fill='#222222')
# Nhãn OH/HO neo chính chữ O vào nhánh; giữ thứ tự HO từ nguồn.
def hydroxyl(x,y,t):
 global b
 a=F.advance('O',68);prefix=F.advance('H',68)if t=='HO'else 0
 b+=F.label(x-a/2-prefix,y,t,68,anchor='start',fill='#222222')
for x,y,t in [(119,485,'HO'),(214,405,'OH'),(446,641,'OH'),(909,645,'OH'),(1140,409,'HO')]:hydroxyl(x,y,t)
for x,y in [(194,68),(787,143),(1210,484)]:
 b+=F.label(x,y,'CH',68,anchor='start',fill='#222222');a=F.advance('CH',68)
 b+=F.label(x+a,y+12,'2',44,anchor='start',fill='#222222')+F.label(x+a+F.advance('2',44),y,'OH',68,anchor='start',fill='#222222')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1457" height="672" viewBox="0 0 1457 672"><title>Hai vòng đường nét mảnh theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hai-vong-duong-net-manh-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1256,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1sixring1fivering/12C11O/3CH2OH8standaloneH5freeOH2ringO1bridgeO/ALLbondsTHINuniform0TAPER0bold/leftHO-rightHOliteral/regularDDH/noaddednums-stereo-caption-name-answer.')
(K/'cau-truc-hai-vong-duong-net-manh-ddh-lo-299-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
