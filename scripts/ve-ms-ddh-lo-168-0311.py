"""Phổ khối lượng nguồn1176: giữ pixel height của mọi đỉnh đọc rõ, không chuẩn hóa."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());a=sorted(p['assets'],key=lambda x:x['hash'])[1176];refs={r['where']:r for r in json.loads((G/'docs/hinh-vector-0311/nguon/vi-tri-cong-khai.json').read_text())['refs']}
def line(d,w=1.5):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}"/>'
b='<g transform="translate(15 15)">'+line('M114 48H734V428H114Z')
for mass in range(10,62):
 x=114+(mass-10)*12;major=mass%5==0;b+=line(f'M{x} 428v{10 if major else 5}',1)
 if major:b+=F.label(x,461,str(mass),18)
for intensity in range(0,101,10):
 y=428-intensity*3.8;major=intensity%20==0;b+=line(f'M114 {y}h{-10 if major else -5}',1)
 if major:b+=F.label(100,y+6,str(intensity),18,'end')
# Các đỉnh yếu đã mở native/zoom riêng; chiều cao ở pixel nguồn, không theo phần trăm suy diễn.
peaks=[(15,421),(18,416),(26,424),(27,412),(28,398),(29,421),(30,49),(31,423),(39,422),(41,408),(42,419),(43,421),(44,424),(58,422),(59,391)]
for mass,top in peaks:
 x=114+(mass-10)*12;b+=line(f'M{x} 428V{top}',1.8)
for mass,y in [(15,417),(18,413),(27,410),(28,395),(39,418),(41,405),(58,418),(59,365)]:b+=F.label(114+(mass-10)*12,y,str(mass),16)
b+=F.label(346,69,'30',16,'end')+F.label(702,386,'[M]',20)+F.label(725,374,'+',15)
b+=F.label(420,490,'m/z',21)+'<g transform="translate(51 250) rotate(-90)">'+F.label(0,0,'Cường độ tương đối (%)',21)+'</g></g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="820" height="550" viewBox="0 0 820 550"><title>Phổ khối lượng theo dữ liệu nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
qs=[]
for q in p['questions']:
 hs=[h for h in q['hinh']if h['hash']==a['hash']]
 if hs:qs.append({'qid':q['qid'],'de':q['de'],'refs':[{'where':h['where'],'viTri':refs[h['where']]['viTri']}for h in hs]})
r={'i':1176,'hash':a['hash'],'fileNguon':a['file'],'questions':qs,'daMoNative':True,'svg':fn,'hashSvg':hh,'byteSvg':len(raw),'font':'DDH Rounded','hashPhong':F.HASH,'trangThai':'cho-soat-doc-lap','ghiChuDung':'MSplot10..61/0..100/ticksmajor5minor1/Ymajor20minor10/peaks15,18,26..31,39,41..44,58,59literalheight/label30tráiđỉnh100/[M]sup+/2axistitles;khôngnormalize/phụthêmmass%.','peaksNative':peaks}
(M/'cau-truc-ms-ddh-lo-168-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
