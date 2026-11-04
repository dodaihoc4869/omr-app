"""Phương án D nguồn314, một cột literal, không thêm khối lượng hoặc sửa đáp án."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());a=sorted(p['assets'],key=lambda x:x['hash'])[314];refs={r['where']:r for r in json.loads((G/'docs/hinh-vector-0311/nguon/vi-tri-cong-khai.json').read_text())['refs']}
def line(d,w=1.4):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}"/>'
b='<g transform="translate(15 15)">'+line('M112 35V249H367')
for x,t in [(163,20),(214,40),(265,60),(316,80),(367,100)]:b+=line(f'M{x} 249v8',1.2)+F.label(x,278,str(t),17)
for y,t in [(249,0),(195,20),(142,40),(88,60),(35,80)]:b+=line(f'M112 {y}h-8',1.2)+F.label(95,y+6,str(t),17,'end')
b+=line('M276 249V112',1.8)+F.label(240,307,'m/z',19)+'<g transform="translate(45 162) rotate(-90)">'+F.label(0,0,'Phần trăm số nguyên tử đồng vị (%)',15)+'</g></g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="455" height="355" viewBox="0 0 455 355"><title>Phương án phổ một cột theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms-pa-d-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
qs=[]
for q in p['questions']:
 hs=[h for h in q['hinh']if h['hash']==a['hash']]
 if hs:qs.append({'qid':q['qid'],'de':q['de'],'refs':[{'where':h['where'],'viTri':refs[h['where']]['viTri']}for h in hs]})
r={'i':314,'hash':a['hash'],'fileNguon':a['file'],'questions':qs,'daMoNative':True,'svg':fn,'hashSvg':hh,'byteSvg':len(raw),'font':'DDH Rounded','hashPhong':F.HASH,'trangThai':'cho-soat-doc-lap','ghiChuDung':'Source314mộtcột(x276top112baseline249)/Y0..80/X20..100/2titles,no%/masslabel/khôngsửaheightthành100. Vếtmựcrờiquanhx207y145..170khôngnốibaselinecầnsoátđộclậpclassificationnoise,khôngtựthànhpeak.'}
(M/'cau-truc-ms-pa-d-ddh-lo-172-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
