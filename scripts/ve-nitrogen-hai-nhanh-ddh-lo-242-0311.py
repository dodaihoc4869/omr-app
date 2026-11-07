"""Nguồn530: giữ hai nhánh, chín mũi tên và các biến chưa được giải tên."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='641e4ecaa477c9e1b1e9f37d6c250f99508df13b2a394734b6b8d6d4a6b4ad16'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.1"/>'
def arrow(x1,y,x2):
 return line(f'M{x1} {y}H{x2-5}')+f'<path d="M{x2} {y}L{x2-8} {y-2.6}L{x2-6} {y}L{x2-8} {y+2.6}Z" fill="#252440"/>'
b=line('M91 45L47 93L92 142')
for x1,y,x2 in [(91,45,164),(222,45,295),(375,46,466),(509,44,580),(92,142,164),(207,142,280),(336,142,408),(471,142,563),(602,141,675)]:b+=arrow(x1,y,x2)
for x,y,t,anchor in [(23,108,'N₂','middle'),(194,54,'NO','middle'),(335,54,'NO₂','middle'),(490,53,'Y','middle'),(590,53,'Ca(NO₃)₂','start'),(187,152,'M','middle'),(308,152,'NO','middle'),(439,152,'NO₂','middle'),(582,152,'Y','middle'),(681,151,'NH₄NO₃','start')]:b+=F.label(x,y,t,28,anchor)
for x,y,t in [(128,33,'+ (X)'),(258,33,'+ (X)'),(418,32,'+ (X) + H₂O'),(546,29,'+ (Z)'),(131,131,'+ H₂'),(246,130,'+ (X)'),(376,130,'+ (X)'),(517,129,'+ (X) + H₂O'),(640,127,'+ (M)')]:b+=F.label(x,y,t,17)
for x,y,t in [(128,70,'(1)'),(258,70,'(2)'),(409,72,'(3)'),(545,66,'(4)'),(132,168,'(5)'),(246,168,'(6)'),(376,168,'(7)'),(517,167,'(8)'),(640,165,'(9)')]:b+=F.label(x,y,t,18)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="179" viewBox="0 0 800 179"><title>Sơ đồ nitrogen hai nhánh theo nguồn</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='nitrogen-hai-nhanh-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=530,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2branches9RIGHTheads9numbers1..9/all9conditionsliteral/Ca(NO3)2-NH4NO3subs/N2-M-NO-NO2-Y/NOanswers-X-Y-Z-M/noaddedphase-temperature-catalyst-caption/DDHpath.')
(K/'cau-truc-nitrogen-hai-nhanh-ddh-lo-242-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
