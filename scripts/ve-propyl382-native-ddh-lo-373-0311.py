"""Este nguồn382: giữ nhánh cắt ở mép dưới, không phục hồi nguyên tử ngoài ảnh."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-propyl382-lo-373.json').read_text());h=p['hash'];g=p['geometry'];b=''
def path(v):
 return '<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+'" stroke="#252525" stroke-width="2" fill="none"/>'
for v in [g['leftAcylPath'],g['CCDouble']['innerParallel'],g['croppedBranch']['visibleShaft'],*g['carbonyl']['rays'],g['esterO']['leftBond'],[g['esterO']['rightBond'][0],*g['rightPath']]]:b+=path(v)
b+=F.label(140,25,'O',28,fill='#252525')+F.label(195,104,'O',30,fill='#252525')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="335" height="106" viewBox="0 0 335 106"><title>Este theo phần nhìn thấy của nguồn382</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='propyl382-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=382,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='7FULLvisiblebareC+1branchDOWNthroughBOTTOMcrop-endpointUNKNOWN-totalCUNKNOWN/2OregularUPRIGHT/1CCdouble1COdouble2splitfeetCONTACTslopes-nativeV-NOcrossbar/335x106nativecropKEEP/0arrows-stereo-captions/noaddedH-methylendpoint-8Cclaim-name-IRnumbers-answer-noalias')
(K/'cau-truc-propyl382-native-ddh-lo-373-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
