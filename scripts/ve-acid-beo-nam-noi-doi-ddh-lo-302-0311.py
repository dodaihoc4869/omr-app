from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ebadb072c98aeeb9cf5f5cfb164efcc6df94f5714b87aa7eb4035e8d84cb1657';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M65 49L110 24L155 50V102L201 128L246 102V52L290 25L336 51V90L381 115L426 90V38L471 12L517 38V90L561 115L606 90V38L652 12 M201 121L240 98 M291 32L330 54 M382 108L420 86 M472 19L511 42 M562 108L600 86 M65 49V92 M68 47.33L28 26 M65 53L24 31" fill="none" stroke="#5c5c5c" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>'
b+=F.label(19,28,'O',17,fill='#383838')+F.label(59,106,'OH',17,anchor='start',fill='#383838')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="661" height="132" viewBox="0 0 661 132"><title>Mạch acid béo năm nối đôi</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='acid-beo-nam-noi-doi-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1301,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='20bareC2O/5CCdouble1COdouble/COOHleftOHdown/freeRIGHTUP/allthinuniform/regularDDH/noaddedCnums-H-stereo-caption-name-answer')
(K/'cau-truc-acid-beo-nam-noi-doi-ddh-lo-302-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(1301,hh,len(raw))
