from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='5c0020a71d7db570450b9e4b774957fec7e1cfb3f18e3fe1dbca71ffa8585bda';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M60 44L104 17L149 42V94L193 118L237 93V44L282 18L326 42V81L371 105L415 81V31L459 5L504 31V81L548 106L592 81V30L637 5L681 30V81 M155 89L193 111 M244 48L282 25 M333 77L371 99 M422 34L459 12 M510 77L548 99 M599 34L637 12 M60 44V81 M63 42.16L24 18 M60 48L20 23" fill="none" stroke="#5c5c5c" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>'
b+=F.label(14,21,'O',17,fill='#383838')+F.label(54,96,'OH',17,anchor='start',fill='#383838')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="700" height="124" viewBox="0 0 700 124"><title>Mạch acid béo sáu nối đôi</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='acid-beo-sau-noi-doi-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=500,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='22bareC2O/6CCdouble1COdouble/COOHleftOHdown/freeRIGHTDOWN/allthinuniform/regularDDH/noaddedCnums-H-stereo-caption-name-answer')
(K/'cau-truc-acid-beo-sau-noi-doi-ddh-lo-302-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(500,hh,len(raw))
