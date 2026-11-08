"""Nguồn930: giữ tám H tường minh và ba chấm gốc tự do đúng dòng cơ sở."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a848b594db62f95204060e1f44837465fc1ecc269367f8434909c55b97def89b';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M31 72H53 M87 72H124 M116 65L124 72L116 79 M346 67H367 M346 74H367 M477 71H515 M507 64L515 71L507 78 M554 70H583 M610 70H635" fill="none" stroke="#252440" stroke-width="1.8"/>'
for x in [332,383,597,648]:
 b+=f'<path d="M{x} 32V57 M{x} 86V110" fill="none" stroke="#252440" stroke-width="1.8"/>'+F.label(x,81,'C',28)+F.label(x,27,'H',28)+F.label(x,134,'H',28)
for x,t in [(7,'R'),(60,'R'),(132,'2R'),(430,'R'),(532,'R')]:b+=F.label(x,81,t,28,'start')
b+=F.label(250,81,'và',28)+F.label(411,81,'+',28)
for x,y in [(175,71),(457,70),(671,70)]:b+=f'<circle cx="{x}" cy="{y}" r="5" fill="#252440"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="683" height="141" viewBox="0 0 683 141"><title>Giai đoạn khơi mào theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='khoi-mao-radical-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=930,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4explicitC8explicitH/3BASELINEsolidradicaldots/5Rtokensincl2Rcoefficient/1plus/2openVRIGHTarrows/vàliteral/reactantCCdouble→productCCsingle/noRexpansion-addedstages-condition-charge-answer.')
(K/'cau-truc-khoi-mao-radical-ddh-lo-280-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
