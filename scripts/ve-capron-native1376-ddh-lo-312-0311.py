"""Nguồn1376: dựng riêng vòng lactam và polymer rút gọn theo ảnh này."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='f8afcc4bd31d12311c39a7e60974838675ce5e8a8d3c8ac1270cb253016c619d';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.6):return f'<path d="{d}" fill="none" stroke="#111" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def label(x,y,t,z=30,anchor='middle'):return F.label(x,y,t,z,anchor=anchor,fill='#111')
b=path('M148 106L127 75H83L52 109V142L80 170L133 167L148 142 M125 75L134 61 M129 78L138 64')
b+=label(145,60,'O')+label(141,136,'NH',30,'start')+label(36,132,'n')
b+=path('M219 125H364',2.4)+'<path d="M375 125L362 119V131Z" fill="#111"/>'
t='xúc tác, t';b+=label(230,113,t,26,'start')+label(230+F.advance(t,26)+2,100,'o',17,'start')
b+=path('M398 125H428 M679 125H710 M426 99Q401 125 426 154 M680 95Q706 125 680 151')
b+=label(431,133,'HN – [CH₂]₅ – CO',30,'start')+label(704,154,'n',29)+label(806,133,'(1)',30)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="865" height="198" viewBox="0 0 865 198"><title>Phản ứng theo nguồn1376</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='capron-native1376-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1376,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='7memberlactam6C1N1O/1COdoubleUPRIGHT/NHliteral/coefficientnBASELINE/1filledRIGHT/xúc tác,t smallSUPo/HN–[CH2]5–CO/outerROUNDnSUB-innerSQUARE5SUB/2crossboundaryfreebonds/(1)farRIGHT/regularDDH/noaddedH2O-names-temp-answer/noalias685')
(K/'cau-truc-capron-native1376-ddh-lo-312-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
