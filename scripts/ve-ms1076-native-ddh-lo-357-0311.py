"""Dựng phổ phenol1076 từ native riêng, giữ cả năm peak yếu không nhãn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='c1d8dd87b018d9dd38c8850a70100a7563943db20253deec3a7d0be9564f59e4';b=''
def line(a,c='#808080',w=1.5):
 (x,y),(u,v)=a
 return f'<path d="M{x} {y}L{u} {v}" stroke="{c}" stroke-width="{w}" fill="none"/>'
g=json.loads((K/'doc-ms1076-lo-357.json').read_text())['builderGeometry']
for a in g['peaks']:b+=line([[a[0],a[1]],[a[0],404]],'#666666',a[2])
for x,y,t in [(113,392,'27'),(143,335,'40'),(180,348,'55'),(209,189,'66'),(233,392,'77'),(274,38,'94')]:b+=F.label(x,y,t,22,fill='#202020')
b+=line([[92,6],[92,404]],'#999999')+line([[92,404],[419,404]],'#999999')
for y,t in [(403,'0'),(331,'20'),(259,'40'),(187,'60'),(115,'80'),(43,'100')]:
 if y!=403:b+=line([[85,y],[92,y]],'#999999')
 b+=F.label(85,y+7,t,22,anchor='end',fill='#202020')
b+=line([[289,404],[289,412]],'#999999')+F.label(289,434,'100',22,fill='#202020')
b+='<g transform="translate(29 196) rotate(-90)">'+F.label(0,0,'Cường độ tương đối (%)',23,fill='#202020')+'</g>'
b+='<g transform="translate(402 434) skewX(-12)">'+F.label(0,0,'m/z',22,fill='#202020')+'</g>'
ring=[(314,162),(352,140),(390,162),(390,206),(352,228),(314,206)]
for j,v in enumerate(ring):b+=line([v,ring[(j+1)%6]],'#505050')
b+='<ellipse cx="352" cy="184" rx="24.5" ry="24.5" stroke="#505050" stroke-width="1.5" fill="none"/>'
b+=line([[352,140],[352,128]],'#505050')+F.label(341,124,'OH',24,anchor='start',fill='#202020')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="428" height="441" viewBox="0 0 428 441"><title>Phổ khối lượng theo nguồn1076</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ms1076-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=1076,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='11UPpeaks6labels27-40-55-66-77-94/5weakUNLABELLED/1X100-6Yincl0-6tickstems/GRAYaxes-darkgraypeaks/6bareC1innercircle-OHfirstOanchor/regularUPRIGHTnums-Yrotated-mzREGULARITALIC/0heads0grid/noadded3double-formula-answer-intensityinference')
(K/'cau-truc-ms1076-native-ddh-lo-357-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
